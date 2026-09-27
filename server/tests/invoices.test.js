import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildInvoicePdf, invoiceNumberFor } from '../src/services/invoice.service.js';

const booking = {
    _id: '67f10ea186820a5d02960100',
    serviceName: 'Electrical repair and safety inspection',
    customerName: 'Aarav Patel',
    workerName: 'Ramesh Shah',
    cooperativeName: 'Ahmedabad Skilled Workers Cooperative',
    scheduledTime: { start: '2026-09-27T04:00:00.000Z' },
    status: 'COMPLETED',
    endOTP: { usedAt: '2026-09-27T07:00:00.000Z', hash: 'NEVER_PRINT_OTP_HASH', salt: 'NEVER_PRINT_OTP_SALT' },
};
const payment = {
    _id: '67f10ea186820a5d02960200',
    amount: 125050,
    currency: 'INR',
    status: 'released',
    mode: 'test',
    razorpayOrderId: 'order_RazorpayTest1234567',
    razorpayPaymentId: 'pay_RazorpayTest1234567',
    razorpaySignature: 'NEVER_PRINT_SIGNATURE',
    paidAt: '2026-09-27T03:00:00.000Z',
    releasedAt: '2026-09-27T07:00:00.000Z',
    invoiceIssuedAt: '2026-09-27T07:00:00.000Z',
    refundStatus: 'not_applicable',
};

function verifyPdf(buffer) {
    assert.ok(Buffer.isBuffer(buffer));
    const pdf = buffer.toString('ascii');
    assert.ok(pdf.startsWith('%PDF-1.4'));
    assert.ok(pdf.endsWith('%%EOF\n'));
    const xrefPosition = Number(pdf.match(/startxref\n(\d+)/)[1]);
    assert.equal(pdf.slice(xrefPosition, xrefPosition + 4), 'xref');
    const xref = pdf.slice(xrefPosition).split('\n');
    const objectCount = Number(xref[1].split(' ')[1]) - 1;
    for (let id = 1; id <= objectCount; id += 1) {
        const offset = Number(xref[id + 2].slice(0, 10));
        assert.equal(pdf.slice(offset, offset + `${id} 0 obj`.length), `${id} 0 obj`);
    }
    for (const match of pdf.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
        assert.equal(Buffer.byteLength(match[2], 'ascii'), Number(match[1]));
    }
    for (const match of pdf.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)) {
        assert.ok(Number(match[1]) >= 48 && Number(match[1]) < 548, 'Text starts inside horizontal margins');
        assert.ok(Number(match[2]) >= 25 && Number(match[2]) < 806, 'Text stays inside page bounds');
    }
    assert.doesNotMatch(pdf, /NEVER_PRINT_/);
    return pdf;
}

assert.equal(invoiceNumberFor(booking, payment), 'SS-2026-67F10EA186820A5D02960200');
assert.notEqual(invoiceNumberFor(booking, payment), invoiceNumberFor(booking, { ...payment, _id: '67f10ea186820a5d12960200' }));
assert.equal(invoiceNumberFor(booking, { ...payment, invoiceNumber: 'SS-EXISTING-0001' }), 'SS-EXISTING-0001');
const released = buildInvoicePdf(booking, payment);
const releasedText = verifyPdf(released);
for (const expected of ['1250.50 INR', 'Payment Released', 'End OTP verified', 'TEST MODE', 'Aarav Patel', 'Ramesh Shah', 'Ahmedabad Skilled Workers Cooperative', payment.razorpayOrderId, payment.razorpayPaymentId]) {
    assert.ok(releasedText.includes(expected), `Invoice includes ${expected}`);
}
assert.ok(releasedText.includes('SS-2026-67F10EA186820A5D02960200'));
assert.match(releasedText, /27 Sept? 2026, 12:30 IST/);

const locked = buildInvoicePdf({ ...booking, status: 'IN_PROGRESS', endOTP: undefined }, { ...payment, status: 'escrow_locked', releasedAt: null, invoiceIssuedAt: null });
const lockedText = verifyPdf(locked);
assert.match(lockedText, /Work Started - Escrow Locked/);
assert.match(lockedText, /Release remains locked/);
assert.doesNotMatch(lockedText, /Payment Released|Release recorded|after End OTP verification|End OTP verified/);

const refunded = buildInvoicePdf(booking, { ...payment, status: 'refunded', refundStatus: 'processed', razorpayRefundId: 'rfnd_Test123', refundedAt: '2026-09-28T03:00:00.000Z' });
const refundText = verifyPdf(refunded);
assert.match(refundText, /Refunded/);
assert.match(refundText, /Processed/);
assert.match(refundText, /rfnd_Test123/);

const long = buildInvoicePdf({
    ...booking,
    serviceName: `${'Detailed electrical maintenance and installation '.repeat(20)}FINALSERVICE`,
    customerName: `${'Alexandra María (Customer) '.repeat(20)}FINALCUSTOMER`,
    workerName: `${'Ramesh '.repeat(30)}FINALWORKER`,
    cooperativeName: `${'Gujarat Community Skilled Workers Cooperative '.repeat(20)}FINALCOOPERATIVE`,
    location: { serviceAddress: { street: 'A'.repeat(380), city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' } },
}, { ...payment, mode: 'live' });
const longText = verifyPdf(long);
assert.ok(Number(longText.match(/\/Type \/Pages .*?\/Count (\d+)/)[1]) > 1);
for (const expected of ['FINALSERVICE', 'FINALCUSTOMER', 'FINALWORKER', 'FINALCOOPERATIVE']) assert.ok(longText.includes(expected));
assert.doesNotMatch(longText, /TEST MODE/);
assert.match(longText, /Mar\\355a/); // Latin accents remain readable through WinAnsi.

const unicode = verifyPdf(buildInvoicePdf({ ...booking, customerName: 'मुकुंद' }, payment));
assert.match(unicode, /U\+92E/);
assert.match(unicode, /original spelling/);
assert.throws(() => buildInvoicePdf(booking, { ...payment, amount: Number.NaN }), /minor units/);
assert.throws(() => buildInvoicePdf(booking, { ...payment, amount: 12.5 }), /minor units/);

// Optional representative documents for visual QA; test runs otherwise write no files.
if (process.env.INVOICE_QA_DIR) {
    mkdirSync(process.env.INVOICE_QA_DIR, { recursive: true });
    for (const [name, buffer] of Object.entries({ released, locked, refunded, long })) {
        writeFileSync(path.join(process.env.INVOICE_QA_DIR, `${name}.pdf`), buffer);
    }
}
console.log('PASS: Invoices preserve payment identity, status, gateway references, dates and refunds');
console.log('PASS: Locked invoices do not claim release; test payments are visibly marked');
console.log('PASS: PDF offsets, streams, page bounds, long fields, escaping and sensitive-field exclusion are valid');
