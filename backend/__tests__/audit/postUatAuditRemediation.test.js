process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

const zlib = require('zlib');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../../server');
const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Violation = require('../../src/models/violationModel');
const Notification = require('../../src/models/notificationModel');
const SystemSettings = require('../../src/models/systemSettingsModel');

const DAY = 86400000;
let mongo;
let operator;
let otherOperator;
let staff;
let cashier;

const auth = (user) => 'Bearer ' + jwt.sign(
    { id: user.id, role: user.role, tokenVersion: user.tokenVersion || 0, tokenType: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

function parseBinaryResponse(res, cb) {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
}

function extractDocxEntryXml(zipBuf, targetName = 'word/document.xml') {
    let ptr = 0;
    while (ptr + 30 <= zipBuf.length) {
        if (zipBuf.readUInt32LE(ptr) !== 0x04034b50) break;
        const compression = zipBuf.readUInt16LE(ptr + 8);
        const compSize = zipBuf.readUInt32LE(ptr + 18);
        const nameLen = zipBuf.readUInt16LE(ptr + 26);
        const extraLen = zipBuf.readUInt16LE(ptr + 28);
        const nameStart = ptr + 30;
        const dataStart = nameStart + nameLen + extraLen;
        const entryName = zipBuf.toString('utf8', nameStart, nameStart + nameLen);
        const payload = zipBuf.subarray(dataStart, dataStart + compSize);
        if (entryName === targetName) {
            return (compression === 8 ? zlib.inflateRawSync(payload) : payload).toString('utf8');
        }
        ptr = dataStart + compSize;
    }
    return '';
}

const makeFranchise = (overrides = {}) => Franchise.create({
    operator: operator.id,
    fullName: operator.name,
    address: 'Poblacion, Gasan, Marinduque',
    zone: 'Central',
    made: '2025',
    make: 'Honda TMX 125',
    motorNo: `MTR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    chassisNo: `CHS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    plateNo: `PLT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    todaName: 'BATODA',
    cedulaDate: new Date('2026-01-10'),
    cedulaAddress: 'Gasan, Marinduque',
    cedulaSerialNo: `CTC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'Active',
    paymentStatus: 'Paid',
    expiryDate: new Date(Date.now() + 180 * DAY),
    ...overrides
});

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongo.getUri());
    [operator, otherOperator, staff, cashier] = await User.create([
        {
            name: 'Juan Audit Operator',
            address: 'Poblacion, Gasan',
            contact: '09171110001',
            email: 'audit.op1@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'operator',
            todaAssociation: 'BATODA'
        },
        {
            name: 'Pedro Audit Operator',
            address: 'Pinggan, Gasan',
            contact: '09171110002',
            email: 'audit.op2@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'operator',
            todaAssociation: 'PINGGAN TODA'
        },
        {
            name: 'OVM Licensing Staff',
            address: 'Gasan',
            contact: '09171110003',
            email: 'audit.staff@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'bplo_staff'
        },
        {
            name: 'Treasury Cashier',
            address: 'Gasan',
            contact: '09171110004',
            email: 'audit.cashier@gtrams.test',
            password: 'FixturePassword!99',
            isVerified: true,
            role: 'cashier'
        }
    ]);
}, 90000);

