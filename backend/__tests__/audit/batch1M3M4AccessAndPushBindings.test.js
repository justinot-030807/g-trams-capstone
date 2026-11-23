process.env.JWT_SECRET = 'batch1_m3_m4_test_secret';

jest.mock('../../src/config/webPush', () => ({
  vapidPublicKey: 'test-public-key',
  webpush: { sendNotification: jest.fn() }
}));

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const TodaRoster = require('../../src/models/todaModel');
const TodaSubmission = require('../../src/models/todaSubmission');
const PushSubscription = require('../../src/models/pushSubscriptionModel');
const { webpush } = require('../../src/config/webPush');
const { sendPushToUser } = require('../../src/services/pushService');

const app = express();
app.use(express.json());
app.use('/franchises', require('../../src/routes/franchiseRoutes'));
app.use('/toda', require('../../src/routes/todaRoutes'));
app.use('/violations', require('../../src/routes/violationRoutes'));
app.use('/push', require('../../src/routes/pushRoutes'));

let mongo;
let president;
let staff;
let admin;
let operator;

const makeUser = (role, todaAssociation = 'NON-TODA') => User.create({
  name: `${role} fixture`,
  address: 'Gasan',
  contact: `${role}@gtrams.test`,
  role,
  todaAssociation,
  isVerified: true,
  lastActive: new Date(),
  password: 'FixturePassword123!'
});

const authorization = (user) => `Bearer ${jwt.sign({
  id: user._id,
  tokenType: 'access',
  tokenVersion: user.tokenVersion
}, process.env.JWT_SECRET)}`;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
  await PushSubscription.init();
  [president, staff, admin, operator] = await Promise.all([
    makeUser('toda_president', 'BATODA (Bachao TODA)'),
    makeUser('bplo_staff'),
    makeUser('system_admin'),
    makeUser('operator')
  ]);
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe('Batch 1 M3 association and role boundaries', () => {
  it('scopes the member directory and membership check to canonical association records', async () => {
    await TodaRoster.create({
      todaAssociation: 'BATODA', operatorName: 'Agustin Ramos', bodyNumber: '01'
    });
    await TodaSubmission.create({
      submittedBy: staff._id,
      presidentName: staff.name,
      todaAssociation: 'POB TODA',
      fileName: 'BATODA',
      filePath: 'fixture',
      status: 'Approved',
      extractedMembers: [{ operatorName: 'Ernesto Garcia', bodyNumber: '02' }]
    });

    const members = await request(app).get('/toda/my-members')
      .query({ todaName: ' batoda ' }).set('Authorization', authorization(president)).expect(200);
    expect(members.body.todaName).toBe('BATODA');
    expect(members.body.members.map(member => member.name)).toContain('Agustin Ramos');
    expect(members.body.members.map(member => member.name)).not.toContain('Ernesto Garcia');

    await request(app).get('/toda/my-members').query({ todaName: 'POB TODA' })
      .set('Authorization', authorization(president)).expect(403);

    const membership = await request(app).get('/franchises/check-toda-member')
      .query({ todaName: 'BATODA (Bachao TODA)', name: 'Ernesto Garcia' }).expect(200);
    expect(membership.body.isVerified).toBe(false);
  });

  it.each(['/toda/rosters', '/violations'])('reserves %s for BPLO staff', async (path) => {
    await request(app).get(path).set('Authorization', authorization(admin)).expect(403);
    await request(app).get(path).set('Authorization', authorization(staff)).expect(200);
  });

  it('keeps Cashier franchise reads within the payment projection', async () => {
    const cashier = await makeUser('cashier');
    const franchise = await Franchise.create({
      operator: operator._id, fullName: operator.name, address: 'Applicant address', zone: 'Central',
      made: '2025', make: 'Honda', motorNo: 'AUDIT-MOTOR', chassisNo: 'AUDIT-CHASSIS', plateNo: 'AUDIT-PLATE',
      todaName: 'BATODA', status: 'For Payment', cedulaDate: new Date(), cedulaAddress: 'Gasan',
      cedulaSerialNo: '000001', licenseUrl: 'https://example.test/license'
    });
    const header = authorization(cashier);
    const result = await request(app).get(`/franchises/${franchise.id}`).set('Authorization', header).expect(200);
    expect(result.body.plateNo).toBe('AUDIT-PLATE');
    expect(result.body.licenseUrl).toBeUndefined();
    expect(result.body.cedulaSerialNo).toBeUndefined();
    expect(result.body.operator.contact).toBeUndefined();
    await request(app).get(`/franchises/${franchise.id}/record-check`).set('Authorization', header).expect(403);
    await request(app).get(`/franchises/${franchise.id}/download-original`).set('Authorization', header).expect(403);
    const queue = await request(app).get('/franchises/cashier-queue').set('Authorization', header).expect(200);
    expect(queue.body.pendingPayment[0].licenseUrl).toBeUndefined();
  });

  it('rejects system admin document and violation history reads', async () => {
    const id = new mongoose.Types.ObjectId();
    const header = authorization(admin);
    await request(app).get(`/franchises/${id}/download-original`).set('Authorization', header).expect(403);
    await request(app).get(`/violations/history/${id}`).set('Authorization', header).expect(403);
  });
});

