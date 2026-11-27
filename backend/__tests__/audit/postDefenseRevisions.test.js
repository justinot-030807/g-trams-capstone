process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { app, server } = require('../../server');
const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Violation = require('../../src/models/violationModel');
const SystemSettings = require('../../src/models/systemSettingsModel');
const AuditLog = require('../../src/models/auditLogModel');
const Notification = require('../../src/models/notificationModel');
const TodaRoster = require('../../src/models/todaModel');
const Ticket = require('../../src/models/ticketModel');
const { isNameMatch, extractNameTokens } = require('../../src/utils/nameMatcher');
const { validateOperatorAgainstRoster } = require('../../src/utils/rosterValidator');
const { validateBackupPayload } = require('../../src/services/backupService');
const { syncFranchiseStatuses } = require('../../src/services/cronService');

const DAY = 24 * 60 * 60 * 1000;

let mongo;
let adminUser;
let staffUser;
let todaPresUser;
let operatorUser;

const makeToken = (user) =>
    'Bearer ' +
    jwt.sign(
        { id: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion || 0, tokenType: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

const buildFranchisePayload = (overrides = {}) => {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return {
        fullName: operatorUser.name,
        address: 'Poblacion, Gasan, Marinduque',
        zone: 'Central',
        made: '2025',
        make: 'Honda TMX 125',
        motorNo: `MTR-PD-${suffix}`,
        chassisNo: `CHS-PD-${suffix}`,
        plateNo: `PLT-PD-${suffix}`,
        todaName: 'BATODA',
        color: 'RED/BLACK',
        isOperatorDriver: false,
        driverName: 'Mario Driver',
        driverContact: '09171234567',
        driverDlCodes: 'A, A1',
        cedulaDate: '2026-01-15',
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: `CTC-PD-${suffix}`,
        ...overrides
    };
};

const createActiveFranchise = (overrides = {}) => {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return Franchise.create({
        operator: operatorUser._id,
        fullName: operatorUser.name,
        address: 'Poblacion, Gasan, Marinduque',
        zone: 'Central',
        made: '2025',
        make: 'Honda TMX 125',
        color: 'RED/BLACK',
        motorNo: `MTR-ACT-${suffix}`,
        chassisNo: `CHS-ACT-${suffix}`,
        plateNo: `PLT-ACT-${suffix}`,
        todaName: 'BATODA',
        cedulaDate: new Date('2026-01-15'),
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: `CTC-ACT-${suffix}`,
        status: 'Active',
        paymentStatus: 'Paid',
        expiryDate: new Date(Date.now() + 180 * DAY),
        ...overrides
    });
};

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongo.getUri());

    [adminUser, staffUser, todaPresUser, operatorUser] = await User.create([
        {
            name: 'IT System Admin',
            address: 'Gasan Municipal Hall',
            contact: 'pd.admin@gtrams.test',
            email: 'pd.admin@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'system_admin'
        },
        {
            name: 'OVM LLSA Staff',
            address: 'Gasan Municipal Hall',
            contact: 'pd.staff@gtrams.test',
            email: 'pd.staff@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'bplo_staff'
        },
        {
            name: 'BATODA President',
            address: 'Bahi, Gasan',
            contact: 'pd.pres@gtrams.test',
            email: 'pd.pres@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'toda_president',
            todaAssociation: 'BATODA'
        },
        {
            name: 'Juan Dela Cruz',
            address: 'Poblacion, Gasan',
            contact: '09170000001',
            email: 'pd.operator@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'operator',
            todaAssociation: 'BATODA',
            bodyNumber: '001'
        }
    ]);
}, 90000);

