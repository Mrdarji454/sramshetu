// PDF 1.4 with standard embedded-viewer fonts; no browser or network is needed.
// Amounts are taken from the verified Payment record in minor currency units.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM = PAGE_HEIGHT - 68;
const INK = '0.10 0.16 0.20';
const MUTED = '0.36 0.42 0.46';
const GREEN = '0.03 0.36 0.28';

// Adobe Helvetica widths, in thousandths of an em, for the ASCII character set.
const WIDTHS = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];

function printable(value) {
    return String(value ?? '').normalize('NFC')
        .replace(/[\u2010-\u2015\u2212]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/\u2026/g, '...')
        .replace(/\u20b9/g, 'INR ')
        .replace(/[^\x20-\x7e\xa0-\xff]/gu, character => /\s/u.test(character) ? ' ' : `[U+${character.codePointAt(0).toString(16).toUpperCase()}]`)
        .replace(/\s+/g, ' ').trim();
}

function literal(value) {
    return printable(value).replace(/[\\()\x80-\xff]/g, character => character.charCodeAt(0) > 127
        ? `\\${character.charCodeAt(0).toString(8).padStart(3, '0')}`
        : `\\${character}`);
}

function textWidth(value, size, bold = false) {
    const width = [...value].reduce((sum, character) => {
        const code = character.charCodeAt(0);
        return sum + (code >= 32 && code <= 126 ? WIDTHS[code - 32] : 1000);
    }, 0) * size / 1000;
    // Bold glyphs are wider; this conservative margin also avoids rounding clips.
    return width * (bold ? 1.12 : 1);
}

function wrap(value, width, size, bold = false) {
    const result = [];
    let line = '';
    for (const word of printable(value).split(' ')) {
        if (!word) continue;
        if (line && textWidth(`${line} ${word}`, size, bold) <= width) {
            line += ` ${word}`;
            continue;
        }
        if (line) result.push(line);
        line = '';
        for (const character of word) {
            if (line && textWidth(line + character, size, bold) > width) {
                result.push(line);
                line = '';
            }
            line += character;
        }
    }
    if (line) result.push(line);
    return result.length ? result : ['Not recorded'];
}

function dateText(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not recorded';
    return `${new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        hourCycle: 'h23', timeZone: 'Asia/Kolkata',
    }).format(date)} IST`;
}

function reference(value) {
    return value?._id ? String(value._id) : value ? String(value) : null;
}

export function invoiceNumberFor(booking, payment) {
    if (payment.invoiceNumber) return String(payment.invoiceNumber);
    const identity = reference(payment._id) || reference(booking._id);
    if (!identity) throw new TypeError('An invoice requires a persistent payment or booking ID');
    const issuedAt = payment.invoiceIssuedAt || payment.releasedAt || payment.paidAt || payment.createdAt;
    const year = issuedAt && !Number.isNaN(new Date(issuedAt).getTime()) ? new Date(issuedAt).getUTCFullYear() : 'UNDATED';
    return `SS-${year}-${identity.toUpperCase()}`;
}

function nameOf(snapshot, entity, fallback) {
    return snapshot || entity?.name || entity?.fullName || fallback;
}

function statusDetails(booking, payment) {
    const status = String(payment.status || '').toLowerCase();
    if (status === 'refunded') return ['Refunded', 'The payment refund is recorded below.'];
    if (status === 'released') return ['Payment Released', 'ShramSetu payment release was recorded after End OTP verification. This invoice records the application ledger; it is not bank settlement confirmation.'];
    if (['held', 'escrow_locked'].includes(status)) return [
        String(booking.status).toLowerCase() === 'in_progress' ? 'Work Started - Escrow Locked' : 'Escrow Locked',
        'Payment received. Release remains locked until work completion is verified with the End OTP.',
    ];
    if (status === 'failed') return ['Payment Failed', 'Payment has not been confirmed. This document is not proof of a successful payment.'];
    return ['Payment Pending', 'Payment has not been confirmed. This document is not proof of a successful payment.'];
}