describe('Batch 1 M4 push binding rotation', () => {
  const endpoint = 'https://fcm.googleapis.com/fcm/send/gtrams-test-subscription';
  const subscription = { endpoint, keys: { p256dh: 'fixture-public-key', auth: 'fixture-auth-secret' } };
  const subscribe = (user, payload = subscription) => request(app).post('/push/subscribe')
    .set('Authorization', authorization(user)).send({ subscription: payload });

  beforeEach(async () => {
    webpush.sendNotification.mockReset();
    await PushSubscription.deleteMany({});
  });

  it('authenticates registration and requires the existing subscription keys for account rotation', async () => {
    await request(app).post('/push/subscribe').send({ subscription }).expect(401);
    await subscribe(operator).expect(200);
    await subscribe(president, { ...subscription, keys: { ...subscription.keys, auth: 'different-key' } })
      .expect(403);
    expect(String((await PushSubscription.findOne({ endpoint })).user)).toBe(String(operator._id));

    const rotated = await subscribe(president).expect(200);
    expect(rotated.body.rebound).toBe(true);
    await request(app).post('/push/unsubscribe').set('Authorization', authorization(operator))
      .send({ endpoint }).expect(200);
    expect(String((await PushSubscription.findOne({ endpoint })).user)).toBe(String(president._id));
    expect(await PushSubscription.countDocuments({ endpoint })).toBe(1);
  });

  it('keeps a newer binding when a previous send fails after account rotation', async () => {
    await subscribe(operator).expect(200);
    // Restored legacy subscriptions may lack a Mongoose version key.
    await PushSubscription.collection.updateOne({ endpoint }, { $unset: { __v: 1 } });

    let rejectDelivery;
    let markDeliveryStarted;
    const deliveryStarted = new Promise(resolve => { markDeliveryStarted = resolve; });
    webpush.sendNotification.mockImplementationOnce(() => new Promise((_, reject) => {
      rejectDelivery = reject;
      markDeliveryStarted();
    }));

    const delivery = sendPushToUser(operator._id, { title: 'Test notification' });
    await Promise.race([deliveryStarted, delivery.then(() => {
      throw new Error('The mocked push delivery did not start');
    })]);
    const gone = Object.assign(new Error('Subscription expired'), { statusCode: 410 });
    try {
      await subscribe(president).expect(200);
      await subscribe(operator).expect(200);
    } finally {
      rejectDelivery(gone);
      await delivery;
    }
    const current = await PushSubscription.findOne({ endpoint });
    expect(String(current.user)).toBe(String(operator._id));
    expect(current.__v).toBeGreaterThan(0);

    webpush.sendNotification.mockRejectedValueOnce(gone);
    await sendPushToUser(operator._id, { title: 'Test notification' });
    expect(await PushSubscription.countDocuments({ endpoint })).toBe(0);
  });
});
