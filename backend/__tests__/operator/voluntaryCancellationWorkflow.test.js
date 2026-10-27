process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const { app, server } = require('../../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Notification = require('../../src/models/notificationModel');
const AuditLog = require('../../src/models/auditLogModel');

let mongoServer;
let operatorUser, operatorToken;
let operator2User, operator2Token;
let staffUser, staffToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Operator 1
    operatorUser = await User.create({
        name: 'Juan Tamad Operator',
        contact: '09191112233',
        email: 'juan.voluntary@example.com',
        address: 'Bahi, Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
    });
    operatorToken = jwt.sign({ id: operatorUser._id, role: operatorUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Operator 2
    operator2User = await User.create({
        name: 'Pedro Calungsod',
        contact: '09194445566',
        email: 'pedro.voluntary@example.com',
        address: 'Mahunig, Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'PINGGAN TODA'
    });
    operator2Token = jwt.sign({ id: operator2User._id, role: operator2User.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // BPLO Staff (strictly bplo_staff role to adhere to Separation of Duties)
    staffUser = await User.create({
        name: 'BPLO Staff Gasan',
        contact: '09190000000',
        email: 'bplo.staff@example.com',
        address: 'Poblacion, Gasan',
        password: 'StaffPassword123!',
        role: 'bplo_staff',
        isVerified: true,
        isActive: true
    });
    staffToken = jwt.sign({ id: staffUser._id, role: staffUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}, 60000);

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
    if (server) {
        server.close();
    }
});

afterEach(async () => {
    await Franchise.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
});

describe('Module 8: Voluntary Franchise Cancellation Workflow Test Suite', () => {
    // Helper to create an active franchise
    const createActiveFranchise = async (operator = operatorUser, plateNo = 'VOL-1234') => {
        return await Franchise.create({
            operator: operator._id,
            fullName: operator.name,
            address: operator.address,
            zone: 'Zone 1',
            made: 'Honda',
            make: 'TMX 125',
            motorNo: 'MTR-' + Math.random().toString(36).substring(7).toUpperCase(),
            chassisNo: 'CHS-' + Math.random().toString(36).substring(7).toUpperCase(),
            plateNo,
            todaName: 'BATODA',
            cedulaDate: new Date('2026-01-01'),
            cedulaAddress: 'Gasan, Marinduque',
            cedulaSerialNo: 'CED-999',
            status: 'Active',
            paymentStatus: 'Paid',
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months in future
        });
    };

    it('VC-01: Operator should successfully submit a voluntary cancellation request on an Active franchise with letter file and reasons', async () => {
        const franchise = await createActiveFranchise();

        const fakeLetterPdf = Buffer.from('%PDF-1.4 Fake PDF Content for cancellation letter');

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/request-cancellation`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .field('reason', 'Unit Sale / Transfer of Ownership')
            .field('remarks', 'Unit was sold to another resident of Gasan.')
            .attach('letter', fakeLetterPdf, 'surrender_request.pdf');

        expect(res.status).toBe(200);
        expect(res.body.franchise.status).toBe('Cancellation Requested');
        expect(res.body.franchise.cancellationDetails.reason).toBe('Unit Sale / Transfer of Ownership');
        expect(res.body.franchise.cancellationDetails.remarks).toBe('Unit was sold to another resident of Gasan.');
        expect(res.body.franchise.cancellationDetails.letterUrl).toBeDefined();

        // Check database
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Cancellation Requested');
        expect(updated.cancellationDetails.requestedAt).toBeDefined();

        // Verify audit log entry was created
        const audit = await AuditLog.findOne({ action: 'FRANCHISE_CANCELLATION_REQUESTED' });
        expect(audit).toBeDefined();
        expect(audit.actorId.toString()).toBe(operatorUser._id.toString());
    });

    it('VC-02: Operator cannot request cancellation on a non-Active franchise (e.g., Pending, Expired)', async () => {
        const pendingFranchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Yamaha',
            make: 'Sight',
            motorNo: 'MTR-PEND-1',
            chassisNo: 'CHS-PEND-1',
            plateNo: 'PND-9988',
            todaName: 'BATODA',
            cedulaDate: new Date('2026-01-01'),
            cedulaAddress: 'Gasan, Marinduque',
            cedulaSerialNo: 'CED-PEND-1',
            status: 'Pending',
            paymentStatus: 'Unpaid'
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${pendingFranchise._id}/request-cancellation`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .field('reason', 'Voluntary Cessation / Personal Reasons')
            .field('remarks', 'Want to cancel early.');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Only Active franchises can be voluntarily cancelled/i);
    });

    it('VC-03: Another operator cannot request cancellation of a franchise they do not own', async () => {
        const franchise = await createActiveFranchise(operatorUser, 'OP1-1111');

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/request-cancellation`)
            .set('Authorization', `Bearer ${operator2Token}`)
            .field('reason', 'Relocation / TODA Transfer')
            .field('remarks', 'Attempting unauthorized cancellation');

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/You are not authorized to request cancellation/i);
    });

    it('VC-04: Non-staff/operator users cannot process or finalize franchise cancellations', async () => {
        const franchise = await createActiveFranchise();
        franchise.status = 'Cancellation Requested';
        franchise.cancellationDetails = {
            reason: 'Relocation / TODA Transfer',
            remarks: 'Moving to Boac',
            requestedAt: new Date()
        };
        await franchise.save();

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ action: 'finalize' });

        expect(res.status).toBe(403);
    });

    it('VC-05: Staff can reject voluntary cancellation request with notes, reverting franchise status to Active', async () => {
        const franchise = await createActiveFranchise();
        franchise.status = 'Cancellation Requested';
        franchise.cancellationDetails = {
            reason: 'Vehicle Damage / Total Loss',
            remarks: 'Tricycle was flooded.',
            requestedAt: new Date()
        };
        await franchise.save();

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                action: 'reject',
                rejectionReason: 'Formal letter is unreadable. Please re-upload with clear signature.',
                staffNotes: 'Letter is blurry'
            });

        expect(res.status).toBe(200);
        expect(res.body.franchise.status).toBe('Active');
        expect(res.body.franchise.cancellationDetails.rejectionReason).toBe('Formal letter is unreadable. Please re-upload with clear signature.');

        // Verify status reverted in database
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Active');

        // Verify operator received notification of rejection
        const notif = await Notification.findOne({ recipient: operatorUser._id });
        expect(notif).toBeDefined();
        expect(notif.message).toMatch(/rejected/i);
    });

    it('VC-06: Staff can finalize voluntary cancellation directly to Cancelled without Cashier payment route', async () => {
        const franchise = await createActiveFranchise();
        franchise.status = 'Cancellation Requested';
        franchise.paymentStatus = 'Paid';
        franchise.cancellationDetails = {
            reason: 'Voluntary Cessation / Personal Reasons',
            remarks: 'Retiring from driving tricycle.',
            requestedAt: new Date()
        };
        await franchise.save();

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                action: 'finalize',
                staffNotes: 'Verified surrender letter and MTOP plate returned to BPLO.'
            });

        expect(res.status).toBe(200);
        expect(res.body.franchise.status).toBe('Cancelled');
        expect(res.body.franchise.cancelReason).toContain('Voluntary Cancellation: Voluntary Cessation / Personal Reasons');
        // Critical: zero cashier route check - paymentStatus remains Paid, never routed to Cashier for collection
        expect(res.body.franchise.paymentStatus).toBe('Paid');

        // Verify DB state
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Cancelled');
        expect(updated.cancellationDetails.staffNotes).toBe('Verified surrender letter and MTOP plate returned to BPLO.');

        // Verify operator notification
        const notif = await Notification.findOne({ recipient: operatorUser._id });
        expect(notif).toBeDefined();
        expect(notif.message).toMatch(/finalized by BPLO Staff/i);

        // Verify audit log
        const audit = await AuditLog.findOne({ action: 'FRANCHISE_VOLUNTARILY_CANCELLED_BY_STAFF' });
        expect(audit).toBeDefined();
        expect(audit.actorId.toString()).toBe(staffUser._id.toString());
    });

    it('VC-07: Staff cannot finalize a cancellation request if the franchise is not in Cancellation Requested status', async () => {
        const franchise = await createActiveFranchise(); // Status is Active, not Cancellation Requested

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/process-cancellation`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({
                action: 'finalize',
                staffNotes: 'Premature approval'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Only franchises with 'Cancellation Requested' can be processed/i);
    });
});
