const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const User = require('../../src/models/userModel');
const TodaRoster = require('../../src/models/todaModel');
const TodaSubmission = require('../../src/models/todaSubmission');
const TodaRemovalRequest = require('../../src/models/todaRemovalRequest');

const app = express();
app.use(express.json());
app.use('/auth', require('../../src/routes/authRoutes'));
app.use('/toda', require('../../src/routes/todaRoutes'));
app.use('/franchises', require('../../src/routes/franchiseRoutes'));

let mongo;
let staff;
let president;
let admin;
let operator;
let other;

const authorization = user => `Bearer ${jwt.sign({
    id: user._id, tokenType: 'access', tokenVersion: user.tokenVersion
}, process.env.JWT_SECRET)}`;

const makeUser = (name, role, todaAssociation = 'NON-TODA', bodyNumber = '') => User.create({
    name,
    role,
    todaAssociation,
    bodyNumber,
    address: 'Bachao Ibaba, Gasan',
    contact: `${name.toLowerCase().replaceAll(' ', '.')}@test.example`,
    password: 'FixturePassword123!',
    isVerified: true,
    isActive: true,
    lastActive: new Date()
});

const makeRoster = (name, body, more = {}) => TodaRoster.create({
    operatorName: name, bodyNumber: body, todaAssociation: 'BATODA', ...more
});

const makeSubmission = (status, extractedMembers) => TodaSubmission.create({
    submittedBy: president._id, presidentName: president.name, todaAssociation: 'BATODA',
    fileName: 'Certified Roster', filePath: 'fixture', status, extractedMembers,
    extractedCount: extractedMembers.length
});

const requestRemoval = (member, targetRosterId) => request(app).post('/toda/removal-requests')
    .set('Authorization', authorization(president))
    .send({
        memberId: member.id, targetRosterId,
        reason: 'No longer operating / Inactive', details: 'Confirmed by the association.'
    });

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongo.getUri());
    await TodaRoster.init();
    [staff, president, admin, other] = await Promise.all([
        makeUser('Licensing Staff', 'bplo_staff'),
        makeUser('Association President', 'toda_president', 'BATODA (Bachao TODA)'),
        makeUser('System Administrator', 'system_admin'),
        makeUser('Other Operator', 'operator', 'BATODA', 'BAT-008')
    ]);
}, 90000);

beforeEach(async () => {
    await Promise.all([
        TodaRoster.deleteMany({}), TodaSubmission.deleteMany({}), TodaRemovalRequest.deleteMany({}),
        User.deleteOne({ name: 'Audited Operator' })
    ]);
    operator = await makeUser('Audited Operator', 'operator', 'BATODA', 'BAT-007');
});

afterEach(() => jest.restoreAllMocks());

afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
});

