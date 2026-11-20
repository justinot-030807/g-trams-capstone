process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../../server');
const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Violation = require('../../src/models/violationModel');
const PaymentLedger = require('../../src/models/paymentLedgerModel');
const TodaRoster = require('../../src/models/todaModel');
const SystemSettings = require('../../src/models/systemSettingsModel');
const Notification = require('../../src/models/notificationModel');
const { ChatThread, ChatMessage } = require('../../src/models/chatModel');
const { syncFranchiseStatuses } = require('../../src/services/cronService');

let mongoServer;

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

const makeFranchisePayload = (overrides = {}) => ({
  operator: overrides.operator,
  fullName: overrides.fullName || 'Juan Dela Cruz',
  address: 'Poblacion, Gasan',
  contactNo: '09171234567',
  todaName: 'BATODA',
  zone: 'Central',
  bodyNumber: overrides.bodyNumber || 'BAT-01',
  make: 'Honda TMX 155',
  made: '2023',
  plateNo: overrides.plateNo || `PLT-${Math.floor(Math.random() * 90000 + 10000)}`,
  motorNo: overrides.motorNo || `MTR-${Math.floor(Math.random() * 90000 + 10000)}`,
  chassisNo: overrides.chassisNo || `CHS-${Math.floor(Math.random() * 90000 + 10000)}`,
  cedulaDate: new Date(),
  cedulaAddress: 'Gasan, Marinduque',
  cedulaSerialNo: `CTC-${Math.floor(Math.random() * 90000 + 10000)}`,
  applicationType: 'New',
  status: 'Active',
  paymentStatus: 'Paid',
  ...overrides,
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Franchise.deleteMany({}),
    Violation.deleteMany({}),
    PaymentLedger.deleteMany({}),
    TodaRoster.deleteMany({}),
    SystemSettings.deleteMany({}),
    Notification.deleteMany({}),
    ChatThread.deleteMany({}),
    ChatMessage.deleteMany({}),
  ]);
});

