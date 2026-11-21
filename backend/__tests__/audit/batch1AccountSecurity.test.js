const express = require('express');
const request = require('supertest');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/userModel');
const authRoutes = require('../../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const password = 'SampleAccount!92';
const email = 'operator@example.test';
const phone = '09181110001';
const backupEmail = 'backup@example.test';
const subject = 'test-google-subject';
let database;

const account = (fields = {}) => User.create({
    name: 'Sample Operator',
    address: 'Gasan',
    role: 'operator',
    contact: phone,
    email,
    password,
    isVerified: true,
    ...fields
});

const bearer = (user, session = 'test-session') => 'Bearer ' + jwt.sign(
    { id: user.id, role: user.role, tokenVersion: user.tokenVersion, tokenType: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', jwtid: session }
);

const mockGoogle = (sub = subject) => jest.spyOn(axios, 'get').mockResolvedValue({
    data: { sub, email, email_verified: true, aud: process.env.GOOGLE_CLIENT_ID }
});

const credential = (extra = {}) => jwt.sign(
    { email, sub: subject, ...extra }, 'synthetic-google-fixture', { expiresIn: '10m' }
);

const sendReset = (contact) => request(app).post('/auth/forgot-password').send({ contact });

beforeAll(async () => {
    database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(database.getUri());
    await User.init();
}, 90000);

afterEach(async () => User.deleteMany({}));

afterAll(async () => {
    await mongoose.disconnect();
    await database?.stop();
});

describe('Batch 1 account identity and recovery', () => {
    it('requires verified local email and persists the Google subject', async () => {
        const user = await account({ isContactVerified: true });
        const google = mockGoogle();
        const signIn = () => request(app).post('/auth/google').send({ credential: credential() });

        expect((await signIn()).status).toBe(403);
        expect((await User.findById(user.id)).googleId).toBe('');

        await User.updateOne({ _id: user.id }, { $set: { isEmailVerified: true } });
        expect((await signIn()).status).toBe(200);
        expect((await User.findById(user.id)).googleId).toBe(subject);

        google.mockResolvedValue({ data: { sub: 'different-subject', email, email_verified: true, aud: process.env.GOOGLE_CLIENT_ID } });
        expect((await signIn()).status).toBe(403);
    });

    it('keeps only the primary contact eligible on a pre-Batch-1 verified account', async () => {
        const { insertedId } = await User.collection.insertOne({
            name: 'Legacy Operator', address: 'Gasan', role: 'operator',
            contact: phone, email, recoveryEmail: backupEmail,
            password: await User.hashPassword(password), isVerified: true
        });

        const hydrated = await User.findById(insertedId);
        expect(hydrated.isContactVerified).toBeUndefined();
        expect(hydrated.isEmailVerified).toBeUndefined();
        expect((await sendReset(email)).status).toBe(400);
        expect((await sendReset(backupEmail)).status).toBe(400);

        const issued = await sendReset(phone);
        expect(issued.status).toBe(200);
        expect((await User.collection.findOne({ _id: insertedId })).otpRecipient).toBe(phone);
        const reset = await request(app).post('/auth/reset-password').send({
            resetChallengeToken: issued.body.resetChallengeToken,
            otp: issued.body.testOtp,
            newPassword: 'NewResetPassword!39'
        });
        expect(reset.status).toBe(200);

        await User.collection.updateOne({ _id: insertedId }, { $set: { isContactVerified: false } });
        expect((await sendReset(phone)).status).toBe(400);
    });

    it('allows reset only on verified destinations and revokes old challenges on password change', async () => {
        const user = await account({ isContactVerified: true, recoveryEmail: backupEmail });
        expect((await sendReset(email)).status).toBe(400);
        expect((await sendReset(backupEmail)).status).toBe(400);

        const issued = await sendReset(phone);
        expect(issued.status).toBe(200);
        const changed = await request(app).put('/auth/change-password')
            .set('Authorization', bearer(user))
            .send({ oldPassword: password, newPassword: 'DifferentAccount!62' });
        expect(changed.status).toBe(200);

        const invalidated = await request(app).post('/auth/reset-password').send({
            resetChallengeToken: issued.body.resetChallengeToken,
            otp: issued.body.testOtp,
            newPassword: 'NewResetPassword!39'
        });
        expect(invalidated.status).toBe(400);
        expect((await User.findById(user.id)).otp).toBeUndefined();
    });

    it('sets a new local password after a current verified reset challenge', async () => {
        const user = await account({ isContactVerified: true });
        const issued = await sendReset(phone);
        expect(issued.status).toBe(200);
        const newPassword = 'NewResetPassword!39';
        const changed = await request(app).post('/auth/reset-password').send({
            resetChallengeToken: issued.body.resetChallengeToken, otp: issued.body.testOtp, newPassword
        });
        expect(changed.status).toBe(200);
        const updated = await User.findById(user.id);
        expect(await updated.matchPassword(newPassword)).toBe(true);
        expect(updated.otp).toBeUndefined();
    });

    it('requires destination proof and invalidates an issued reset when that contact is cleared', async () => {
        const user = await account({ isContactVerified: true });
        const authorization = bearer(user);
        const update = (body) => request(app).put('/auth/profile').set('Authorization', authorization).send(body);
        const details = { recoveryEmail: backupEmail, currentPassword: password };
        expect((await update(details)).status).toBe(400);

        const verified = await request(app).post('/auth/request-recovery-otp')
            .set('Authorization', authorization).send({ target: backupEmail });
        expect(verified.status).toBe(200);
        expect((await update({ ...details, recoveryOtp: verified.body.testOtp })).body.isRecoveryEmailVerified).toBe(true);

        const issued = await sendReset(backupEmail);
        expect(issued.status).toBe(200);
        expect((await update({ clearRecovery: true, currentPassword: password })).status).toBe(200);
        const reset = await request(app).post('/auth/reset-password').send({
            resetChallengeToken: issued.body.resetChallengeToken,
            otp: issued.body.testOtp,
            newPassword: 'NewResetPassword!39'
        });
        expect(reset.status).toBe(400);
    });

    it('classifies legacy Google-only users and requires a fresh, session-bound Google credential', async () => {
        const user = await account({
            contact: email, googleId: subject, authProvider: 'google', hasLocalPassword: true,
            isContactVerified: true, isEmailVerified: true, recoveryEmail: backupEmail
        });
        const authorization = bearer(user);
        const secondSession = bearer(user, 'other-session');
        const update = (auth, body) => request(app).put('/auth/profile').set('Authorization', auth).send(body);
        const profile = await request(app).get('/auth/profile').set('Authorization', authorization);
        expect(profile.body.hasLocalPassword).toBe(false);

        const challenge = await request(app).post('/auth/google-step-up').set('Authorization', authorization);
        expect(challenge.status).toBe(200);
        mockGoogle();
        const body = { clearRecovery: true, googleReauthToken: credential({ nonce: challenge.body.nonce }) };
        expect((await update(secondSession, body)).status).toBe(401);
        expect((await update(authorization, body)).status).toBe(200);
    });
});