beforeEach(async () => {
    await Promise.all([
        Franchise.deleteMany({}),
        Violation.deleteMany({}),
        SystemSettings.deleteMany({}),
        AuditLog.deleteMany({}),
        Notification.deleteMany({}),
        TodaRoster.deleteMany({}),
        Ticket.deleteMany({})
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
    server.close();
});

describe('Post-Defense Revision #1: Strict Registration Roster Matching', () => {
    it('enforces exact first name + full surname matching in nameMatcher while supporting Filipino formats and diacritics', () => {
        expect(extractNameTokens('Juan')).toEqual(['juan']);

        // Strictly blocked cases
        expect(isNameMatch('Juan', 'DELA CRUZ, JUAN M.')).toBe(false);
        expect(isNameMatch('Juan Dela Crz', 'DELA CRUZ, JUAN M.')).toBe(false);
        expect(isNameMatch('Juna Dela Cruz', 'DELA CRUZ, JUAN M.')).toBe(false);
        expect(isNameMatch('Pedro Dela Cruz', 'DELA CRUZ, JUAN M.')).toBe(false);
        expect(isNameMatch('Maria Pen', 'PEÑA, MARIA R.')).toBe(false);

        // Valid Filipino formats + diacritics
        expect(isNameMatch('Juan Dela Cruz', 'DELA CRUZ, JUAN M.')).toBe(true);
        expect(isNameMatch('DELA CRUZ, JUAN', 'DELA CRUZ, JUAN M.')).toBe(true);
        expect(isNameMatch('DELA CRUZ, JUAN M.', 'DELA CRUZ, JUAN M.')).toBe(true);
        expect(isNameMatch('Juan M. Dela Cruz', 'DELA CRUZ, JUAN M.')).toBe(true);
        expect(isNameMatch('Juan De La Cruz', 'DELA CRUZ, JUAN M.')).toBe(true);
        expect(isNameMatch('Maria Peña', 'PEÑA, MARIA R.')).toBe(true);
        expect(isNameMatch('Maria Pena', 'PEÑA, MARIA R.')).toBe(true);
        expect(isNameMatch('Ma. Pena', 'PEÑA, MARIA R.')).toBe(true);
    });

    it('rejects missing surname, misspelled surname, and wrong first name on POST /api/v1/auth/verify-roster while accepting exact & diacritic variants', async () => {
        await TodaRoster.create([
            {
                todaAssociation: 'BATODA',
                operatorName: 'DELA CRUZ, JUAN M.',
                bodyNumber: '001',
                status: 'Active'
            },
            {
                todaAssociation: 'BATODA',
                operatorName: 'PEÑA, MARIA R.',
                bodyNumber: '002',
                status: 'Active'
            }
        ]);

        const verify = (fullName, bodyNumber = '001') =>
            request(app)
                .post('/api/v1/auth/verify-roster')
                .send({ fullName, todaAssociation: 'BATODA', bodyNumber });

        // Direct rosterValidator report assertions + HTTP /verify-roster (returns 403 anti-enumeration on rejection, 200 on match)
        const missingSurnameReport = await validateOperatorAgainstRoster({ fullName: 'Juan', todaAssociation: 'BATODA', bodyNumber: '001' });
        expect(missingSurnameReport.isValid).toBe(false);
        expect(missingSurnameReport.status).toBe('incomplete_name');

        const missingSurname = await verify('Juan', '001').expect(403);
        expect(missingSurname.body.verified).toBe(false);

        const misspelledSurname = await verify('Juan Dela Crz', '001').expect(403);
        expect(misspelledSurname.body.verified).toBe(false);

        const wrongFirstName = await verify('Pedro Dela Cruz', '001').expect(403);
        expect(wrongFirstName.body.verified).toBe(false);

        // Accepted variants
        for (const validName of ['Juan Dela Cruz', 'DELA CRUZ, JUAN', 'DELA CRUZ, JUAN M.']) {
            const res = await verify(validName, '001').expect(200);
            expect(res.body.verified).toBe(true);
            expect(res.body.status).toBe('verified');
        }

        for (const diacriticName of ['Maria Peña', 'Maria Pena']) {
            const res = await verify(diacriticName, '002').expect(200);
            expect(res.body.verified).toBe(true);
            expect(res.body.status).toBe('verified');
        }
    });
});

describe('Post-Defense Revision #2 & #5A: Single 4-Digit Fiscal Year & Per-Section Settings Validation', () => {
    it('rejects range/malformed fiscalYear on PUT /api/v1/settings, accepts 4-digit year, and self-heals legacy "2026-2027" on GET, partial PUT, and backup restore', async () => {
        for (const badFy of ['2026-2027', 'abc', '', '202', '1999']) {
            const res = await request(app)
                .put('/api/v1/settings')
                .set('Authorization', makeToken(adminUser))
                .send({ fiscalYear: badFy })
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/single 4-digit year/i);
        }

        const okRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ fiscalYear: '2026' })
            .expect(200);
        expect(okRes.body.data.fiscalYear).toBe('2026');

        // Seed legacy "2026-2027" directly in MongoDB (simulating existing Atlas record)
        await SystemSettings.deleteMany({});
        await SystemSettings.collection.insertOne({
            fiscalYear: '2026-2027',
            franchiseFee: 500,
            farePerKm: 3.5,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // GET self-heals to "2026"
        const getRes = await request(app).get('/api/v1/settings').expect(200);
        expect(getRes.body.data.fiscalYear).toBe('2026');

        // Partial PUT omitting fiscalYear & farePerKm self-heals fiscalYear and preserves farePerKm
        const partialRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ baseFare: 20 })
            .expect(200);
        expect(partialRes.body.data.fiscalYear).toBe('2026');
        expect(partialRes.body.data.baseFare).toBe(20);
        expect(partialRes.body.data.farePerKm).toBe(3.5);

        // Backup preflight validator also self-heals legacy "2026-2027" cleanly
        const prepared = await validateBackupPayload({
            manifest: { version: '2.0.0' },
            collections: {
                system_settings: [{ fiscalYear: '2026-2027', franchiseFee: 500 }]
            }
        });
        expect(prepared.system_settings[0].fiscalYear).toBe('2026');
    });

    it('rejects invalid numeric settings with HTTP 400 and supports 0-fine violation types without wiping custom tiers', async () => {
        await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ franchiseFee: -10 })
            .expect(400);

        await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ validityNew: 0 })
            .expect(400);

        await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ maxUnitsPerOperator: 0 })
            .expect(400);

        // Save custom tier first
        await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({
                violationPolicy: {
                    tiers: {
                        secondOffense: { defaultFine: 750, defaultSuspensionDays: 21 }
                    }
                }
            })
            .expect(200);

        // Update only types (including a valid ₱0 fine type) -> custom tiers must be preserved
        const zeroFineRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({
                violationPolicy: {
                    types: [
                        { code: 'WARNING_ONLY', name: 'Minor uniform infraction', severity: 'Low', isGrave: false, defaultFine: 0, suspensionDays: 0, isActive: true }
                    ]
                }
            })
            .expect(200);

        expect(zeroFineRes.body.data.violationPolicy.types[0].defaultFine).toBe(0);
        expect(zeroFineRes.body.data.violationPolicy.tiers.secondOffense.defaultSuspensionDays).toBe(21);
    });
});