describe('Codex Audit Remediation Suite (H2–H5, M2, M6–M8, M10–M14, L3, L6)', () => {
  it('H2 + M2: enforces reauth for Google-linked/Google-only recovery and preserves legacy backupContact on routine profile edits', async () => {
    const legacyUser = await User.create({
      name: 'Legacy Operator',
      address: 'Bahi, Gasan',
      contact: 'legacy.op@test.com',
      email: 'legacy.op@test.com',
      backupContact: '09181112222',
      password: 'Password123!',
      role: 'operator',
      todaAssociation: 'BATODA',
      isVerified: true,
      isActive: true,
      authProvider: 'local',
      hasLocalPassword: true,
    });
    const legacyToken = signToken(legacyUser);

    // Routine profile edit sending blank recoveryEmail & recoveryPhone MUST NOT wipe backupContact
    const editRes = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${legacyToken}`)
      .send({
        name: 'Legacy Operator Updated',
        emergencyContact: '09190001111',
        recoveryEmail: '',
        recoveryPhone: '',
      });
    expect(editRes.status).toBe(200);

    const afterEdit = await User.findById(legacyUser._id);
    expect(afterEdit.backupContact).toBe('09181112222');
    expect(afterEdit.emergencyContact).toBe('09190001111');

    // Google-only user cannot add recovery contact with bearer token alone when reauth is enforced
    const googleUser = await User.create({
      name: 'Google Only Op',
      address: 'Pangi, Gasan',
      contact: 'google.only@gmail.com',
      email: 'google.only@gmail.com',
      googleId: 'g-sub-only-1',
      authProvider: 'google',
      hasLocalPassword: false,
      password: 'RandomGeneratedPassword!99',
      role: 'operator',
      todaAssociation: 'BATODA',
      isVerified: true,
      isActive: true,
    });
    const googleToken = signToken(googleUser);

    const blockedRes = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${googleToken}`)
      .send({
        recoveryEmail: 'attacker@evil.test',
        enforceReauth: true,
      });
    expect(blockedRes.status).toBe(401);
  });

  it('H3: public TODA roster mismatch never discloses registered operator name or body number', async () => {
    await TodaRoster.create({
      todaAssociation: 'BATODA',
      operatorName: 'Secret Registered Member',
      bodyNumber: 'BAT-77',
      status: 'Active',
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-roster')
      .send({
        fullName: 'Different Person',
        todaAssociation: 'BATODA',
        bodyNumber: 'BAT-77',
      });

    expect(res.status).toBe(403);
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('Secret Registered Member');
    expect(res.body.registeredTo).toBeUndefined();
    expect(res.body.officialBodyNumber).toBeUndefined();
  });

  it('H4: cron syncFranchiseStatuses atomically persists Expired in raw DB and notifies only once', async () => {
    const op = await User.create({
      name: 'Expiry Op',
      address: 'Bahi, Gasan',
      contact: 'expiry.op@test.com',
      password: 'Password123!',
      role: 'operator',
      isVerified: true,
      isActive: true,
    });

    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const franchise = await Franchise.create(
      makeFranchisePayload({
        operator: op._id,
        status: 'Active',
        expiryDate: pastDate,
        approvalDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      })
    );

    const firstRes = await syncFranchiseStatuses();
    expect(firstRes.count).toBe(1);

    // Check raw MongoDB collection bypassing Mongoose post('init') hook
    const rawDoc = await Franchise.collection.findOne({ _id: franchise._id });
    expect(rawDoc.status).toBe('Expired');

    const notifCount1 = await Notification.countDocuments({ recipient: op._id });
    expect(notifCount1).toBe(1);

    // Second run must transition 0 records and send 0 duplicate notices
    const secondRes = await syncFranchiseStatuses();
    expect(secondRes.count).toBe(0);
    const notifCount2 = await Notification.countDocuments({ recipient: op._id });
    expect(notifCount2).toBe(1);
  });

  it('H5: violation controller rejects sanctions on Pending/Unpaid applications without changing status', async () => {
    const bplo = await User.create({
      name: 'LLSA Officer',
      address: 'Poblacion, Gasan',
      contact: 'llsa.h5@test.com',
      password: 'Password123!',
      role: 'bplo_staff',
      isVerified: true,
      isActive: true,
    });
    const op = await User.create({
      name: 'Pending Op',
      address: 'Bahi, Gasan',
      contact: 'pending.h5@test.com',
      password: 'Password123!',
      role: 'operator',
      isVerified: true,
      isActive: true,
    });
    const pendingFranchise = await Franchise.create(
      makeFranchisePayload({
        operator: op._id,
        status: 'Pending',
        paymentStatus: 'Unpaid',
      })
    );

    const res = await request(app)
      .post('/api/v1/violations')
      .set('Authorization', `Bearer ${signToken(bplo)}`)
      .send({
        franchiseId: pendingFranchise._id.toString(),
        violationType: 'Overcharging of fare',
        remarks: 'Test invalid sanction against pending application',
      });

    expect(res.status).toBe(400);
    const afterFranchise = await Franchise.findById(pendingFranchise._id);
    expect(afterFranchise.status).toBe('Pending');
    expect(await Violation.countDocuments({ franchise: pendingFranchise._id })).toBe(0);
  });

  it('M6: rejects arbitrary external document URLs on franchise submission', async () => {
    const op = await User.create({
      name: 'Url Test Op',
      address: 'Bahi, Gasan',
      contact: 'url.m6@test.com',
      password: 'Password123!',
      role: 'operator',
      todaAssociation: 'BATODA',
      isVerified: true,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/v1/franchises')
      .set('Authorization', `Bearer ${signToken(op)}`)
      .send({
        fullName: 'Url Test Op',
        address: 'Bahi, Gasan',
        contactNo: '09171234567',
        todaName: 'BATODA',
        zone: 'Central',
        bodyNumber: 'BAT-99',
        make: 'Honda TMX',
        made: '2024',
        plateNo: 'M6-TEST-1',
        motorNo: 'M6-MTR-1',
        chassisNo: 'M6-CHS-1',
        cedulaDate: new Date().toISOString(),
        cedulaAddress: 'Gasan',
        cedulaSerialNo: 'CTC-9911',
        orCrUrl: 'https://evil-attacker.example.com/fake-orcr.png',
      });

    expect(res.status).toBe(400);
  });

  it('M7 + M8: rejects expired renewal docs, preserves live QR validity during early renewal, and reports real Violation counts in record-check', async () => {
    const bplo = await User.create({
      name: 'LLSA Reviewer',
      address: 'Poblacion, Gasan',
      contact: 'llsa.m7@test.com',
      password: 'Password123!',
      role: 'bplo_staff',
      isVerified: true,
      isActive: true,
    });
    const op = await User.create({
      name: 'Renewal Op',
      address: 'Bahi, Gasan',
      contact: 'renew.m7@test.com',
      password: 'Password123!',
      role: 'operator',
      todaAssociation: 'BATODA',
      isVerified: true,
      isActive: true,
    });
    const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const franchise = await Franchise.create(
      makeFranchisePayload({
        operator: op._id,
        fullName: op.name,
        status: 'Active - Under Warning',
        mtopNo: '2026-077',
        expiryDate: futureExpiry,
        violationCount: 1,
      })
    );

    await Violation.create({
      franchise: franchise._id,
      operator: op._id,
      plateNo: franchise.plateNo,
      bodyNumber: franchise.bodyNumber,
      violationType: 'Overcharging of fare',
      severity: 'Medium',
      offenseNumber: 1,
      sanction: {
        type: 'Warning',
        resultingStatus: 'Active - Under Warning',
      },
      status: 'Active',
      recordedBy: bplo._id,
      recordedByName: bplo.name,
    });

    // M8: record-check reports real Violation counts
    const checkRes = await request(app)
      .get(`/api/v1/franchises/${franchise._id}/record-check`)
      .set('Authorization', `Bearer ${signToken(bplo)}`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.totalViolations).toBeGreaterThanOrEqual(1);
    expect(checkRes.body.unsettledViolations).toBeGreaterThanOrEqual(1);
    expect(checkRes.body.warningCount).toBeGreaterThanOrEqual(1);

    // M7a: expired OR/CR date rejected with 400
    const badRenew = await request(app)
      .put(`/api/v1/franchises/${franchise._id}/renew`)
      .set('Authorization', `Bearer ${signToken(op)}`)
      .send({
        orCrExpiryDate: '2020-01-01',
        cedulaSerialNo: 'CTC-NEW-1',
        cedulaDate: new Date().toISOString(),
        cedulaAddress: 'Gasan',
      });
    expect(badRenew.status).toBe(400);

    // M7b: valid early renewal on Active - Under Warning succeeds & preserves live QR validity
    const okRenew = await request(app)
      .put(`/api/v1/franchises/${franchise._id}/renew`)
      .set('Authorization', `Bearer ${signToken(op)}`)
      .send({
        orCrExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        driverLicenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        cedulaSerialNo: 'CTC-NEW-2',
        cedulaDate: new Date().toISOString(),
        cedulaAddress: 'Gasan',
      });
    expect(okRenew.status).toBe(200);
    expect(okRenew.body.isRenewalPending).toBe(true);
    expect(okRenew.body.expiryDate).toBeTruthy();

    // Public QR verification MUST still report VALID while existing term is unexpired
    const qrRes = await request(app).get(`/api/v1/auth/verify/${franchise._id}`);
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.isCurrentlyValid).toBe(true);
    expect(qrRes.body.validityStatus).toBe('VALID');
    expect(qrRes.body.scannedFranchise.isRenewalPending).toBe(true);
  });

  it('M10 + M11: cashier payment assigns canonical mtopNo, writes PaymentLedger with collector, and survives archiving', async () => {
    const cashier = await User.create({
      name: 'Treasurer Maria',
      address: 'Poblacion, Gasan',
      contact: 'cashier.m11@test.com',
      password: 'Password123!',
      role: 'cashier',
      isVerified: true,
      isActive: true,
    });
    const op = await User.create({
      name: 'Pay Op',
      address: 'Bahi, Gasan',
      contact: 'pay.m11@test.com',
      password: 'Password123!',
      role: 'operator',
      isVerified: true,
      isActive: true,
    });
    const payable = await Franchise.create(
      makeFranchisePayload({
        operator: op._id,
        fullName: op.name,
        status: 'For Payment',
        paymentStatus: 'Unpaid',
        mtopNo: undefined,
      })
    );

    const payRes = await request(app)
      .post(`/api/v1/franchises/${payable._id}/pay`)
      .set('Authorization', `Bearer ${signToken(cashier)}`)
      .send({
        officialReceiptNo: 'OR-LEDGER-9901',
        amountPaid: 500,
        paymentMethod: 'Cash',
      });
    expect(payRes.status).toBe(200);
    // M10: canonical mtopNo assigned immediately upon entering For Signing
    expect(payRes.body.franchise.status).toBe('For Signing');
    expect(payRes.body.franchise.mtopNo).toBeTruthy();
    expect(payRes.body.ledgerEntry.processedByName).toBe('Treasurer Maria');

    // Archive the parent franchise — Cashier queue ledger MUST still preserve the receipt
    await Franchise.findByIdAndUpdate(payable._id, { $set: { isArchived: true } });

    const queueRes = await request(app)
      .get('/api/v1/franchises/cashier-queue')
      .set('Authorization', `Bearer ${signToken(cashier)}`);
    expect(queueRes.status).toBe(200);
    const ledgerRow = (queueRes.body.paymentLedger || []).find(
      (row) => row.officialReceiptNo === 'OR-LEDGER-9901'
    );
    expect(ledgerRow).toBeDefined();
    expect(ledgerRow.processedByName).toBe('Treasurer Maria');
    expect(ledgerRow.mtopNo).toBe(payRes.body.franchise.mtopNo);
  });

  it('M12: sanitizes custom-... draft announcement IDs and preserves explicit empty announcement arrays', async () => {
    const admin = await User.create({
      name: 'SysAdmin M12',
      address: 'Poblacion, Gasan',
      contact: 'admin.m12@test.com',
      password: 'Password123!',
      role: 'system_admin',
      isVerified: true,
      isActive: true,
    });
    const adminToken = signToken(admin);

    const createRes = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        announcements: [
          {
            _id: 'custom-1795099999999',
            type: 'alert',
            date: 'Nov 2026',
            title: 'Live Test Advisory',
            desc: 'Published cleanly with generated ObjectId.',
            isActive: true,
          },
        ],
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.data.announcements).toHaveLength(1);
    expect(mongoose.Types.ObjectId.isValid(createRes.body.data.announcements[0]._id)).toBe(true);
    expect(createRes.body.data.announcementsConfigured).toBe(true);

    // Clearing all announcements preserves empty array with announcementsConfigured: true
    const clearRes = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ announcements: [] });
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.data.announcements).toEqual([]);
    expect(clearRes.body.data.announcementsConfigured).toBe(true);
  });

  it('M13 + L3: blocks former staff from deleting old staff replies and scopes chat notification clearing per thread', async () => {
    const op = await User.create({
      name: 'Chat Op',
      address: 'Bahi, Gasan',
      contact: 'chat.op@test.com',
      password: 'Password123!',
      role: 'operator',
      isVerified: true,
      isActive: true,
    });
    const formerStaff = await User.create({
      name: 'Demoted Staff',
      address: 'Poblacion, Gasan',
      contact: 'former.staff@test.com',
      password: 'Password123!',
      role: 'operator', // demoted from bplo_staff
      isVerified: true,
      isActive: true,
    });

    const threadA = await ChatThread.create({
      owner: op._id,
      participants: [op._id, formerStaff._id],
      isAnnouncement: false,
    });
    const threadB = await ChatThread.create({
      owner: op._id,
      participants: [op._id],
      isAnnouncement: true,
    });

    const staffReply = await ChatMessage.create({
      thread: threadA._id,
      sender: formerStaff._id,
      senderRole: 'bplo_staff',
      message: 'Official municipal response',
    });

    // M13: demoted staff cannot delete their old official staff reply
    const delRes = await request(app)
      .delete(`/api/v1/chat/messages/${staffReply._id}`)
      .set('Authorization', `Bearer ${signToken(formerStaff)}`);
    expect(delRes.status).toBe(403);
    expect(await ChatMessage.findById(staffReply._id)).not.toBeNull();

    // L3: reading threadA only marks threadA chat notification read, NOT threadB
    const notifA = await Notification.create({
      recipient: op._id,
      title: 'Msg A',
      message: 'Thread A message',
      type: 'chat',
      threadId: threadA._id,
      isRead: false,
    });
    const notifB = await Notification.create({
      recipient: op._id,
      title: 'Msg B',
      message: 'Thread B announcement',
      type: 'chat',
      threadId: threadB._id,
      isRead: false,
    });

    const readRes = await request(app)
      .put(`/api/v1/chat/messages/${threadA._id}/read`)
      .set('Authorization', `Bearer ${signToken(op)}`);
    expect(readRes.status).toBe(200);

    expect((await Notification.findById(notifA._id)).isRead).toBe(true);
    expect((await Notification.findById(notifB._id)).isRead).toBe(false);
  });

  it('M14 + L6: blocks singleton role conflict on reactivation and marks orphaned QR permits INACTIVE_OWNER', async () => {
    const admin = await User.create({
      name: 'SysAdmin M14',
      address: 'Poblacion, Gasan',
      contact: 'admin.m14@test.com',
      password: 'Password123!',
      role: 'system_admin',
      isVerified: true,
      isActive: true,
    });
    await User.create({
      name: 'Active Cashier',
      address: 'Poblacion, Gasan',
      contact: 'cashier.active@test.com',
      password: 'Password123!',
      role: 'cashier',
      isVerified: true,
      isActive: true,
    });
    const inactiveCashier = await User.create({
      name: 'Old Cashier',
      address: 'Poblacion, Gasan',
      contact: 'cashier.old@test.com',
      password: 'Password123!',
      role: 'cashier',
      isVerified: true,
      isActive: false,
    });

    // M14: cannot reactivate second cashier while another cashier is active
    const reactivateRes = await request(app)
      .put(`/api/v1/auth/${inactiveCashier._id}/toggle-status`)
      .set('Authorization', `Bearer ${signToken(admin)}`)
      .send({ isActive: true });
    expect(reactivateRes.status).toBe(409);

    // L6: orphaned franchise whose owner was deleted must NOT report valid on public QR
    const deletedOp = await User.create({
      name: 'Deleted Op',
      address: 'Bahi, Gasan',
      contact: 'deleted.l6@test.com',
      password: 'Password123!',
      role: 'operator',
      isVerified: true,
      isActive: true,
    });
    const orphanFranchise = await Franchise.create(
      makeFranchisePayload({
        operator: deletedOp._id,
        status: 'Active',
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
      })
    );
    await User.findByIdAndDelete(deletedOp._id);

    const qrRes = await request(app).get(`/api/v1/auth/verify/${orphanFranchise._id}`);
    expect(qrRes.status).toBe(200);
    expect(qrRes.body.isActive).toBe(false);
    expect(qrRes.body.isCurrentlyValid).toBe(false);
    expect(qrRes.body.validityStatus).toBe('INACTIVE_OWNER');
  });
});
