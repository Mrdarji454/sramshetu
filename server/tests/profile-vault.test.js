import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { inMemoryUsers } from '../src/services/auth.service.js';
import { inMemoryBookings } from '../src/services/booking.service.js';
import { OtpService } from '../src/services/otp.service.js';
import { UserService } from '../src/services/user.service.js';
import { EmailVerificationService } from '../src/services/emailVerification.service.js';

const ownerId = '65f123456789012345678a01';
const otherId = '65f123456789012345678a02';
const adminId = '65f123456789012345678a03';
for (const [id, role] of [[ownerId, 'USER'], [otherId, 'USER'], [adminId, 'ADMIN']]) {
    inMemoryUsers.set(id, {
        id,
        _id: id,
        name: role === 'ADMIN' ? 'Admin Test' : `Customer ${id.slice(-2)}`,
        email: `${id.slice(-2)}@example.test`,
        phone: `+9198765432${id.slice(-2)}`,
        role,
        password: 'not-returned',
        phoneVerified: id !== otherId,
        emailVerified: false,
        savedAddresses: [],
        preferences: { language: 'en', notifications: { email: false, sms: false, push: false } },
    });
}

let passed = 0;
async function test(name, action) {
    await action();
    passed++;
    console.log(`PASS: ${name}`);
}
const address = (street, label = 'Home') => ({
    label, street, city: 'Pune', state: 'Maharashtra', pincode: '411001',
    landmark: '', coordinates: [73.8, 18.5],
});

const firstAddress = await UserService.addAddress(ownerId, address('17 Lake Road'));
const secondAddress = await UserService.addAddress(ownerId, address('Office Road', 'Work'));
await test('Saved addresses create a default and allow selecting another default', async () => {
    assert.equal(firstAddress.isDefault, true);
    assert.equal(secondAddress.isDefault, false);
    const selected = await UserService.setDefaultAddress(ownerId, secondAddress.id);
    assert.equal(selected.find(item => item.id === secondAddress.id).isDefault, true);
    assert.equal(selected.find(item => item.id === firstAddress.id).isDefault, false);
});
await test('Address update and delete preserve a default address', async () => {
    const updated = await UserService.updateAddress(ownerId, secondAddress.id, address('Updated Office', 'Work'));
    assert.equal(updated.street, 'Updated Office');
    const remaining = await UserService.deleteAddress(ownerId, secondAddress.id);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, firstAddress.id);
    assert.equal(remaining[0].isDefault, true);
});
await test('Address operations cannot access another customer profile', async () => {
    await assert.rejects(() => UserService.updateAddress(otherId, firstAddress.id, address('Intrusion')), { statusCode: 404 });
    assert.equal((await UserService.getProfile(ownerId)).addresses[0].street, '17 Lake Road');
});
await test('Phone changes require server-verified OTP', async () => {
    const newPhone = '+919876543219';
    await assert.rejects(() => UserService.updateProfile(ownerId, { phone: newPhone }), { statusCode: 403 });
    const sent = await OtpService.sendOtp(newPhone);
    await OtpService.verifyOtp(newPhone, sent.debugOtp);
    const updated = await UserService.updateProfile(ownerId, { phone: newPhone });
    assert.equal(updated.phone, newPhone);
    assert.equal(updated.phoneVerified, true);
});
await test('Existing phone can be verified in place after OTP verification', async () => {
    const user = inMemoryUsers.get(otherId);
    await assert.rejects(() => UserService.verifyCurrentPhone(otherId), { statusCode: 403 });
    const sent = await OtpService.sendOtp(user.phone);
    await OtpService.verifyOtp(user.phone, sent.debugOtp);
    const updated = await UserService.verifyCurrentPhone(otherId);
    assert.equal(updated.phone, user.phone);
    assert.equal(updated.phoneVerified, true);
});
await test('Email becomes verified only after redeeming its one-time code', async () => {
    let deliveredCode;
    const targetEmail = 'verified@example.test';
    const requested = await EmailVerificationService.request(
        ownerId,
        targetEmail,
        async ({ to, code }) => { assert.equal(to, targetEmail); deliveredCode = code; },
    );
    assert.equal(requested.email, targetEmail);
    assert.equal(requested.code, undefined);
    await assert.rejects(
        () => UserService.updateProfile(ownerId, { email: targetEmail }),
        { statusCode: 403 },
    );
    const verified = await EmailVerificationService.verify(ownerId, targetEmail, deliveredCode);
    assert.deepEqual(verified, { email: targetEmail, emailVerified: true });
    assert.equal((await UserService.getProfile(ownerId)).emailVerified, true);
    await assert.rejects(
        () => EmailVerificationService.verify(ownerId, targetEmail, deliveredCode),
        { statusCode: 400 },
    );
});

