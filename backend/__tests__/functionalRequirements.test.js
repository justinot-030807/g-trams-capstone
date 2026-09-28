/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  G-TRAMS FUNCTIONAL REQUIREMENTS — COMPREHENSIVE AUTOMATED TEST SUITE
 *  Covers ALL 8 Modules from the Official Functional Requirements Spec
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  Module 1: User Authentication and Registration
 *  Module 2: Manage System Settings
 *  Module 3: Manage Account Profile
 *  Module 4: Submit TODA Records
 *  Module 5: Apply and Renew Franchise Applications
 *  Module 6: Generate and Download Franchise Claim Stub
 *  Module 7: Generate System Reports
 *  Module 8: Manage Franchise Cancellation and Revocation
 *
 *  Environment: MongoDB Memory Server (in-memory, no production data affected)
 *  Framework: Jest + Supertest
 * ═══════════════════════════════════════════════════════════════════════════════
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { app, server } = require('../server');
const User = require('../src/models/userModel');
const Franchise = require('../src/models/franchiseModel');
const SystemSettings = require('../src/models/systemSettingsModel');
const TodaSubmission = require('../src/models/todaSubmission');
const Ticket = require('../src/models/ticketModel');

let mongoServer;
let adminUser, adminToken;
let operatorUser, operatorToken;
let presidentUser, presidentToken;

