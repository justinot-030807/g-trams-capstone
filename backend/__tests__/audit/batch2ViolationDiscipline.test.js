const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const Franchise = require('../../src/models/franchiseModel');
const User = require('../../src/models/userModel');
const Violation = require('../../src/models/violationModel');

const app = express();
app.use(express.json());
app.use('/violations', require('../../src/routes/violationRoutes'));

let database;
let operator;
let authorization;

function createUser(role) {
  return User.create({
    name: `${role} fixture`,
    address: 'Gasan',
    contact: `${role}@gtrams.test`,
    role,
    todaAssociation: 'NON-TODA',
    isVerified: true,
    lastActive: new Date(),
    password: 'FixturePassword123!'
  });
}

function createPermit(overrides = {}) {
  const id = new mongoose.Types.ObjectId();
  return Franchise.create({
    _id: id,
    operator: operator._id,
    fullName: operator.name,
    address: 'Gasan',
    zone: 'Central',
    made: '2023',
    make: 'Honda TMX 155',
    motorNo: `MTR-${id}`,
    chassisNo: `CHS-${id}`,
    plateNo: `PLT-${id}`,
    todaName: 'BATODA',
    cedulaDate: new Date(),
    cedulaAddress: 'Gasan',
    cedulaSerialNo: 'CTC-001',
    applicationType: 'Renewal',
    isRenewalPending: true,
    status: 'For Payment',
    paymentStatus: 'Unpaid',
    previousStatus: 'Active',
    previousExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides
  });
}

function recordViolation(permit, fields = {}) {
  return request(app).post('/violations').set('Authorization', authorization).send({
    franchiseId: permit._id,
    violationType: 'Overcharging of fare',
    ...fields
  });
}

function settleViolation(id, body = {}) {
  return request(app).put(`/violations/${id}/settle`)
    .set('Authorization', authorization).send({ settledNotes: 'Citation reviewed.', ...body });
}

beforeAll(async () => {
  database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(database.getUri());
  const staff = await createUser('bplo_staff');
  operator = await createUser('operator');
  authorization = `Bearer ${jwt.sign({
    id: staff._id,
    tokenType: 'access',
    tokenVersion: staff.tokenVersion
  }, process.env.JWT_SECRET)}`;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await database?.stop();
});