describe('Post-Defense Revision #3 & #4: 11-Digit Mobile Validation & Free-Text Tricycle Colors', () => {
    it('enforces 11-digit PH mobile validation on profile update, driverContact, TODA member, and support ticket while normalizing +639 / dashed formats', async () => {
        // 1. Profile update (emergencyContact & recoveryPhone)
        await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', makeToken(operatorUser))
            .send({ emergencyContact: '091712345678' })
            .expect(400);

        await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', makeToken(operatorUser))
            .send({ emergencyContact: '12345' })
            .expect(400);

        await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', makeToken(operatorUser))
            .send({ recoveryPhone: '091712345678', currentPassword: 'FixturePassword!99' })
            .expect(400);

        const okProfileDash = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', makeToken(operatorUser))
            .send({ emergencyContact: '0912-345-6789' })
            .expect(200);
        expect(okProfileDash.body.emergencyContact).toBe('09123456789');

        const okProfilePlus63 = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', makeToken(operatorUser))
            .send({ emergencyContact: '+639171234567' })
            .expect(200);
        expect(okProfilePlus63.body.emergencyContact).toBe('09171234567');

        // 2. Franchise driverContact + Revision #4 free-text colors
        await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', makeToken(operatorUser))
            .send(buildFranchisePayload({ driverContact: '091712345678' }))
            .expect(400);

        await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', makeToken(operatorUser))
            .send(buildFranchisePayload({ color: 'X'.repeat(55) }))
            .expect(400);

        const unit1 = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', makeToken(operatorUser))
            .send(buildFranchisePayload({ driverContact: '+639171234567', color: 'RED/BLACK' }))
            .expect(201);
        expect(unit1.body.driverContact).toBe('09171234567');
        expect(unit1.body.color).toBe('RED/BLACK');

        const unit2 = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', makeToken(operatorUser))
            .send(buildFranchisePayload({ driverContact: '0912-345-6789', color: 'MATTE BLUE & WHITE' }))
            .expect(201);
        expect(unit2.body.driverContact).toBe('09123456789');
        expect(unit2.body.color).toBe('MATTE BLUE & WHITE');

        // 3. TODA individual member contact
        await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', makeToken(todaPresUser))
            .send({ operatorName: 'Roberto Santos', contact: '091712345678' })
            .expect(400);

        const todaOk = await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', makeToken(todaPresUser))
            .send({ operatorName: 'Roberto Santos', contact: '+639181112233' })
            .expect(201);
        expect(todaOk.body.member.contact).toBe('09181112233');

        // 4. Support ticket contactNumber
        await request(app)
            .post('/api/v1/tickets')
            .set('Authorization', makeToken(operatorUser))
            .send({ subject: 'Login help', contactNumber: '091712345678', message: 'Need help.' })
            .expect(400);

        const ticketPhoneOk = await request(app)
            .post('/api/v1/tickets')
            .set('Authorization', makeToken(operatorUser))
            .send({ subject: 'Renewal inquiry', contactNumber: '0912-345-6789', message: 'Checking renewal.' })
            .expect(201);
        expect(ticketPhoneOk.body.ticket.contactNumber).toBe('09123456789');

        const ticketPlus63Ok = await request(app)
            .post('/api/v1/tickets')
            .set('Authorization', makeToken(operatorUser))
            .send({ subject: 'Permit inquiry', contactNumber: '+639171234567', message: 'Checking permit.' })
            .expect(201);
        expect(ticketPlus63Ok.body.ticket.contactNumber).toBe('09171234567');
    });
});

