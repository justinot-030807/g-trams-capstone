const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const yauzl = require('yauzl');
const Franchise = require('../../src/models/franchiseModel');
const PaymentLedger = require('../../src/models/paymentLedgerModel');
const MtopCounter = require('../../src/models/mtopCounterModel');
const Notification = require('../../src/models/notificationModel');
const User = require('../../src/models/userModel');
const { getManilaDateString } = require('../../src/utils/phTime');

const app = express();
app.use(express.json());
app.use('/franchises', require('../../src/routes/franchiseRoutes'));

let mongo;
let cashier;
let operator;
let staff;
let fixtureNumber = 0;

const createUser = role => User.create({
  name: `${role} fixture`,
  address: 'Gasan',
  contact: `${role}@settlement.test`,
  role,
  isVerified: true,
  lastActive: new Date(),
  password: 'FixturePassword123!'
});

const authorization = user => `Bearer ${jwt.sign({
  id: user._id,
  tokenType: 'access',
  tokenVersion: user.tokenVersion
}, process.env.JWT_SECRET)}`;

function franchiseFixture(overrides = {}) {
  const n = ++fixtureNumber;
  return Franchise.create({
    operator: operator._id, fullName: operator.name, address: 'Gasan', zone: 'Central',
    made: '2025', make: 'Honda', motorNo: `TREASURY-M${n}`, chassisNo: `TREASURY-C${n}`,
    plateNo: `TREASURY-P${n}`, todaName: 'BATODA', status: 'For Payment',
    cedulaSerialNo: `TREASURY-CTC${n}`, cedulaAddress: 'Gasan', cedulaDate: new Date(),
    ...overrides
  });
}

const pay = (franchise, officialReceiptNo, fields = {}) => request(app)
  .post(`/franchises/${franchise.id}/pay`)
  .set('Authorization', authorization(cashier))
  .send({ officialReceiptNo, amountPaid: 500, ...fields });

const readReservation = id => Franchise.findById(id).select('+paymentSettlement').lean();

function readWordXml(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      if (error) return reject(error);
      zip.on('error', reject);
      zip.on('end', () => reject(new Error('Word document XML is missing')));
      zip.on('entry', entry => {
        if (entry.fileName !== 'word/document.xml') return zip.readEntry();
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return reject(streamError);
          const chunks = [];
          stream.on('error', reject);
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('end', () => {
            zip.close();
            resolve(Buffer.concat(chunks).toString('utf8'));
          });
        });
      });
      zip.readEntry();
    });
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([Franchise.init(), PaymentLedger.init(), MtopCounter.init()]);
  [cashier, operator, staff] = await Promise.all(
    ['cashier', 'operator', 'bplo_staff'].map(createUser)
  );
}, 90000);