beforeEach(async () => {
    await Promise.all([
        Franchise.deleteMany({}),
        Violation.deleteMany({}),
        Notification.deleteMany({}),
        SystemSettings.deleteMany({})
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo?.stop();
    server.close();
});

describe('Post-UAT Codex Audit Remediation Suite (H1-H3, M1-M7, L1, L4)', () => {
    it('H1: overlapping cancellation finalize and reject returns one 200 and one 409 without Active+Archived corruption', async () => {
        const franchise = await makeFranchise({
            status: 'Cancellation Requested',
            cancellationDetails: {
                reason: 'Voluntary Cessation / Personal Reasons',
                letterText: 'Hon. Vice Mayor, please cancel my motorized tricycle franchise voluntarily.',
                priorStatus: 'Active',
                decision: 'pending',
                requestedAt: new Date()
            }
        });

        const [finRes, rejRes] = await Promise.all([
            request(app)
                .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
                .set('Authorization', auth(staff))
                .send({ action: 'finalize', staffNotes: 'Approved.' }),
            request(app)
                .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
                .set('Authorization', auth(staff))
                .send({ action: 'reject', rejectionReason: 'Missing proof.' })
        ]);

        const statuses = [finRes.status, rejRes.status].sort();
        expect(statuses).toEqual([200, 409]);

        const saved = await Franchise.findById(franchise._id);
        expect(!(saved.status === 'Active' && saved.isArchived)).toBe(true);
        const notifs = await Notification.find({ recipient: operator._id, relatedFranchise: franchise._id });
        expect(notifs).toHaveLength(1);
    });

    it('H2: pending surrender blocks official DOCX download, permits stamped staff DRAFT, and allows grant after finalization', async () => {
        const pending = await makeFranchise({
            plateNo: 'H2-PLT01',
            status: 'Cancellation Requested',
            cancellationDetails: {
                reason: 'Unit Sale / Transfer of Ownership',
                letterText: 'Hon. Vice Mayor, requesting voluntary cancellation for unit sale.',
                decision: 'pending',
                requestedAt: new Date()
            }
        });

        // Official download without draft=true is blocked for both operator and staff
        await request(app)
            .get(`/api/v1/franchises/${pending._id}/download-original?type=cancellation`)
            .set('Authorization', auth(operator))
            .expect(400);
        await request(app)
            .get(`/api/v1/franchises/${pending._id}/download-original?type=cancellation`)
            .set('Authorization', auth(staff))
            .expect(400);

        // Preview endpoint blocks operators (403) and returns DRAFT-stamped DOCX for staff
        await request(app)
            .post('/api/v1/franchises/download-original-preview?type=cancellation')
            .set('Authorization', auth(operator))
            .send({ plateNumber: 'H2-PLT01' })
            .expect(403);

        const draftRes = await request(app)
            .get(`/api/v1/franchises/${pending._id}/download-original?type=cancellation&draft=true`)
            .set('Authorization', auth(staff))
            .buffer(true)
            .parse(parseBinaryResponse)
            .expect(200);
        const stripXml = (x) => String(x || '').replace(/<[^>]+>/g, '');
        const draftXml = extractDocxEntryXml(draftRes.body);
        const draftText = stripXml(draftXml);
        expect(draftText).toContain('DRAFT');
        expect(draftText).not.toMatch(/your request is hereby granted/i);
        expect(draftText).not.toMatch(/LIDANY\s+A\./i);
        expect(draftText).not.toMatch(/\bBALDO\b/i);

        // Finalize surrender -> official download returns grant
        await request(app)
            .put(`/api/v1/franchises/${pending._id}/process-cancellation`)
            .set('Authorization', auth(staff))
            .send({ action: 'finalize' })
            .expect(200);

        const officialRes = await request(app)
            .get(`/api/v1/franchises/${pending._id}/download-original?type=cancellation`)
            .set('Authorization', auth(operator))
            .buffer(true)
            .parse(parseBinaryResponse)
            .expect(200);
        const officialXml = extractDocxEntryXml(officialRes.body);
        const officialText = stripXml(officialXml);
        expect(officialText).toMatch(/your request is hereby granted/i);
        expect(officialText).toContain('LIDANY A. BALDO');
        expect(officialText).not.toContain('FUNCTION $MODEL');
    });

    it('H3: preserves Active - Under Warning across denied surrender and replacement franchise progression', async () => {
        const warned = await makeFranchise({
            plateNo: 'H3-WARN1',
            motorNo: 'H3-MTR1',
            chassisNo: 'H3-CHS1',
            status: 'Active'
        });

        // 1st Offense citation puts franchise in Active - Under Warning
        const v1 = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', auth(staff))
            .send({
                franchiseId: warned._id.toString(),
                violationType: 'Overcharging of fare',
                severity: 'Medium'
            })
            .expect(201);
        expect(v1.body.violation.offenseNumber).toBe(1);
        expect((await Franchise.findById(warned._id)).status).toBe('Active - Under Warning');

        // Submit & reject voluntary surrender -> must restore Active - Under Warning (not plain Active)
        await request(app)
            .put(`/api/v1/franchises/${warned._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .field('reason', 'Voluntary Cessation / Personal Reasons')
            .field('letterText', 'Hon. Vice Mayor, requesting voluntary cancellation for review test.')
            .expect(200);
        const rejRes = await request(app)
            .put(`/api/v1/franchises/${warned._id}/process-cancellation`)
            .set('Authorization', auth(staff))
            .send({ action: 'reject', rejectionReason: 'Incomplete attachment.' })
            .expect(200);
        expect(rejRes.body.franchise.status).toBe('Active - Under Warning');

        // Finalize voluntary surrender on warned unit -> replacement franchise inherits warning & next violation is 2nd Offense Suspension
        await request(app)
            .put(`/api/v1/franchises/${warned._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .field('reason', 'Relocation / TODA Transfer')
            .field('letterText', 'Hon. Vice Mayor, transferring unit to another TODA association.')
            .expect(200);
        await request(app)
            .put(`/api/v1/franchises/${warned._id}/process-cancellation`)
            .set('Authorization', auth(staff))
            .send({ action: 'finalize' })
            .expect(200);

        const replRes = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', auth(operator))
            .send({
                fullName: operator.name,
                address: 'Poblacion, Gasan',
                zone: 'Central',
                made: '2025',
                make: 'Honda TMX 125',
                motorNo: 'H3-MTR1',
                chassisNo: 'H3-CHS1',
                plateNo: 'H3-WARN1',
                todaName: 'BATODA',
                driverDlCodes: 'A, A1',
                cedulaDate: '2026-01-10',
                cedulaAddress: 'Gasan',
                cedulaSerialNo: 'CTC-H3-REPL'
            })
            .expect(201);
        expect(replRes.body.activeViolationCount).toBe(1);

        // Advance replacement to Active release -> becomes Active - Under Warning automatically
        await Franchise.findByIdAndUpdate(replRes.body._id, {
            $set: { status: 'Ready for Pickup', paymentStatus: 'Paid', officialReceiptNo: 'OR-H3-001', mtopNo: 'MTOP-H3-001' }
        });
        const releaseRes = await request(app)
            .put(`/api/v1/franchises/${replRes.body._id}/status`)
            .set('Authorization', auth(staff))
            .send({ status: 'Active' })
            .expect(200);
        expect(releaseRes.body.status).toBe('Active - Under Warning');

        // Next citation on replacement unit escalates to 2nd Offense (Suspension)
        const v2 = await request(app)
            .post('/api/v1/violations')
            .set('Authorization', auth(staff))
            .send({
                franchiseId: replRes.body._id,
                violationCode: 'OUT_OF_LINE',
                violationType: 'Out of line operation'
            })
            .expect(201);
        expect(v2.body.violation.offenseNumber).toBe(2);
        expect(v2.body.violation.sanction.resultingStatus).toBe('Suspended');
    });

    it('M1: blocks Suspended->Expired, preserves original expiryDate on manual expiry, and blocks renewal when suspension exists', async () => {
        const suspended = await makeFranchise({ status: 'Suspended', suspensionEndDate: new Date(Date.now() + 10 * DAY) });
        await request(app)
            .put(`/api/v1/franchises/${suspended._id}/status`)
            .set('Authorization', auth(staff))
            .send({ status: 'Expired' })
            .expect(400);

        const futureExpiry = new Date(Date.now() + 200 * DAY);
        const active = await makeFranchise({ status: 'Active', expiryDate: futureExpiry });
        const expRes = await request(app)
            .put(`/api/v1/franchises/${active._id}/status`)
            .set('Authorization', auth(staff))
            .send({ status: 'Expired' })
            .expect(200);
        expect(new Date(expRes.body.expiryDate).getTime()).toBe(futureExpiry.getTime());
        expect(expRes.body.manualExpiredAt).toBeTruthy();

        // Active suspension violation still blocks renewal even if franchise expired
        const expWithSusp = await makeFranchise({ status: 'Expired', expiryDate: new Date(Date.now() - 2 * DAY) });
        await Violation.create({
            operator: operator._id,
            franchise: expWithSusp._id,
            plateNo: expWithSusp.plateNo,
            violationType: 'Illegal Route Operation',
            offenseNumber: 2,
            sanction: { type: 'Suspension', resultingStatus: 'Suspended', fineAmount: 500, suspensionDays: 15 },
            status: 'Active'
        });
        await request(app)
            .put(`/api/v1/franchises/${expWithSusp._id}/renew`)
            .set('Authorization', auth(operator))
            .send({ cedulaSerialNo: 'CTC-M1-BLK' })
            .expect(400);
    });

    it('M2: enforces atomic fleet limit across concurrent creates/resubmits and keeps unpaid surrender terminal', async () => {
        await makeFranchise({ status: 'Active', plateNo: 'M2-SLOT1' });

        // 1 slot left: simultaneous creates yield at most 1 success
        const buildPayload = (tag) => ({
            fullName: operator.name,
            address: 'Poblacion, Gasan',
            zone: 'Central',
            made: '2025',
            make: 'Honda TMX 125',
            motorNo: `M2-MTR-${tag}`,
            chassisNo: `M2-CHS-${tag}`,
            plateNo: `M2-PLT-${tag}`,
            todaName: 'BATODA',
            driverDlCodes: 'A, A1',
            cedulaDate: '2026-01-10',
            cedulaAddress: 'Gasan',
            cedulaSerialNo: `CTC-M2-${tag}`
        });
        const [c1, c2] = await Promise.all([
            request(app).post('/api/v1/franchises').set('Authorization', auth(operator)).send(buildPayload('A')),
            request(app).post('/api/v1/franchises').set('Authorization', auth(operator)).send(buildPayload('B'))
        ]);
        const createCodes = [c1.status, c2.status].sort();
        expect(createCodes[0]).toBe(201);
        expect([400, 409]).toContain(createCodes[1]);

        // Unpaid legacy finalized surrender stays blocked from edit/resubmit
        const unpaidSurrender = await makeFranchise({
            status: 'Cancelled',
            paymentStatus: 'Unpaid',
            isArchived: true,
            cancellationOutcome: 'voluntary_surrender',
            cancellationDetails: { reason: 'Voluntary Cessation', decision: 'finalized' }
        });
        await request(app)
            .put(`/api/v1/franchises/${unpaidSurrender._id}`)
            .set('Authorization', auth(operator))
            .send({ series: 'TMX' })
            .expect(400);
    });

    it('M3: refiling a rejected renewal never duplicates the prior issued term snapshot in paymentHistory', async () => {
        const expApproval = new Date(Date.now() - 400 * DAY);
        const expDate = new Date(Date.now() - 35 * DAY);
        const franchise = await makeFranchise({
            status: 'Expired',
            paymentStatus: 'Paid',
            mtopNo: 'MTOP-M3-001',
            officialReceiptNo: 'OR-M3-001',
            approvalDate: expApproval,
            expiryDate: expDate
        });

        await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', auth(operator))
            .send({ cedulaSerialNo: 'CTC-M3-1', cedulaAddress: 'Gasan', cedulaDate: '2026-01-15' })
            .expect(200);

        let afterFirstRenew = await Franchise.findById(franchise._id);
        expect(afterFirstRenew.paymentHistory).toHaveLength(1);

        // Staff rejects unpaid renewal -> operator refiles
        await request(app)
            .put(`/api/v1/franchises/${franchise._id}/status`)
            .set('Authorization', auth(staff))
            .send({ status: 'Cancelled', cancelReason: 'Re-upload clearer cedula' })
            .expect(200);

        await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', auth(operator))
            .send({ cedulaSerialNo: 'CTC-M3-2', cedulaAddress: 'Gasan', cedulaDate: '2026-01-20' })
            .expect(200);

        const afterRefile = await Franchise.findById(franchise._id);
        expect(afterRefile.paymentHistory).toHaveLength(1);
        expect(afterRefile.paymentHistory[0].officialReceiptNo).toBe('OR-M3-001');
    });

    it('M4 & M5: archive aggregation paginates narrow terms by term TODA, and my-franchises classifies cancellation outcomes', async () => {
        await makeFranchise({
            status: 'Active',
            todaName: 'PINGGAN TODA',
            isArchived: false,
            paymentHistory: [
                {
                    termId: 'T1',
                    officialReceiptNo: 'OR-HIST-1',
                    amountPaid: 500,
                    previousStatus: 'Expired',
                    applicationType: 'New',
                    todaName: 'BATODA',
                    address: 'Bahi, Gasan',
                    dateApplied: new Date('2024-01-10')
                },
                {
                    termId: 'T2',
                    officialReceiptNo: 'OR-HIST-2',
                    amountPaid: 500,
                    previousStatus: 'Expired',
                    applicationType: 'Renewal',
                    todaName: 'PINGGAN TODA',
                    address: 'Pinggan, Gasan',
                    dateApplied: new Date('2025-01-10')
                }
            ]
        });

        const pageRes = await request(app)
            .get('/api/v1/franchises?archived=true&page=1&limit=1&todaName=BATODA')
            .set('Authorization', auth(staff))
            .expect(200);
        expect(pageRes.body.pagination.totalRecords).toBe(1);
        expect(pageRes.body.data).toHaveLength(1);
        expect(pageRes.body.data[0].isHistoricalTerm).toBe(true);
        expect(pageRes.body.data[0].todaName).toBe('BATODA');
        expect(pageRes.body.data[0].paymentHistory).toBeUndefined();

        // M5 outcome flags
        await Franchise.deleteMany({});
        await makeFranchise({ status: 'Cancelled', paymentStatus: 'Unpaid', cancellationOutcome: 'staff_rejected', isArchived: false });
        await makeFranchise({ status: 'Cancelled', paymentStatus: 'Unpaid', cancellationOutcome: 'operator_withdrawn', isArchived: true, archivedAt: new Date() });
        await makeFranchise({ status: 'Cancelled', paymentStatus: 'Paid', cancellationOutcome: 'voluntary_surrender', isArchived: true, archivedAt: new Date(), cancellationDetails: { reason: 'Sale', decision: 'finalized' } });
        await makeFranchise({
            status: 'Cancelled',
            paymentStatus: 'Unpaid',
            applicationType: 'Renewal',
            isRenewalPending: false,
            previousStatus: 'Active',
            previousExpiryDate: new Date(Date.now() + 90 * DAY)
        });

        const myRes = await request(app)
            .get('/api/v1/franchises/my-franchises')
            .set('Authorization', auth(operator))
            .expect(200);
        const byOutcome = Object.fromEntries(myRes.body.map(r => [r.applicationType === 'Renewal' ? 'renewalCancelled' : r.cancellationOutcome, r]));
        expect(byOutcome.staff_rejected.canFixIssues).toBe(true);
        expect(byOutcome.staff_rejected.occupiesFleetSlot).toBe(false);
        expect(byOutcome.operator_withdrawn.canFixIssues).toBe(false);
        expect(byOutcome.voluntary_surrender.canFixIssues).toBe(false);
        expect(byOutcome.renewalCancelled.canRefileRenewal).toBe(true);
        expect(byOutcome.renewalCancelled.occupiesFleetSlot).toBe(true);
    });

    it('M6, M7, L1 & L4: strict server validation rejects malformed cancellations, DL codes, receipts, and conflicting restores', async () => {
        const active = await makeFranchise({ status: 'Active' });

        // M6: whitespace URL, short letterText, empty Other customReason, non-string remarks -> 400
        await request(app)
            .put(`/api/v1/franchises/${active._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .send({ reason: 'Voluntary Cessation / Personal Reasons', letterUrl: '   ' })
            .expect(400);
        await request(app)
            .put(`/api/v1/franchises/${active._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .send({ reason: 'Other', customReason: '   ', letterText: 'Long enough typed letter exceeding thirty characters.' })
            .expect(400);
        await request(app)
            .put(`/api/v1/franchises/${active._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .send({ reason: 'Voluntary Cessation / Personal Reasons', letterText: 'Too short' })
            .expect(400);
        await request(app)
            .put(`/api/v1/franchises/${active._id}/request-cancellation`)
            .set('Authorization', auth(operator))
            .send({ reason: 'Voluntary Cessation / Personal Reasons', remarks: { bad: true }, letterText: 'Long enough typed letter exceeding thirty characters.' })
            .expect(400);

        // M7: reject unsupported DL code on create
        await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', auth(operator))
            .send({
                fullName: operator.name,
                address: 'Poblacion, Gasan',
                zone: 'Central',
                made: '2025',
                make: 'Honda',
                motorNo: 'M7-MTR-1',
                chassisNo: 'M7-CHS-1',
                plateNo: 'M7-PLT-1',
                todaName: 'BATODA',
                driverDlCodes: 'B, B1',
                cedulaDate: '2026-01-10',
                cedulaAddress: 'Gasan',
                cedulaSerialNo: 'CTC-M7'
            })
            .expect(400);

        // L1: cashier receipt charset & amountPaid boolean rejection -> 400
        const forPayment = await makeFranchise({ status: 'For Payment', paymentStatus: 'Unpaid' });
        await request(app)
            .post(`/api/v1/franchises/${forPayment._id}/pay`)
            .set('Authorization', auth(cashier))
            .send({ officialReceiptNo: 'INVALID OR!', amountPaid: 500 })
            .expect(400);
        await request(app)
            .post(`/api/v1/franchises/${forPayment._id}/pay`)
            .set('Authorization', auth(cashier))
            .send({ officialReceiptNo: 'OR-VALID-1', amountPaid: true })
            .expect(400);

        // L4: restoring finalized surrender returns 400; restoring withdrawn record with reused plate returns 409
        const surrendered = await makeFranchise({
            status: 'Cancelled',
            isArchived: true,
            cancellationOutcome: 'voluntary_surrender',
            cancellationDetails: { reason: 'Voluntary Cessation', decision: 'finalized' }
        });
        await request(app)
            .put(`/api/v1/franchises/${surrendered._id}/archive`)
            .set('Authorization', auth(staff))
            .send({ isArchived: false })
            .expect(400);

        const reusedPlate = 'L4-REUSE';
        await Franchise.init();
        await makeFranchise({ status: 'Active', plateNo: reusedPlate, motorNo: 'L4-M1', chassisNo: 'L4-C1', isArchived: false });
        const archivedOld = await makeFranchise({
            status: 'Expired',
            plateNo: reusedPlate,
            motorNo: 'L4-M2',
            chassisNo: 'L4-C2',
            isArchived: true
        });
        await request(app)
            .put(`/api/v1/franchises/${archivedOld._id}/archive`)
            .set('Authorization', auth(staff))
            .send({ isArchived: false })
            .expect(409);
    });
});