describe('Batch 2 H8 settlement standing', () => {
  it.each([
    ['standalone permit', {
      applicationType: 'New', status: 'Active', isRenewalPending: false, previousStatus: '', previousExpiryDate: null
    }, 'status'],
    ['issued permit under renewal', {}, 'previousStatus']
  ])('preserves an unresolved suspension when settling a warning on a %s', async (_label, overrides, statusField) => {
    const permit = await createPermit(overrides);
    const warning = (await recordViolation(permit).expect(201)).body.violation;
    const suspension = (await recordViolation(permit, { violationType: 'Refusal to convey passengers' }).expect(201)).body.violation;
    const suspended = await Franchise.findById(permit._id).lean();

    await settleViolation(warning._id).expect(200);

    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: suspended.status,
      [statusField]: 'Suspended',
      currentSanction: suspended.currentSanction,
      suspensionEndDate: suspended.suspensionEndDate,
      suspensionReason: suspended.suspensionReason,
      activeViolationCount: 1
    });
    expect(await Violation.findById(warning._id).lean()).toMatchObject({ status: 'Settled' });
    expect(await Violation.findById(suspension._id).lean()).toMatchObject({ status: 'Active' });
  });

  it.each([
    ['warning', 'settle', 'Revoked'],
    ['revocation', 'settle', 'Revoked'],
    ['revocation', 'lift', 'Suspended']
  ])('resolves (%s via %s) on a revoked issued permit while two citations remain', async (targetSanction, action, expectedStatus) => {
    const permit = await createPermit({ status: 'Pending' });
    const warning = (await recordViolation(permit).expect(201)).body.violation;
    const suspension = (await recordViolation(permit, { violationType: 'Refusal to convey passengers' }).expect(201)).body.violation;
    const recordedRevocation = await recordViolation(permit, { violationType: 'Reckless or dangerous driving' }).expect(201);
    const revocation = recordedRevocation.body.violation;
    expect(recordedRevocation.body.franchise.status).toBe('Revoked');

    const citation = targetSanction === 'warning' ? warning : revocation;
    const settlement = await settleViolation(citation._id, { action }).expect(200);

    expect(settlement.body.franchiseStatus).toBe(expectedStatus);
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'Pending', previousStatus: expectedStatus, activeViolationCount: 2
    });
    expect(await Violation.findById(suspension._id).lean()).toMatchObject({ status: 'Active' });
  });

  it('keeps a separate administrative revocation when a citation is settled', async () => {
    const permit = await createPermit({ status: 'Pending' });
    const warning = (await recordViolation(permit).expect(201)).body.violation;
    await Franchise.updateOne({ _id: permit._id }, {
      $set: { previousStatus: 'Revoked', suspensionReason: 'Revoked by administrative order.' }
    });

    const settlement = await settleViolation(warning._id).expect(200);

    expect(settlement.body.franchiseStatus).toBe('Revoked');
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'Pending', previousStatus: 'Revoked', suspensionReason: 'Revoked by administrative order.', activeViolationCount: 0
    });
  });

  it('clears citation revocation details when the last grave citation on a standalone permit is lifted in error', async () => {
    const permit = await createPermit({
      applicationType: 'New', status: 'Active', isRenewalPending: false, previousStatus: '', previousExpiryDate: null
    });
    const recorded = await recordViolation(permit, {
      violationCode: 'NO_FRANCHISE',
      violationType: 'Operating without valid franchise / Colorum',
      evidenceUrl: '/uploads/evidence.pdf'
    }).expect(201);
    expect(recorded.body.franchise.status).toBe('Revoked');

    const lifted = await settleViolation(recorded.body.violation._id, { action: 'lift' }).expect(200);

    expect(lifted.body.franchiseStatus).toBe('Active');
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'Active', cancelReason: '', evidenceUrl: '', activeViolationCount: 0
    });
  });

  it('restores the active citation if the franchise standing write conflicts', async () => {
    const permit = await createPermit();
    const warning = (await recordViolation(permit).expect(201)).body.violation;
    jest.spyOn(Franchise, 'findOneAndUpdate').mockResolvedValueOnce(null);

    await settleViolation(warning._id).expect(409);

    expect(await Violation.findById(warning._id).lean()).toMatchObject({ status: 'Active', settledNotes: '' });
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'For Payment', previousStatus: 'Active - Under Warning', activeViolationCount: 1
    });
  });

  it('keeps an in-flight settlement isolated from another citation write', async () => {
    const permit = await createPermit();
    const warning = (await recordViolation(permit).expect(201)).body.violation;
    let notifyUpdateStarted;
    let allowFranchiseUpdate;
    const updateStarted = new Promise((resolve) => { notifyUpdateStarted = resolve; });
    const updateAllowed = new Promise((resolve) => { allowFranchiseUpdate = resolve; });
    const originalUpdate = Franchise.findOneAndUpdate;
    jest.spyOn(Franchise, 'findOneAndUpdate').mockImplementationOnce(async (...args) => {
      notifyUpdateStarted();
      await updateAllowed;
      return originalUpdate.apply(Franchise, args);
    });
    const settlement = settleViolation(warning._id).then((response) => response);

    try {
      await Promise.race([updateStarted, settlement]);
      await recordViolation(permit).expect(409);
    } finally {
      allowFranchiseUpdate();
      expect((await settlement).status).toBe(200);
    }

    expect(await Violation.countDocuments({ franchise: permit._id, status: 'Active' })).toBe(0);
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'For Payment', previousStatus: 'Active', activeViolationCount: 0
    });
  });
});

describe('Batch 2 H9 renewal discipline', () => {
  it('records and settles a warning on the issued permit throughout early renewal', async () => {
    const permit = await createPermit();
    const recorded = await recordViolation(permit).expect(201);

    expect(recorded.body.franchise.status).toBe('Active - Under Warning');
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'For Payment',
      paymentStatus: 'Unpaid',
      previousStatus: 'Active - Under Warning',
      previousExpiryDate: permit.previousExpiryDate,
      activeViolationCount: 1
    });

    const settlement = await settleViolation(recorded.body.violation._id).expect(200);

    expect(settlement.body.franchiseStatus).toBe('Active');
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'For Payment',
      previousStatus: 'Active',
      previousExpiryDate: permit.previousExpiryDate,
      activeViolationCount: 0
    });
  });

  it('revokes the prior permit on a cancelled renewal and retains the application reason', async () => {
    const permit = await createPermit({
      status: 'Cancelled',
      isRenewalPending: false,
      cancelReason: 'Operator withdrew the renewal.'
    });

    await recordViolation(permit, {
      violationCode: 'NO_FRANCHISE',
      violationType: 'Operating without valid franchise / Colorum'
    }).expect(201);

    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'Cancelled',
      cancelReason: permit.cancelReason,
      previousStatus: 'Revoked',
      previousExpiryDate: permit.previousExpiryDate
    });
  });

  it('uses the issued expiry when the renewal record has a future application expiry', async () => {
    const permit = await createPermit({
      previousExpiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await recordViolation(permit).expect(400);

    expect(await Violation.countDocuments({ franchise: permit._id })).toBe(0);
    expect(await Franchise.findById(permit._id).lean()).toMatchObject({
      status: 'For Payment',
      previousStatus: 'Active'
    });
  });
});