beforeEach(async () => {
  await Promise.all([Franchise.deleteMany({}), PaymentLedger.deleteMany({}), MtopCounter.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe('Batch 2 H6 standalone treasury settlement', () => {
  it('keeps signing unavailable during a ledger failure and resumes the reserved receipt', async () => {
    const franchise = await franchiseFixture();
    jest.spyOn(PaymentLedger, 'create').mockRejectedValueOnce(new Error('Ledger unavailable'));

    await pay(franchise, 'audit-h6-retry', { payerName: 'First Payer' }).expect(500);
    const pending = await readReservation(franchise.id);
    expect(pending).toMatchObject({ status: 'For Payment', paymentStatus: 'Unpaid', officialReceiptNo: '' });
    expect(pending.paymentSettlement.officialReceiptNo).toBe('AUDIT-H6-RETRY');
    expect((await Franchise.findById(franchise.id).lean()).paymentSettlement).toBeUndefined();
    expect(await PaymentLedger.countDocuments({ franchiseId: franchise.id })).toBe(0);

    await pay(franchise, 'audit-h6-different').expect(409);
    const settled = await pay(franchise, 'audit-h6-retry').expect(200);
    expect(settled.body.franchise).toMatchObject({ status: 'For Signing', paymentStatus: 'Paid' });
    expect(settled.body.ledgerEntry).toMatchObject({
      _id: String(pending.paymentSettlement.ledgerId), payerName: 'FIRST PAYER', mtopNo: pending.mtopNo
    });
    expect((await readReservation(franchise.id)).paymentSettlement).toBeUndefined();
    await pay(franchise, 'audit-h6-retry').expect(409);
    expect(await PaymentLedger.countDocuments({ franchiseId: franchise.id })).toBe(1);
  });

  it('recovers an already durable receipt after interruption and preserves the issued permit snapshot', async () => {
    const previousExpiryDate = new Date('2099-12-31T15:59:59.999Z');
    const franchise = await franchiseFixture({
      applicationType: 'Renewal', isRenewalPending: true, previousStatus: 'Active', previousExpiryDate
    });
    const recordSettlement = PaymentLedger.recordSettlement.bind(PaymentLedger);
    jest.spyOn(PaymentLedger, 'recordSettlement').mockImplementationOnce(async entry => {
      await recordSettlement(entry);
      throw new Error('Interrupted after ledger write');
    });

    await pay(franchise, 'audit-h6-durable').expect(500);
    const original = await PaymentLedger.findOne({ franchiseId: franchise._id }).lean();
    expect(original.officialReceiptNo).toBe('AUDIT-H6-DURABLE');
    expect((await readReservation(franchise.id)).status).toBe('For Payment');
    await Franchise.updateOne({ _id: franchise._id }, { $set: { previousStatus: 'Revoked' } });
    jest.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('Notification unavailable'));

    const settled = await pay(franchise, 'audit-h6-durable').expect(200);
    expect(settled.body.ledgerEntry._id).toBe(String(original._id));
    expect(await readReservation(franchise.id)).toMatchObject({
      status: 'For Signing', paymentStatus: 'Paid', previousStatus: 'Revoked', previousExpiryDate
    });
    expect(await PaymentLedger.countDocuments({ franchiseId: franchise._id })).toBe(1);
  });

  it.each(['Suspended', 'Revoked'])('does not admit a new payment for a %s issued permit', async previousStatus => {
    const franchise = await franchiseFixture({ applicationType: 'Renewal', previousStatus });
    await pay(franchise, `audit-h6-${previousStatus}`).expect(400);
    expect((await readReservation(franchise.id)).paymentSettlement).toBeUndefined();
    expect(await PaymentLedger.countDocuments({ franchiseId: franchise._id })).toBe(0);
  });

  it('settles an OR at most once across concurrent applications', async () => {
    const [first, second] = await Promise.all([franchiseFixture(), franchiseFixture()]);
    const results = await Promise.all([pay(first, 'audit-h6-shared'), pay(second, 'audit-h6-shared')]);
    expect(results.map(result => result.status).sort()).toEqual([200, 409]);
    const recorded = await PaymentLedger.find({ officialReceiptNo: 'AUDIT-H6-SHARED' }).lean();
    expect(recorded).toHaveLength(1);
    const updated = await Franchise.find({ _id: { $in: [first._id, second._id] } }).select('+paymentSettlement').lean();
    expect(updated.find(item => item._id.equals(recorded[0].franchiseId)).status).toBe('For Signing');
    expect(updated.find(item => !item._id.equals(recorded[0].franchiseId))).toMatchObject({
      status: 'For Payment', paymentStatus: 'Unpaid', officialReceiptNo: ''
    });
    expect(updated.every(item => !item.paymentSettlement)).toBe(true);
  });
});

describe('Batch 2 M6 MTOP allocation and cancellation export', () => {
  it('seeds from the numeric maximum and keeps allocating after deletion', async () => {
    const year = getManilaDateString().slice(0, 4);
    const original = await franchiseFixture({ mtopNo: `${year}-1002` });
    const [first, second] = await Promise.all([franchiseFixture(), franchiseFixture()]);
    const firstPayments = await Promise.all([pay(first, 'audit-m6-first'), pay(second, 'audit-m6-second')]);
    expect(firstPayments.map(result => result.status)).toEqual([200, 200]);
    expect(firstPayments.map(result => result.body.franchise.mtopNo).sort())
      .toEqual([`${year}-1003`, `${year}-1004`]);

    await Franchise.deleteMany({ _id: { $in: [original._id, first._id, second._id] } });
    expect((await MtopCounter.findById(year).lean()).sequence).toBe(1004);
    const replacement = await franchiseFixture();
    const paid = await pay(replacement, 'audit-m6-replacement').expect(200);
    expect(paid.body.franchise.mtopNo).toBe(`${year}-1005`);
  });

  it('writes the stored canonical MTOP number into the cancellation DOCX', async () => {
    const franchise = await franchiseFixture({ status: 'Cancelled', mtopNo: '2026-418' });
    const result = await request(app).get(`/franchises/${franchise.id}/download-original?type=cancellation`)
      .set('Authorization', authorization(staff))
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('error', callback);
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(result.headers['content-type']).toContain('wordprocessingml.document');
    expect(await readWordXml(result.body)).toContain('2026-418');
  });
});
