const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../../server');
const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Violation = require('../../src/models/violationModel');
const SystemSettings = require('../../src/models/systemSettingsModel');

const DAY = 86400000;
let mongo;
let operator;
let bplo;

const auth = user => 'Bearer ' + jwt.sign({
    id: user.id, role: user.role, tokenVersion: user.tokenVersion, tokenType: 'access'
}, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongo.getUri());
    [operator, bplo] = await User.create([
        { name: 'Example Operator', address: 'Gasan', contact: 'operator@batch2.test', password: 'FixtureExample!99', isVerified: true, role: 'operator' },
        { name: 'Example Reviewer', address: 'Gasan', contact: 'bplo@batch2.test', password: 'FixtureExample!99', isVerified: true, role: 'bplo_staff' }
    ]);
}, 90000);

beforeEach(async () => {
    await Franchise.deleteMany({});
    await Violation.deleteMany({});
    await SystemSettings.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
    server.close();
});

const create = fields => Franchise.create({
    operator: operator.id, fullName: operator.name, address: 'Gasan', zone: 'Central',
    made: '2024', make: 'Honda', motorNo: 'MOTOR-BA2', chassisNo: 'CHASSIS-BA2',
    plateNo: 'PLATE-BA2', todaName: 'BATODA', cedulaAddress: 'Gasan',
    cedulaDate: new Date(), cedulaSerialNo: 'FIXTURE001', paymentStatus: 'Unpaid', ...fields
});
const decide = (record, status) => request(app).put('/api/v1/franchises/' + record.id + '/status')
    .set('Authorization', auth(bplo)).send({ status });
const withdraw = record => request(app).put('/api/v1/franchises/' + record.id + '/cancel')
    .set('Authorization', auth(operator)).send({ cancelReason: 'Operator withdrew application' });
const renew = (record, fields = {}) => request(app).put('/api/v1/franchises/' + record.id + '/renew')
    .set('Authorization', auth(operator)).send(fields);
const verify = record => request(app).get('/api/v1/auth/verify/' + record.id);