const vaultBookings = [
    { _id: 'vault-pending-a', id: 'vault-pending-a', customer: ownerId, serviceName: 'Plumbing', status: 'PENDING', paymentStatus: 'pending', price: { totalAmount: 1000, currency: 'INR' }, createdAt: new Date('2026-01-01T10:00:00Z') },
    { _id: 'vault-pending-b', id: 'vault-pending-b', customer: ownerId, serviceName: 'Electrical', status: 'COMPLETED', paymentStatus: 'pending', price: { totalAmount: 250, currency: 'INR' }, createdAt: new Date('2026-01-02T10:00:00Z') },
    { _id: 'vault-paid', id: 'vault-paid', customer: ownerId, serviceName: 'Repair', status: 'COMPLETED', paymentStatus: 'released', price: { totalAmount: 400, currency: 'INR' }, paymentProvider: { transactionId: 'provider-txn-1', confirmedAt: new Date(), status: 'captured', method: { providerName: 'UPI', last4: '1122', fullAccountNumber: '123456789012' } } },
    { _id: 'vault-refund', id: 'vault-refund', customer: ownerId, serviceName: 'Carpentry', status: 'CANCELLED', paymentStatus: 'refunded', price: { totalAmount: 125, currency: 'INR' }, paymentProvider: { transactionId: 'provider-txn-2', confirmedAt: new Date(), status: 'refunded' } },
    { _id: 'vault-unconfirmed-completion', id: 'vault-unconfirmed-completion', customer: ownerId, serviceName: 'Painting', status: 'COMPLETED', paymentStatus: 'released', price: { totalAmount: 900, currency: 'INR' } },
];
for (const booking of vaultBookings) inMemoryBookings.set(booking.id, booking);

await test('Vault totals require provider-confirmed paid and refund records', async () => {
    const vault = await UserService.getVault(ownerId);
    assert.equal(vault.summary.paidAmount, 400);
    assert.equal(vault.summary.pendingAmount, 1250);
    assert.equal(vault.summary.refundAmount, 125);
    assert.equal(vault.paymentMethods.length, 1);
    assert.deepEqual(vault.paymentMethods[0], { id: 'UPI:1122', providerName: 'UPI', last4: '1122' });
    assert.equal(JSON.stringify(vault).includes('123456789012'), false);
    assert.equal(vault.transactions.find(item => item.bookingId === 'vault-unconfirmed-completion').providerConfirmed, false);
    assert.equal(vault.summary.paidAmount, 400, 'Completed booking without provider confirmation is excluded from paid total');
});

await test('Profile and address HTTP routes use authenticated identity and USER role', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}/api/users`;
        const tokenFor = id => jwt.sign({ id, role: inMemoryUsers.get(id).role }, config.jwt.secret);
        const ownerHeaders = { Authorization: `Bearer ${tokenFor(ownerId)}`, 'Content-Type': 'application/json' };
        const otherHeaders = { Authorization: `Bearer ${tokenFor(otherId)}`, 'Content-Type': 'application/json' };
        const adminHeaders = { Authorization: `Bearer ${tokenFor(adminId)}`, 'Content-Type': 'application/json' };
        const profileResponse = await fetch(`${base}/profile`, { headers: ownerHeaders });
        assert.equal(profileResponse.status, 200);
        const profile = (await profileResponse.json()).data;
        assert.equal(profile.id, ownerId);
        assert.equal(profile.password, undefined);

        const unverifiedPhone = inMemoryUsers.get(otherId).phone;
        const phoneOtp = await OtpService.sendOtp(unverifiedPhone);
        await OtpService.verifyOtp(unverifiedPhone, phoneOtp.debugOtp);
        const phoneVerifiedResponse = await fetch(`${base}/profile/phone/verify`, { method: 'POST', headers: otherHeaders });
        assert.equal(phoneVerifiedResponse.status, 200);
        assert.equal((await phoneVerifiedResponse.json()).data.phoneVerified, true);

        const created = await fetch(`${base}/addresses`, { method: 'POST', headers: ownerHeaders, body: JSON.stringify({ ...address('Route Only'), userId: otherId }) });
        assert.equal(created.status, 201);
        const createdAddress = (await created.json()).data;
        const foreignEdit = await fetch(`${base}/addresses/${createdAddress.id}`, { method: 'PATCH', headers: otherHeaders, body: JSON.stringify(address('Not Yours')) });
        assert.equal(foreignEdit.status, 404);
        assert.equal((await fetch(`${base}/profile`, { headers: adminHeaders })).status, 403);
        const forgedRegistration = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Forged Verification', phone: '+919876543299', email: 'forged@example.test', password: 'password123', role: 'USER', phoneVerified: true }),
        });
        assert.equal(forgedRegistration.status, 400);
        const ownerProfile = await UserService.getProfile(ownerId);
        assert(ownerProfile.addresses.some(item => item.id === createdAddress.id && item.street === 'Route Only'));
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});

for (const booking of vaultBookings) inMemoryBookings.delete(booking.id);
for (const id of [ownerId, otherId, adminId]) inMemoryUsers.delete(id);
console.log(`Profile and Vault: ${passed} tests passed`);