describe('Batch 2 H5 and M2 TODA invariants on standalone MongoDB', () => {
    it('publishes active rows only after approval and compensates a failed roster sync', async () => {
        const submission = await makeSubmission('Pending', [
            { operatorName: 'First Application', bodyNumber: 'BAT-001' },
            { operatorName: 'Second Application', bodyNumber: 'BAT-002' }
        ]);
        const create = TodaRoster.create.bind(TodaRoster);
        const failingWrite = jest.spyOn(TodaRoster, 'create').mockImplementation(async (rows, options) => {
            expect((await TodaSubmission.findById(submission.id).lean()).status).toBe('Approved');
            if (rows[0].bodyNumber === 'BAT-002') throw new Error('Roster write failed');
            return create(rows, options);
        });
        const decide = () => request(app).put(`/toda/approve/${submission.id}`)
            .set('Authorization', authorization(staff)).send({ expectedUpdatedAt: submission.updatedAt.toISOString() });

        await decide().expect(500);
        expect((await TodaSubmission.findById(submission.id).lean()).status).toBe('Pending');
        expect(await TodaRoster.countDocuments({ submissionRef: submission._id })).toBe(0);

        failingWrite.mockRestore();
        await decide().expect(200);
        expect(await TodaRoster.countDocuments({ submissionRef: submission._id, status: 'Active' })).toBe(2);
    });

    it('binds removal to one normalized slot and rolls back changes if the decision fails', async () => {
        const exact = await makeRoster(operator.name, '007', { registeredUser: operator._id, claimedBy: operator._id });
        const unrelated = await makeRoster(other.name, 'BAT-008', { registeredUser: other._id });
        const submission = await makeSubmission('Approved', [
            { operatorName: operator.name, bodyNumber: 'BAT-007' },
            { operatorName: other.name, bodyNumber: '008' }
        ]);
        await requestRemoval(operator, unrelated.id).expect(409);
        const filed = await requestRemoval(operator, exact.id).expect(201);

        const decide = () => request(app).put(`/toda/removal-requests/${filed.body.request._id}/approve`)
            .set('Authorization', authorization(staff)).send({});
        const failingDecision = jest.spyOn(TodaRemovalRequest, 'findOneAndUpdate').mockImplementationOnce(() => {
            throw new Error('Decision write failed');
        });
        await decide().expect(500);
        expect((await TodaRemovalRequest.findById(filed.body.request._id).lean()).status).toBe('Pending');
        expect((await User.findById(operator.id).lean()).bodyNumber).toBe('BAT-007');
        expect(await TodaRoster.exists({ _id: exact._id })).toBeTruthy();
        expect((await TodaSubmission.findById(submission.id).lean()).extractedCount).toBe(2);

        failingDecision.mockRestore();
        await decide().expect(200);
        expect((await User.findById(operator.id).lean()).todaAssociation).toBe('NON-TODA');
        expect(await TodaRoster.exists({ _id: exact._id })).toBeNull();
        expect(await TodaRoster.exists({ _id: unrelated._id })).toBeTruthy();
        expect((await TodaSubmission.findById(submission.id).lean()).extractedMembers.map(member => member.operatorName)).toEqual([other.name]);
    });

    it('rolls back the destination claim on a failed profile save and releases the old slot after transfer', async () => {
        const source = await makeRoster(operator.name, 'BAT-007', { registeredUser: operator._id, claimedBy: operator._id });
        const destination = await makeRoster(operator.name, 'POB-009', { todaAssociation: 'POB TODA' });
        const transfer = () => request(app).put('/auth/profile').set('Authorization', authorization(operator))
            .send({ todaAssociation: '  pob toda (poblacion central)  ', bodyNumber: '9' });

        const updateUser = User.findOneAndUpdate.bind(User);
        const failProfile = jest.spyOn(User, 'findOneAndUpdate').mockImplementation((filter, update, options) => {
            if (update.$set?.todaAssociation === 'POB TODA') throw new Error('Account write failed');
            return updateUser(filter, update, options);
        });
        await transfer().expect(500);
        expect((await TodaRoster.findById(destination.id).lean()).claimedBy).toBeNull();
        expect(String((await TodaRoster.findById(source.id).lean()).claimedBy)).toBe(operator.id);

        failProfile.mockRestore();
        await transfer().expect(200);
        const account = await User.findById(operator.id).lean();
        expect(account).toMatchObject({ todaAssociation: 'POB TODA', bodyNumber: 'POB-009' });
        expect(String((await TodaRoster.findById(destination.id).lean()).registeredUser)).toBe(operator.id);
        expect((await TodaRoster.findById(source.id).lean()).registeredUser).toBeNull();
    });

    it('compensates a failed deletion and preserves another claimant on a legacy split row', async () => {
        const mixed = await makeRoster('Legacy Slot', 'BAT-019', {
            registeredUser: operator._id, claimedBy: other._id
        });
        const remove = () => request(app).delete(`/auth/${operator.id}`).set('Authorization', authorization(admin));
        const failure = jest.spyOn(TodaRoster, 'findOneAndUpdate').mockImplementationOnce(() => {
            throw new Error('Claim release failed');
        });
        await remove().expect(500);
        expect(await User.exists({ _id: operator._id })).toBeTruthy();
        expect(String((await TodaRoster.findById(mixed.id).lean()).registeredUser)).toBe(operator.id);

        failure.mockRestore();
        await remove().expect(200);
        expect(await User.exists({ _id: operator._id })).toBeNull();
        const row = await TodaRoster.findById(mixed.id).lean();
        expect(row.registeredUser).toBeNull();
        expect(String(row.claimedBy)).toBe(other.id);
    });

    it('releases the roster claim when an administrator changes an operator role', async () => {
        const source = await makeRoster(operator.name, 'BAT-007', { registeredUser: operator._id, claimedBy: operator._id });
        await request(app).put(`/auth/${operator.id}`).set('Authorization', authorization(admin))
            .send({ role: 'cashier' }).expect(200);
        expect(await User.findById(operator.id).lean()).toMatchObject({ role: 'cashier', todaAssociation: 'NON-TODA', bodyNumber: '' });
        expect(await TodaRoster.findById(source.id).lean()).toMatchObject({ claimedBy: null, registeredUser: null });
    });

    it('returns eligibility for registration and only jurisdiction from public franchise lookup', async () => {
        await makeRoster('Private Operator', 'BAT-025', { plateNo: 'PLT-PRIVATE' });
        const positive = await request(app).post('/auth/verify-roster').send({
            fullName: 'Private Operator', todaAssociation: 'BATODA', bodyNumber: '25'
        }).expect(200);
        expect(positive.body).toEqual({
            success: true, verified: true, status: 'verified', message: 'TODA roster eligibility verified.'
        });
        const baseline = await request(app).get('/franchises/check-toda-member')
            .query({ todaName: 'BATODA', barangay: 'Bachao Ibaba' }).expect(200);
        const withIdentifiers = await request(app).get('/franchises/check-toda-member')
            .query({ todaName: 'BATODA', barangay: 'Bachao Ibaba', name: 'Private Operator', plateNo: 'PLT-PRIVATE' }).expect(200);
        expect(withIdentifiers.body).toEqual(baseline.body);
        expect(baseline.body).toMatchObject({ isVerified: false, jurisdictionStatus: 'match' });
    });
});