/** Synchronous invoice renderer. Never includes Razorpay secrets, signatures or OTPs. */
export function buildInvoicePdf(booking, payment) {
    if (!booking || !payment) throw new TypeError('Booking and payment are required');
    if (!Number.isSafeInteger(payment.amount) || payment.amount < 0) throw new TypeError('Payment amount must be a non-negative integer in minor units');
    const currency = /^[A-Z]{3}$/.test(payment.currency || '') ? payment.currency : 'INR';
    const amount = `${(payment.amount / 100).toFixed(2)} ${currency}`;
    const number = invoiceNumberFor(booking, payment);
    const issuedAt = payment.invoiceIssuedAt || payment.releasedAt || payment.paidAt || payment.createdAt;
    const [status, statusNote] = statusDetails(booking, payment);
    const testMode = payment.mode === 'test' || payment.testMode === true;
    const pages = [];
    let commands;
    let y;

    const text = (value, x, top, size = 10, bold = false, color = INK) => {
        commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${(PAGE_HEIGHT - top - size).toFixed(2)} Tm (${literal(value)}) Tj ET`);
    };
    const line = (top, color = '0.85 0.89 0.89') => commands.push(`${color} RG 0.6 w ${MARGIN} ${(PAGE_HEIGHT - top).toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${(PAGE_HEIGHT - top).toFixed(2)} l S`);
    const newPage = () => {
        commands = [];
        pages.push(commands);
        text('SHRAMSETU', MARGIN, 37, 21, true, GREEN);
        text(pages.length === 1 ? 'DIGITAL INVOICE' : 'DIGITAL INVOICE / CONTINUED', MARGIN, 65, 9, true, MUTED);
        line(88);
        y = 106;
    };
    const ensure = height => { if (y + height > BOTTOM) newPage(); };
    const paragraph = (value, size = 9, color = MUTED) => {
        for (const item of wrap(value, CONTENT_WIDTH, size)) {
            ensure(size + 6);
            text(item, MARGIN, y, size, false, color);
            y += size + 5;
        }
    };
    const field = (label, value) => {
        const rows = wrap(value || 'Not recorded', CONTENT_WIDTH - 128, 10);
        ensure(Math.min(rows.length * 15 + 8, 65));
        text(label, MARGIN, y + 1, 9, true, MUTED);
        for (let index = 0; index < rows.length; index += 1) {
            if (y + 15 > BOTTOM) {
                newPage();
                text(`${label} (cont.)`, MARGIN, y + 1, 9, true, MUTED);
            }
            text(rows[index], MARGIN + 128, y, 10);
            y += 15;
        }
        y += 7;
    };
    const section = title => {
        ensure(64);
        y += 12;
        text(title, MARGIN, y, 11, true, GREEN);
        y += 21;
        line(y);
        y += 12;
    };

    newPage();
    field('Invoice number', number);
    field('Issued', dateText(issuedAt));
    if (testMode) {
        paragraph('TEST MODE - Razorpay test transaction. No real money was collected.', 9, GREEN);
        y += 8;
    }
    const statusRows = wrap(statusNote, CONTENT_WIDTH - 28, 9);
    const statusHeight = 68 + statusRows.length * 13;
    ensure(statusHeight);
    commands.push(`0.94 0.97 0.96 rg ${MARGIN} ${(PAGE_HEIGHT - y - statusHeight).toFixed(2)} ${CONTENT_WIDTH.toFixed(2)} ${statusHeight} re f`);
    text(status, MARGIN + 14, y + 11, 12, true, GREEN);
    text(`Recorded amount: ${amount}`, MARGIN + 14, y + 33, 12, true);
    for (let index = 0; index < statusRows.length; index += 1) text(statusRows[index], MARGIN + 14, y + 55 + index * 13, 9, false, MUTED);
    y += statusHeight + 7;

    section('Booking details');
    field('Booking ID', reference(booking._id));
    field('Service', booking.serviceName || booking.service?.name || 'Service booking');
    field('Customer', nameOf(booking.customerName, booking.customer, 'Customer not recorded'));
    field('Worker', nameOf(booking.workerName, booking.worker, booking.worker ? 'Assigned worker' : 'Not assigned'));
    field('Cooperative', nameOf(booking.cooperativeName, booking.cooperative, booking.cooperative ? 'Assigned cooperative' : 'Not assigned'));
    const address = booking.location?.serviceAddress || booking.serviceAddress;
    if (address) {
        const value = typeof address === 'string' ? address : [address.street, address.city, address.district, address.state, address.pincode].filter(Boolean).join(', ');
        if (value) field('Service address', value);
    }
    if (booking.scheduledTime?.start || booking.scheduledDate) field('Scheduled', dateText(booking.scheduledTime?.start || booking.scheduledDate));

    section('Payment details');
    field('Razorpay order ID', payment.razorpayOrderId);
    field('Razorpay payment ID', payment.razorpayPaymentId);
    field('Payment received', dateText(payment.paidAt));
    if (payment.releasedAt) field('Release recorded', dateText(payment.releasedAt));
    if (booking.endOTP?.usedAt) field('End OTP verified', dateText(booking.endOTP.usedAt));
    const refundStatus = payment.refundStatus || booking.refundStatus;
    if (refundStatus && refundStatus !== 'not_applicable') {
        field('Refund status', ({ pending: 'Pending', processed: 'Processed', failed: 'Failed - review required' })[refundStatus] || refundStatus);
        if (payment.razorpayRefundId) field('Razorpay refund ID', payment.razorpayRefundId);
        if (payment.refundedAt) field('Refund recorded', dateText(payment.refundedAt));
    }
    y += 12;
    paragraph('Digitally generated from the booking and verified payment record. All timestamps use India Standard Time (IST).');
    const containsUnsupportedScript = [number, booking.serviceName, booking.customerName, booking.workerName, booking.cooperativeName, booking.customer?.name, booking.worker?.name, booking.cooperative?.name]
        .some(value => /\[U\+[0-9A-F]+\]/.test(printable(value)));
    if (containsUnsupportedScript) paragraph('Characters outside the invoice font are preserved as Unicode codes [U+...]. See the booking for the original spelling.');

    for (let index = 0; index < pages.length; index += 1) {
        commands = pages[index];
        line(PAGE_HEIGHT - 48);
        text('ShramSetu / Payment record', MARGIN, PAGE_HEIGHT - 35, 8, false, MUTED);
        text(`Page ${index + 1} of ${pages.length}`, PAGE_WIDTH - MARGIN - 66, PAGE_HEIGHT - 35, 8, false, MUTED);
    }
    const pageIds = pages.map((_, index) => 5 + index * 2);
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ];
    for (let index = 0; index < pages.length; index += 1) {
        const stream = pages[index].join('\n');
        objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[index] + 1} 0 R >>`);
        objects.push(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
    }
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let index = 0; index < objects.length; index += 1) {
        offsets.push(Buffer.byteLength(pdf, 'ascii'));
        pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xref = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf, 'ascii');
}