describe('Post-Defense Revision #5: Non-Retroactive Policy Snapshotting (₱1,000 → ₱1,500) & Revocation Permanence', () => {
    it('executes full ₱1,000 → ₱1,500 lifecycle: locks Policy v1, ignores client overrides, logs AuditLog diff on v2, sums ₱2,500 unpaid, guards cron, escalates to 3rd Offense Revocation after settlement, keeps Revoked permanent on settle, and allows lift on error', async () => {
        const franchise = await createActiveFranchise({ plateNo: 'PD5-PLT01' });

        // Ensure Policy v1 exists with RECKLESS_DRIVING = ₱1,000
        await SystemSettings.create({});

        // Reject unknown violation type & untrusted external evidence URL
        await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({ franchiseId: franchise._id, violationType: 'Made Up Violation Type' })
            .expect(400);

        await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({
                franchiseId: franchise._id,
                violationCode: 'RECKLESS_DRIVING',
                evidenceUrl: 'https://evil.example.com/spoofed.pdf'
            })
            .expect(400);

        // 1. Record Violation #1 under Policy v1 (₱1,000) with spoofed client overrides
        const v1Res = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({
                franchiseId: franchise._id,
                violationCode: 'RECKLESS_DRIVING',
                violationType: 'Reckless or dangerous driving',
                customFine: 1,
                customSuspensionDays: 99,
                severity: 'Low',
                isGrave: true,
                evidenceUrl: '/uploads/citation-1.pdf'
            })
            .expect(201);

        const v1 = v1Res.body.violation;
        expect(v1.offenseNumber).toBe(1);
        expect(v1.severity).toBe('High');
        expect(v1.isGrave).toBe(false);
        expect(v1.sanction.type).toBe('Warning');
        expect(v1.sanction.resultingStatus).toBe('Active - Under Warning');
        expect(v1.sanction.fineAmount).toBe(1000);
        expect(v1.sanction.suspensionDays).toBe(0);
        expect(v1.policySnapshot).toMatchObject({
            policyVersion: 1,
            violationCode: 'RECKLESS_DRIVING',
            fineAtCitation: 1000,
            appliedTier: 'firstOffense'
        });

        // Verify Mongoose schema immutability prevents altering fineAmount or policySnapshot after creation
        const v1Doc = await Violation.findById(v1._id);
        v1Doc.sanction.fineAmount = 9999;
        v1Doc.policySnapshot.fineAtCitation = 9999;
        await v1Doc.save();
        const v1Reloaded = await Violation.findById(v1._id).lean();
        expect(v1Reloaded.sanction.fineAmount).toBe(1000);
        expect(v1Reloaded.policySnapshot.fineAtCitation).toBe(1000);

        // 2. IT Admin updates RECKLESS_DRIVING fine from ₱1,000 → ₱1,500
        const currentSettings = (await request(app).get('/api/v1/settings').expect(200)).body.data;
        const updatedTypes = currentSettings.violationPolicy.types.map((t) =>
            t.code === 'RECKLESS_DRIVING' ? { ...t, defaultFine: 1500 } : t
        );

        const settingsUpdateRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', makeToken(adminUser))
            .send({ violationPolicy: { types: updatedTypes } })
            .expect(200);

        expect(settingsUpdateRes.body.data.violationPolicy.policyVersion).toBe(2);
        expect(settingsUpdateRes.body.data.violationPolicy.policyUpdatedAt).toBeTruthy();

        const policyAudit = await AuditLog.findOne({ action: 'SYSTEM_SETTINGS_UPDATED' }).sort({ createdAt: -1 }).lean();
        expect(policyAudit).toBeTruthy();
        expect(policyAudit.details.policyVersionBefore).toBe(1);
        expect(policyAudit.details.policyVersionAfter).toBe(2);
        const recklessDiff = policyAudit.details.violationPolicyDiff.typeChanges.find((c) => c.code === 'RECKLESS_DRIVING');
        expect(recklessDiff).toBeTruthy();
        expect(recklessDiff.before.defaultFine).toBe(1000);
        expect(recklessDiff.after.defaultFine).toBe(1500);

        // 3. Verify Violation #1 is STILL ₱1,000, then record Violation #2 -> locked at ₱1,500 (Policy v2), Suspended
        const v1AfterPolicyUpdate = await Violation.findById(v1._id).lean();
        expect(v1AfterPolicyUpdate.sanction.fineAmount).toBe(1000);
        expect(v1AfterPolicyUpdate.policySnapshot.policyVersion).toBe(1);

        const v2Res = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({
                franchiseId: franchise._id,
                violationCode: 'RECKLESS_DRIVING',
                evidenceUrl: '/uploads/citation-2.pdf'
            })
            .expect(201);

        const v2 = v2Res.body.violation;
        expect(v2.offenseNumber).toBe(2);
        expect(v2.sanction.type).toBe('Suspension');
        expect(v2.sanction.resultingStatus).toBe('Suspended');
        expect(v2.sanction.fineAmount).toBe(1500);
        expect(v2.sanction.suspensionDays).toBe(30);
        expect(v2.policySnapshot).toMatchObject({
            policyVersion: 2,
            fineAtCitation: 1500,
            appliedTier: 'secondOffense'
        });

        // Verify history endpoint fineSummary = ₱1,000 + ₱1,500 = ₱2,500
        const histBeforeSettle = await request(app)
            .get(`/api/v1/violations/history/${franchise._id}`)
            .set('Authorization', makeToken(staffUser))
            .expect(200);
        expect(histBeforeSettle.body.cumulativeOffenseCount).toBe(2);
        expect(histBeforeSettle.body.activeViolationCount).toBe(2);
        expect(histBeforeSettle.body.fineSummary).toEqual({
            totalUnpaidFines: 2500,
            totalSettledFines: 0,
            totalFinesAssessed: 2500
        });
        expect(histBeforeSettle.body.policy.policyVersion).toBe(2);

        // Cron guard: expired suspensionEndDate MUST NOT reinstate while ₱1,500 suspension fine is unpaid
        await Franchise.updateOne(
            { _id: franchise._id },
            { $set: { suspensionEndDate: new Date(Date.now() - DAY) } }
        );
        await syncFranchiseStatuses();
        expect((await Franchise.findById(franchise._id).lean()).status).toBe('Suspended');

        // 4. Settle Violation #1 & #2 -> lifts suspension to Active, preserves cumulative strike count (2)
        await request(app)
            .put(`/api/v1/violations/${v1._id}/settle`)
            .set('Authorization', makeToken(staffUser))
            .send({ action: 'settle', settledNotes: 'OR-1001' })
            .expect(200);
        expect((await Franchise.findById(franchise._id).lean()).status).toBe('Suspended');

        const settleV2 = await request(app)
            .put(`/api/v1/violations/${v2._id}/settle`)
            .set('Authorization', makeToken(staffUser))
            .send({ action: 'settle', settledNotes: 'OR-1002' })
            .expect(200);
        expect(settleV2.body.franchiseStatus).toBe('Active');
        expect((await Franchise.findById(franchise._id).lean()).status).toBe('Active');

        const settleNotifs = await Notification.find({
            recipient: operatorUser._id,
            title: 'Violation Fine Settled'
        }).lean();
        expect(settleNotifs.length).toBeGreaterThanOrEqual(2);

        const histAfterSettle = await request(app)
            .get(`/api/v1/violations/history/${franchise._id}`)
            .set('Authorization', makeToken(staffUser))
            .expect(200);
        expect(histAfterSettle.body.cumulativeOffenseCount).toBe(2);
        expect(histAfterSettle.body.activeViolationCount).toBe(0);
        expect(histAfterSettle.body.nextOffenseNumber).toBe(3);
        expect(histAfterSettle.body.expectedSanction).toBe('Revocation');
        expect(histAfterSettle.body.fineSummary.totalUnpaidFines).toBe(0);
        expect(histAfterSettle.body.fineSummary.totalSettledFines).toBe(2500);

        // 5. Record Violation #3 -> escalates cleanly to 3rd Offense Revocation (Revoked)
        const v3Res = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({
                franchiseId: franchise._id,
                violationCode: 'RECKLESS_DRIVING',
                evidenceUrl: '/uploads/citation-3.pdf'
            })
            .expect(201);
        const v3 = v3Res.body.violation;
        expect(v3.offenseNumber).toBe(3);
        expect(v3.sanction.type).toBe('Revocation');
        expect(v3.sanction.resultingStatus).toBe('Revoked');
        expect(v3.sanction.fineAmount).toBe(1500);
        expect(v3.policySnapshot.policyVersion).toBe(2);
        expect(v3Res.body.franchise.status).toBe('Revoked');
        expect(v3Res.body.franchise.currentSanction).toBe('Revocation (3rd Offense)');

        // 6. Settle Violation #3's fine -> franchise stays PERMANENTLY Revoked!
        const settleV3 = await request(app)
            .put(`/api/v1/violations/${v3._id}/settle`)
            .set('Authorization', makeToken(staffUser))
            .send({ action: 'settle', settledNotes: 'OR-1003' })
            .expect(200);
        expect(settleV3.body.violation.status).toBe('Settled');
        expect(settleV3.body.franchiseStatus).toBe('Revoked');
        expect((await Franchise.findById(franchise._id).lean()).status).toBe('Revoked');

        // 7. Separate unit: Grave citation revokes directly ('Revocation (Grave Violation)'), and action: 'lift' reverses erroneous citation cleanly
        const franchise2 = await createActiveFranchise({ plateNo: 'PD5-PLT02' });
        const graveRes = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', makeToken(staffUser))
            .send({
                franchiseId: franchise2._id,
                violationCode: 'NO_FRANCHISE',
                evidenceUrl: '/uploads/colorum-err.pdf'
            })
            .expect(201);
        expect(graveRes.body.violation.isGrave).toBe(true);
        expect(graveRes.body.violation.sanction.fineAmount).toBe(2000);
        expect(graveRes.body.franchise.status).toBe('Revoked');
        expect(graveRes.body.franchise.currentSanction).toBe('Revocation (Grave Violation)');

        const liftRes = await request(app)
            .put(`/api/v1/violations/${graveRes.body.violation._id}/settle`)
            .set('Authorization', makeToken(staffUser))
            .send({ action: 'lift', settledNotes: 'Wrong plate encoded; dismissed in error.' })
            .expect(200);
        expect(liftRes.body.action).toBe('lift');
        expect(liftRes.body.violation.status).toBe('Lifted');
        expect(liftRes.body.franchiseStatus).toBe('Active');

        const restoredFranchise2 = await Franchise.findById(franchise2._id).lean();
        expect(restoredFranchise2.status).toBe('Active');
        expect(restoredFranchise2.cancelReason).toBe('');
        expect(restoredFranchise2.evidenceUrl).toBe('');

        const histAfterLift = await request(app)
            .get(`/api/v1/violations/history/${franchise2._id}`)
            .set('Authorization', makeToken(staffUser))
            .expect(200);
        expect(histAfterLift.body.cumulativeOffenseCount).toBe(0);
    }, 60000);
});