describe('Batch 2 H7, H9 and M7', () => {
    it('requires signing to reach Ready for Pickup before release', async () => {
        const record = await create({ status: 'For Signing', paymentStatus: 'Paid' });
        await decide(record, 'Active').expect(400);
        expect((await Franchise.findById(record.id)).status).toBe('For Signing');
        await withdraw(record).expect(400);
        expect((await decide(record, 'Ready for Pickup').expect(200)).body.status).toBe('Ready for Pickup');
        expect((await decide(record, 'Active').expect(200)).body.status).toBe('Active');
        await decide(record, 'Ready for Pickup').expect(400);
    });

    it('allows an unpaid pending-for-approval withdrawal', async () => {
        const record = await create({ status: 'Pending for Approval' });
        expect((await withdraw(record).expect(200)).body.status).toBe('Cancelled');
    });

    it('keeps the cashier result when payment completes before the withdrawal write', async () => {
        const record = await create({ status: 'For Payment' });
        const update = Franchise.findOneAndUpdate.bind(Franchise);
        jest.spyOn(Franchise, 'findOneAndUpdate').mockImplementationOnce(async (...args) => {
            await Franchise.updateOne({ _id: record.id }, {
                $set: { status: 'For Signing', paymentStatus: 'Paid', officialReceiptNo: 'BATCH2-OR' }
            });
            return update(...args);
        });
        await withdraw(record).expect(409);
        expect(await Franchise.findById(record.id)).toMatchObject({
            status: 'For Signing', paymentStatus: 'Paid', officialReceiptNo: 'BATCH2-OR'
        });
    });

    it('keeps the application in the payment queue when a receipt is reserved', async () => {
        const record = await create({ status: 'For Payment' });
        await Franchise.collection.updateOne({ _id: record._id }, {
            $set: { paymentSettlement: { ledgerId: new mongoose.Types.ObjectId(), officialReceiptNo: 'RESERVED-OR' } }
        });
        await withdraw(record).expect(409);
        await decide(record, 'Cancelled').expect(409);
        expect((await Franchise.findById(record.id)).status).toBe('For Payment');
    });

    it('preserves a live permit and its expiry when an early renewal is rejected', async () => {
        const expiryDate = new Date(Date.now() + 8 * DAY);
        const record = await create({ status: 'Active', expiryDate, paymentStatus: 'Paid' });
        await renew(record).expect(200);
        expect((await verify(record).expect(200)).body.scannedFranchise).toMatchObject({
            status: 'Active', isCurrentlyValid: true, renewalStatus: 'Pending'
        });
        await decide(record, 'Cancelled').expect(200);

        expect((await verify(record).expect(200)).body.scannedFranchise).toMatchObject({
            status: 'Active', isCurrentlyValid: true, renewalStatus: 'Cancelled',
            isRenewalPending: false, expiryDate: expiryDate.toISOString()
        });
        const list = await request(app).get('/api/v1/franchises/my-franchises')
            .set('Authorization', auth(operator)).expect(200);
        expect(list.body[0].issuedPermit).toEqual({ status: 'Active', expiryDate: expiryDate.toISOString() });
        expect((await renew(record).expect(200)).body.previousStatus).toBe('Active');
    });

    it('applies discipline to the issued permit while the application stays in its own pipeline', async () => {
        const expiryDate = new Date(Date.now() + 9 * DAY);
        const record = await create({ status: 'Active', expiryDate, paymentStatus: 'Paid' });
        await renew(record).expect(200);
        const violationRequest = () => request(app).post('/api/v1/violations')
            .set('Authorization', auth(bplo)).send({ franchiseId: record.id, violationType: 'Overcharging of fare' });
        await violationRequest().expect(201);
        const warned = await Franchise.findById(record.id);
        expect(warned).toMatchObject({ status: 'Pending', previousStatus: 'Active - Under Warning', previousExpiryDate: expiryDate });

        await violationRequest().expect(201);
        expect((await verify(record).expect(200)).body.scannedFranchise).toMatchObject({
            status: 'Suspended', isCurrentlyValid: false, renewalStatus: 'Pending'
        });
        await decide(record, 'Cancelled').expect(200);
        expect((await Franchise.findById(record.id)).previousStatus).toBe('Suspended');
    });

    it('carries an unresolved warning into the new term after the old term expires', async () => {
        const record = await create({
            status: 'Ready for Pickup', paymentStatus: 'Paid', applicationType: 'Renewal',
            isRenewalPending: true, previousStatus: 'Expired', previousExpiryDate: new Date(Date.now() - DAY),
            activeViolationCount: 1, currentSanction: 'Warning (1st Offense)'
        });
        const released = await decide(record, 'Active').expect(200);
        expect(released.body).toMatchObject({ status: 'Active - Under Warning', isRenewalPending: false, previousStatus: '' });
        expect(new Date(released.body.expiryDate).getTime()).toBeGreaterThan(Date.now());
    });

    it('uses the configured renewal window', async () => {
        await SystemSettings.create({ expiryWarningDays: 7 });
        const record = await create({ status: 'Active', expiryDate: new Date(Date.now() + 8 * DAY) });
        const outside = await renew(record).expect(400);
        expect(outside.body.message).toContain('7 days');
        await Franchise.updateOne({ _id: record.id }, { $set: { expiryDate: new Date(Date.now() + 6 * DAY) } });
        await renew(record).expect(200);
    });

    it('checks carried-forward expiry even when a renewal sends blank expiry fields', async () => {
        const record = await create({
            status: 'Expired', orCrExpiryDate: new Date(Date.now() - 4 * DAY),
            driverLicenseExpiryDate: new Date(Date.now() + 15 * DAY)
        });
        const expired = await renew(record, { orCrExpiryDate: '' }).expect(400);
        expect(expired.body.message).toContain('OR/CR');
        const withoutReplacement = await renew(record, { orCrExpiryDate: new Date(Date.now() + 7 * DAY) }).expect(400);
        expect(withoutReplacement.body.message).toContain('replacement');
        expect((await Franchise.findById(record.id)).status).toBe('Expired');
    });
});