// ─── SETUP & TEARDOWN ──────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Seed admin user
    adminUser = new User({
        name: 'Admin Gasan',
        address: 'Gasan, Marinduque',
        contact: 'admin@gtrams.test',
        email: 'admin@gtrams.test',
        password: 'AdminPass123!',
        role: 'admin',
        isVerified: true,
        isActive: true
    });
    await adminUser.save();
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Seed operator user
    operatorUser = new User({
        name: 'Juan Dela Cruz',
        address: 'Antipolo, Gasan',
        contact: '09171234567',
        email: 'juan@test.com',
        password: 'Operator123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
    });
    await operatorUser.save();
    operatorToken = jwt.sign({ id: operatorUser._id, role: operatorUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Seed TODA president user
    presidentUser = new User({
        name: 'Pres. Carlos Santos',
        address: 'Bognuyan, Gasan',
        contact: 'president@test.com',
        email: 'president@test.com',
        password: 'President123!',
        role: 'toda president',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
    });
    await presidentUser.save();
    presidentToken = jwt.sign({ id: presidentUser._id, role: presidentUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

afterEach(async () => {
    // Clean up franchises, settings, tickets, toda submissions after each test
    await Franchise.deleteMany();
    await SystemSettings.deleteMany();
    await TodaSubmission.deleteMany();
    if (Ticket) await Ticket.deleteMany().catch(() => {});
});

// ─── HELPER: Create a franchise directly in the DB ──────────────────────────
const createTestFranchise = async (overrides = {}) => {
    const defaults = {
        operator: operatorUser._id,
        fullName: 'Juan Dela Cruz',
        address: 'Antipolo, Gasan',
        zone: 'Zone 1',
        made: 'Honda',
        make: 'Tricycle',
        motorNo: 'MOT-' + Date.now(),
        chassisNo: 'CHS-' + Date.now(),
        plateNo: 'PLT-' + Date.now(),
        todaName: 'BATODA',
        cedulaDate: new Date(),
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: '123456',
        status: 'Pending',
        applicationType: 'New',
        isArchived: false
    };
    return await Franchise.create({ ...defaults, ...overrides });
};


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 1: USER AUTHENTICATION AND REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 1: User Authentication and Registration', () => {

    it('M1-01: Should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: 'admin@gtrams.test', password: 'AdminPass123!' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.role).toBe('admin');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.password).toBeUndefined();
    });

    it('M1-02: Should reject login with invalid password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: 'admin@gtrams.test', password: 'WrongPassword!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid credentials');
    });

    it('M1-03: Should reject login for unverified accounts', async () => {
        const unverified = new User({
            name: 'Unverified User',
            address: 'Gasan',
            contact: 'unverified-login@test.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: false
        });
        await unverified.save();

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: 'unverified-login@test.com', password: 'Password123!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('verify');

        await User.deleteOne({ _id: unverified._id });
    });

    it('M1-04: Should register a new operator account and receive OTP', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Maria Test',
                address: 'Dawis, Gasan',
                contact: 'maria.reg@test.com',
                password: 'Password123!',
                todaAssociation: 'NON-TODA'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('OTP sent successfully');

        const user = await User.findOne({ contact: 'maria.reg@test.com' });
        expect(user).toBeDefined();
        expect(user.role).toBe('operator');
        expect(user.isVerified).toBe(false);
        expect(user.otp).toBeDefined();

        await User.deleteOne({ _id: user._id });
    });

    it('M1-05: Should reject login for deactivated accounts with 403', async () => {
        const deactivated = new User({
            name: 'Deactivated User',
            address: 'Gasan',
            contact: 'deactivated-login@test.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true,
            isActive: false,
            deactivationReason: 'Violation of terms'
        });
        await deactivated.save();

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: 'deactivated-login@test.com', password: 'Password123!' });

        expect(res.status).toBe(403);
        expect(res.body.accountDeactivated).toBe(true);
        expect(res.body.reason).toBe('Violation of terms');

        await User.deleteOne({ _id: deactivated._id });
    });

    it('M1-06: Should login operator with correct role-based token', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: '09171234567', password: 'Operator123!' });

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('operator');
        expect(res.body.token).toBeDefined();

        const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
        expect(decoded.role).toBe('operator');
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 2: MANAGE SYSTEM SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 2: Manage System Settings', () => {

    it('M2-01: Should return default settings when no config exists', async () => {
        const res = await request(app).get('/api/v1/settings');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.franchiseFee).toBe(500);
        expect(res.body.data.maxUnitsPerOperator).toBe(2);
        expect(res.body.data.maintenanceMode).toBe(false);
    });

    it('M2-02: Admin should update fiscal year and franchise fee', async () => {
        // First get so settings record exists
        await request(app).get('/api/v1/settings');

        const res = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ fiscalYear: '2027', franchiseFee: 750 });

        expect(res.status).toBe(200);
        expect(res.body.data.fiscalYear).toBe('2027');
        expect(res.body.data.franchiseFee).toBe(750);
    });

    it('M2-03: Admin should update maxUnitsPerOperator', async () => {
        await request(app).get('/api/v1/settings');

        const res = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ maxUnitsPerOperator: 3 });

        expect(res.status).toBe(200);
        expect(res.body.data.maxUnitsPerOperator).toBe(3);
    });

    it('M2-04: Operator should NOT be able to update system settings', async () => {
        await request(app).get('/api/v1/settings');

        const res = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ franchiseFee: 9999 });

        expect(res.status).toBe(403);
    });

    it('M2-05: Admin should activate/deactivate user accounts', async () => {
        const target = new User({
            name: 'Toggle Target',
            address: 'Gasan',
            contact: 'toggle-target@test.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true,
            isActive: true
        });
        await target.save();

        // Deactivate
        const deactivateRes = await request(app)
            .put(`/api/v1/auth/${target._id}/toggle-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'Test deactivation' });

        expect(deactivateRes.status).toBe(200);
        expect(deactivateRes.body.user.isActive).toBe(false);

        // Reactivate
        const reactivateRes = await request(app)
            .put(`/api/v1/auth/${target._id}/toggle-status`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(reactivateRes.status).toBe(200);
        expect(reactivateRes.body.user.isActive).toBe(true);

        await User.deleteOne({ _id: target._id });
    });

    it('M2-06: Admin should NOT be able to deactivate another admin', async () => {
        const otherAdmin = new User({
            name: 'Other Admin',
            address: 'Gasan',
            contact: 'otheradmin@test.com',
            password: 'AdminPass123!',
            role: 'admin',
            isVerified: true
        });
        await otherAdmin.save();

        const res = await request(app)
            .put(`/api/v1/auth/${otherAdmin._id}/toggle-status`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('administrator');

        await User.deleteOne({ _id: otherAdmin._id });
    });

    it('M2-07: Admin should enable and disable maintenance mode', async () => {
        await request(app).get('/api/v1/settings');

        // Enable maintenance
        const enableRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ maintenanceMode: true, maintenanceMessage: 'System upgrade in progress' });

        expect(enableRes.status).toBe(200);
        expect(enableRes.body.data.maintenanceMode).toBe(true);

        // Disable maintenance
        const disableRes = await request(app)
            .put('/api/v1/settings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ maintenanceMode: false });

        expect(disableRes.status).toBe(200);
        expect(disableRes.body.data.maintenanceMode).toBe(false);
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 3: MANAGE ACCOUNT PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 3: Manage Account Profile', () => {

    it('M3-01: Operator should view their own profile', async () => {
        const res = await request(app)
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Juan Dela Cruz');
        expect(res.body.address).toBe('Antipolo, Gasan');
        expect(res.body.password).toBeUndefined();
    });

    it('M3-02: Operator should update their personal contact details', async () => {
        const res = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ name: 'Juan D. Cruz', address: 'Bahi, Gasan' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Juan D. Cruz');
        expect(res.body.address).toBe('Bahi, Gasan');

        // Restore original
        await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ name: 'Juan Dela Cruz', address: 'Antipolo, Gasan' });
    });

    it('M3-03: Operator should change password successfully', async () => {
        const res = await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ oldPassword: 'Operator123!', newPassword: 'NewOperator456!' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('changed successfully');

        // Verify new password works
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ contact: '09171234567', password: 'NewOperator456!' });
        expect(loginRes.status).toBe(200);

        // Restore original password
        await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ oldPassword: 'NewOperator456!', newPassword: 'Operator123!' });
    });

    it('M3-04: Should reject password change with wrong old password', async () => {
        const res = await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ oldPassword: 'WrongOldPass!', newPassword: 'NewPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Incorrect old password');
    });

    it('M3-05: Should reject if new password is same as old password', async () => {
        const res = await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ oldPassword: 'Operator123!', newPassword: 'Operator123!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('different');
    });

    it('M3-06: Should reject password shorter than 6 characters', async () => {
        const res = await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ oldPassword: 'Operator123!', newPassword: '123' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('at least 6');
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 4: SUBMIT TODA RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 4: Submit TODA Records', () => {

    it('M4-01: Admin should view all TODA submissions', async () => {
        // Seed a submission directly
        await TodaSubmission.create({
            submittedBy: presidentUser._id,
            presidentName: presidentUser.name,
            fileName: 'BATODA_Members_2026.xlsx',
            filePath: 'https://res.cloudinary.com/test/batoda_members.xlsx',
            status: 'Pending'
        });

        const res = await request(app)
            .get('/api/v1/toda/submissions')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0].presidentName).toBe('Pres. Carlos Santos');
    });

    it('M4-02: Admin should approve a TODA submission', async () => {
        const submission = await TodaSubmission.create({
            submittedBy: presidentUser._id,
            presidentName: presidentUser.name,
            fileName: 'BATODA_Roster.pdf',
            filePath: 'https://res.cloudinary.com/test/batoda_roster.pdf',
            status: 'Pending'
        });

        const res = await request(app)
            .put(`/api/v1/toda/approve/${submission._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.submission.status).toBe('Approved');
    });

    it('M4-03: Operator should NOT access admin-only submissions endpoint', async () => {
        const res = await request(app)
            .get('/api/v1/toda/submissions')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(403);
    });

    it('M4-04: TODA President should view their own submissions', async () => {
        await TodaSubmission.create({
            submittedBy: presidentUser._id,
            presidentName: presidentUser.name,
            fileName: 'My_Submission.pdf',
            filePath: 'https://res.cloudinary.com/test/my_submission.pdf',
            status: 'Pending'
        });

        const res = await request(app)
            .get('/api/v1/toda/my-submissions')
            .set('Authorization', `Bearer ${presidentToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('M4-05: Should return 404 when approving non-existent submission', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/v1/toda/approve/${fakeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
    });

    it('M4-06: TODA President should view TODA members directory with fleet stats', async () => {
        // Create a franchise under BATODA
        await createTestFranchise({ todaName: 'BATODA', status: 'Active', plateNo: 'TODA-001' });

        const res = await request(app)
            .get('/api/v1/toda/my-members')
            .set('Authorization', `Bearer ${presidentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.todaName).toBe('BATODA');
        expect(res.body.stats).toBeDefined();
        expect(res.body.stats.totalMembers).toBeGreaterThanOrEqual(1);
        expect(res.body.members).toBeDefined();
        expect(Array.isArray(res.body.members)).toBe(true);
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 5: APPLY AND RENEW FRANCHISE APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 5: Apply and Renew Franchise Applications', () => {

    it('M5-01: Operator should submit a new franchise application', async () => {
        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                fullName: 'Juan Dela Cruz',
                address: 'Antipolo, Gasan',
                zone: 'Zone 1',
                made: 'Honda',
                make: 'TMX 155',
                motorNo: 'MOT-NEW-001',
                chassisNo: 'CHS-NEW-001',
                plateNo: 'ABC-1234',
                todaName: 'BATODA',
                cedulaDate: new Date().toISOString(),
                cedulaAddress: 'Gasan, Marinduque',
                cedulaSerialNo: '789012'
            });

        expect(res.status).toBe(201);
        expect(res.body.plateNo).toBe('ABC-1234');
        expect(res.body.status).toBe('Pending');
        expect(res.body.applicationType).toBe('New');
    });

    it('M5-02: Should reject duplicate plate number registration', async () => {
        await createTestFranchise({ plateNo: 'DUP-PLATE-001', motorNo: 'MOT-UNIQUE-A', chassisNo: 'CHS-UNIQUE-A' });

        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                fullName: 'Another Operator',
                address: 'Gasan',
                zone: 'Zone 2',
                made: 'Kawasaki',
                make: 'Barako',
                motorNo: 'MOT-UNIQUE-B',
                chassisNo: 'CHS-UNIQUE-B',
                plateNo: 'DUP-PLATE-001',
                todaName: 'BATODA',
                cedulaDate: new Date().toISOString(),
                cedulaAddress: 'Gasan',
                cedulaSerialNo: '111111'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already registered');
    });

    it('M5-03: Admin should approve franchise (Pending → For Signing)', async () => {
        const franchise = await createTestFranchise({ status: 'Pending' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'For Signing' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('For Signing');
        expect(res.body.approvalDate).toBeDefined();
    });

    it('M5-04: Admin should advance status (For Signing → Ready for Pickup)', async () => {
        const franchise = await createTestFranchise({ status: 'For Signing', approvalDate: new Date() });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Ready for Pickup' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Ready for Pickup');
    });

    it('M5-05: Admin should activate franchise (Ready for Pickup → Active)', async () => {
        const franchise = await createTestFranchise({ status: 'Ready for Pickup', approvalDate: new Date() });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Active' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Active');
    });

    it('M5-06: Operator should view their own franchise applications', async () => {
        await createTestFranchise({ status: 'Active', plateNo: 'MY-UNIT-001' });
        await createTestFranchise({ status: 'Pending', plateNo: 'MY-UNIT-002' });

        const res = await request(app)
            .get('/api/v1/franchises/my-franchises')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    it('M5-07: Operator should renew an expired franchise', async () => {
        const franchise = await createTestFranchise({ status: 'Expired', plateNo: 'RENEW-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                cedulaDate: new Date().toISOString(),
                cedulaAddress: 'Gasan, Marinduque',
                cedulaSerialNo: '999888'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Pending');
        expect(res.body.applicationType).toBe('Renewal');
    });

    it('M5-08: Operator should NOT renew someone else\'s franchise (IDOR protection)', async () => {
        const otherOperator = new User({
            name: 'Other Operator',
            address: 'Gasan',
            contact: 'other-op-renew@test.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true
        });
        await otherOperator.save();

        const franchise = await createTestFranchise({ operator: otherOperator._id, status: 'Expired', plateNo: 'IDOR-RENEW-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cedulaSerialNo: '000000' });

        expect(res.status).toBe(403);

        await User.deleteOne({ _id: otherOperator._id });
    });

    it('M5-09: Should check franchise field uniqueness (plateNo)', async () => {
        await createTestFranchise({ plateNo: 'UNIQUE-CHECK-001' });

        const res = await request(app)
            .get('/api/v1/franchises/check-unique?field=plateNo&value=UNIQUE-CHECK-001')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.isUnique).toBe(false);
        expect(res.body.exists).toBe(true);
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 6: GENERATE AND DOWNLOAD FRANCHISE CLAIM STUB
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 6: Generate and Download Franchise Claim Stub', () => {

    it('M6-01: Should retrieve franchise details for claim stub when status is Ready for Pickup', async () => {
        const franchise = await createTestFranchise({
            status: 'Ready for Pickup',
            plateNo: 'STUB-001',
            approvalDate: new Date()
        });

        const res = await request(app)
            .get(`/api/v1/franchises/${franchise._id}`)
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Ready for Pickup');
        expect(res.body.plateNo).toBe('STUB-001');
        expect(res.body.fullName).toBe('Juan Dela Cruz');
        expect(res.body.todaName).toBe('BATODA');
    });

    it('M6-02: Should retrieve franchise details for Active franchise', async () => {
        const franchise = await createTestFranchise({
            status: 'Active',
            plateNo: 'ACTIVE-STUB-001',
            approvalDate: new Date()
        });

        const res = await request(app)
            .get(`/api/v1/franchises/${franchise._id}`)
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Active');
    });

    it('M6-03: Should return 404 for non-existent franchise', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/v1/franchises/${fakeId}`)
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(404);
    });

    it('M6-04: Claim stub notification is sent when status transitions to Ready for Pickup', async () => {
        const franchise = await createTestFranchise({
            status: 'For Signing',
            plateNo: 'NOTIF-STUB-001',
            approvalDate: new Date()
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'Ready for Pickup' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Ready for Pickup');
        // Notification is generated internally (socket + push) — verify status was set correctly
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 7: GENERATE SYSTEM REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 7: Generate System Reports', () => {

    it('M7-01: Admin should generate franchise reports with summary analytics', async () => {
        await createTestFranchise({ status: 'Active', plateNo: 'RPT-001', todaName: 'BATODA' });
        await createTestFranchise({ status: 'Pending', plateNo: 'RPT-002', todaName: 'BATODA' });
        await createTestFranchise({ status: 'Revoked', plateNo: 'RPT-003', todaName: 'GATODA' });

        const res = await request(app)
            .get('/api/v1/franchises/reports')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.summary).toBeDefined();
        expect(res.body.summary.total).toBe(3);
        expect(res.body.summary.active).toBe(1);
        expect(res.body.summary.pending).toBe(1);
        expect(res.body.summary.revoked).toBe(1);
        expect(res.body.summary.todaMap).toBeDefined();
        expect(res.body.summary.todaMap['BATODA']).toBe(2);
        expect(res.body.summary.todaMap['GATODA']).toBe(1);
    });

    it('M7-02: Admin should filter reports by status', async () => {
        await createTestFranchise({ status: 'Active', plateNo: 'FILTER-001' });
        await createTestFranchise({ status: 'Pending', plateNo: 'FILTER-002' });

        const res = await request(app)
            .get('/api/v1/franchises/reports?status=Active')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.total).toBe(1);
        expect(res.body.summary.active).toBe(1);
        expect(res.body.data.every(f => f.status === 'Active')).toBe(true);
    });

    it('M7-03: Admin should filter reports by TODA name', async () => {
        await createTestFranchise({ status: 'Active', plateNo: 'TODA-FILTER-001', todaName: 'BATODA' });
        await createTestFranchise({ status: 'Active', plateNo: 'TODA-FILTER-002', todaName: 'GATODA' });

        const res = await request(app)
            .get('/api/v1/franchises/reports?todaName=BATODA')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.every(f => f.todaName === 'BATODA')).toBe(true);
    });

    it('M7-04: Admin should view paginated franchise masterlist', async () => {
        for (let i = 0; i < 5; i++) {
            await createTestFranchise({ status: 'Active', plateNo: `PAGE-${i}` });
        }

        const res = await request(app)
            .get('/api/v1/franchises?page=1&limit=3')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(3);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.totalRecords).toBe(5);
        expect(res.body.pagination.totalPages).toBe(2);
        expect(res.body.pagination.hasNextPage).toBe(true);
    });

    it('M7-05: Operator should NOT access admin reports endpoint', async () => {
        const res = await request(app)
            .get('/api/v1/franchises/reports')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(403);
    });

    it('M7-06: Admin should view user list with fleet unit counts', async () => {
        await createTestFranchise({ status: 'Active', plateNo: 'FLEET-001' });
        await createTestFranchise({ status: 'Pending', plateNo: 'FLEET-002' });

        const res = await request(app)
            .get('/api/v1/auth')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const operator = res.body.find(u => u.contact === '09171234567');
        expect(operator).toBeDefined();
        expect(operator.unitsCount).toBeGreaterThanOrEqual(2);
        expect(operator.activeUnitsCount).toBeGreaterThanOrEqual(1);
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
//  MODULE 8: MANAGE FRANCHISE CANCELLATION AND REVOCATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Module 8: Manage Franchise Cancellation and Revocation', () => {

    it('M8-01: Operator should cancel a Pending franchise application', async () => {
        const franchise = await createTestFranchise({ status: 'Pending', plateNo: 'CANCEL-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/cancel`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Changed my mind' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Cancelled');
        expect(res.body.isArchived).toBe(true);
        expect(res.body.cancelReason).toBe('Changed my mind');
    });

    it('M8-02: Operator should cancel a For Signing application', async () => {
        const franchise = await createTestFranchise({ status: 'For Signing', plateNo: 'CANCEL-FS-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/cancel`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Found duplicate entry' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Cancelled');
    });

    it('M8-03: Operator should NOT cancel an Active franchise', async () => {
        const franchise = await createTestFranchise({ status: 'Active', plateNo: 'CANCEL-ACTIVE-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/cancel`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Trying to cancel active' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('pending or unreleased');
    });

    it('M8-04: Admin should revoke an active franchise with violation reason', async () => {
        const franchise = await createTestFranchise({ status: 'Active', plateNo: 'REVOKE-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/revoke`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ cancelReason: 'Violation: Expired registration' });

        expect(res.status).toBe(200);
        expect(res.body.franchise.status).toBe('Revoked');
        expect(res.body.franchise.cancelReason).toBe('Violation: Expired registration');
    });

    it('M8-05: Admin should revoke with default reason when none provided', async () => {
        const franchise = await createTestFranchise({ status: 'Active', plateNo: 'REVOKE-DEFAULT-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/revoke`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.franchise.cancelReason).toBe('Revoked by Admin due to violation');
    });

    it('M8-06: Operator should NOT revoke a franchise (admin only)', async () => {
        const franchise = await createTestFranchise({ status: 'Active', plateNo: 'REVOKE-UNAUTH-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/revoke`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Trying unauthorized revoke' });

        expect(res.status).toBe(403);
    });

    it('M8-07: Operator should NOT cancel another operator\'s franchise', async () => {
        const otherOp = new User({
            name: 'Other Op Cancel',
            address: 'Gasan',
            contact: 'other-cancel@test.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true
        });
        await otherOp.save();

        const franchise = await createTestFranchise({
            operator: otherOp._id,
            status: 'Pending',
            plateNo: 'IDOR-CANCEL-001'
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/cancel`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Not mine to cancel' });

        expect(res.status).toBe(401);

        await User.deleteOne({ _id: otherOp._id });
    });

    it('M8-08: Admin should archive a franchise', async () => {
        const franchise = await createTestFranchise({ status: 'Expired', plateNo: 'ARCHIVE-001' });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/archive`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isArchived: true });

        expect(res.status).toBe(200);
        expect(res.body.franchise.isArchived).toBe(true);
    });

    it('M8-09: Admin should restore an archived franchise', async () => {
        const franchise = await createTestFranchise({
            status: 'Expired',
            plateNo: 'RESTORE-001',
            isArchived: true,
            archivedAt: new Date()
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/archive`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isArchived: false });

        expect(res.status).toBe(200);
        expect(res.body.franchise.isArchived).toBe(false);
    });
});
