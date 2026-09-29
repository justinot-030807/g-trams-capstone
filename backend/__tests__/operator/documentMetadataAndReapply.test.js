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

let mongoServer;
let operatorUser, operatorToken;
let adminUser, adminToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Operator
    operatorUser = await User.create({
        name: 'Mang Juan Tricycle',
        contact: '09191112233',
        email: 'juan.operator@example.com',
        address: 'Bahi, Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
    });
    operatorToken = jwt.sign(
        { id: operatorUser._id, role: operatorUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    // Admin
    adminUser = await User.create({
        name: 'Admin Gasan',
        contact: '09190000000',
        email: 'admin.gasan@example.com',
        address: 'Poblacion, Gasan',
        password: 'AdminPassword123!',
        role: 'admin',
        isVerified: true,
        isActive: true
    });
    adminToken = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
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
});

describe('Document Metadata Persistence & Re-application Workflow Test Suite', () => {

    // TC-01: createFranchise should successfully persist structured document metadata
    it('TC-01: createFranchise should successfully persist structured document metadata', async () => {
        const payload = {
            operator: operatorUser._id.toString(),
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako II',
            motorNo: 'MTR-DOC-001',
            chassisNo: 'CHS-DOC-001',
            plateNo: 'PLT-DOC-001',
            todaName: 'BATODA',
            cedulaDate: '2026-01-15',
            cedulaAddress: 'Gasan, Marinduque',
            cedulaSerialNo: 'CED-112233',
            applicationType: 'New',

            // Structured document metadata fields
            orCrNo: 'ORCR-2026-001',
            orCrExpiryDate: '2027-01-15',
            isOperatorDriver: true,
            driverName: operatorUser.name,
            driverContact: operatorUser.contact,
            driverLicenseNo: 'DL-2026-0001',
            driverLicenseExpiryDate: '2028-06-30',
            todaCertNo: 'TODA-2026-999',
            todaCertDate: '2026-01-10',
            todaSignatory: 'Pres. Roberto Cruz',
            brgyClearanceNo: 'BC-2026-4321',
            brgyClearanceDate: '2026-01-05',
            brgyIssuer: 'PB Juanito Gomez'
        };

        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.plateNo).toBe('PLT-DOC-001');
        expect(res.body.status).toBe('Pending');

        // Verify API response contains structured metadata
        expect(res.body.orCrNo).toBe('ORCR-2026-001');
        expect(new Date(res.body.orCrExpiryDate).toISOString().slice(0, 10)).toBe('2027-01-15');
        expect(res.body.isOperatorDriver).toBe(true);
        expect(res.body.driverName).toBe(operatorUser.name);
        expect(res.body.driverContact).toBe(operatorUser.contact);
        expect(res.body.driverLicenseNo).toBe('DL-2026-0001');
        expect(new Date(res.body.driverLicenseExpiryDate).toISOString().slice(0, 10)).toBe('2028-06-30');
        expect(res.body.todaCertNo).toBe('TODA-2026-999');
        expect(new Date(res.body.todaCertDate).toISOString().slice(0, 10)).toBe('2026-01-10');
        expect(res.body.todaSignatory).toBe('Pres. Roberto Cruz');
        expect(res.body.brgyClearanceNo).toBe('BC-2026-4321');
        expect(new Date(res.body.brgyClearanceDate).toISOString().slice(0, 10)).toBe('2026-01-05');
        expect(res.body.brgyIssuer).toBe('PB Juanito Gomez');

        // Verify database persistence directly
        const saved = await Franchise.findById(res.body._id);
        expect(saved).not.toBeNull();
        expect(saved.orCrNo).toBe('ORCR-2026-001');
        expect(new Date(saved.orCrExpiryDate).toISOString().slice(0, 10)).toBe('2027-01-15');
        expect(saved.isOperatorDriver).toBe(true);
        expect(saved.driverName).toBe(operatorUser.name);
        expect(saved.driverContact).toBe(operatorUser.contact);
        expect(saved.driverLicenseNo).toBe('DL-2026-0001');
        expect(new Date(saved.driverLicenseExpiryDate).toISOString().slice(0, 10)).toBe('2028-06-30');
        expect(saved.todaCertNo).toBe('TODA-2026-999');
        expect(new Date(saved.todaCertDate).toISOString().slice(0, 10)).toBe('2026-01-10');
        expect(saved.todaSignatory).toBe('Pres. Roberto Cruz');
        expect(saved.brgyClearanceNo).toBe('BC-2026-4321');
        expect(new Date(saved.brgyClearanceDate).toISOString().slice(0, 10)).toBe('2026-01-05');
        expect(saved.brgyIssuer).toBe('PB Juanito Gomez');
    });

    // TC-02: Designated driver handling: when isOperatorDriver is false, driverName and driverContact are stored properly alongside driverLicenseNo
    it('TC-02: Designated driver handling: when isOperatorDriver is false, driverName and driverContact are stored properly alongside driverLicenseNo', async () => {
        const payload = {
            operator: operatorUser._id.toString(),
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 2',
            made: 'Honda',
            make: 'TMX 125',
            motorNo: 'MTR-DESIG-002',
            chassisNo: 'CHS-DESIG-002',
            plateNo: 'PLT-DESIG-002',
            todaName: 'BATODA',
            cedulaDate: '2026-01-20',
            cedulaAddress: 'Gasan, Marinduque',
            cedulaSerialNo: 'CED-556677',
            applicationType: 'New',

            // Designated driver specifications
            isOperatorDriver: false,
            driverName: 'Ricardo Dalisay',
            driverContact: '09187654321',
            driverLicenseNo: 'N02-99-887766',
            driverLicenseExpiryDate: '2029-04-12',
            orCrNo: 'ORCR-DESIG-002',
            orCrExpiryDate: '2027-04-12'
        };

        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.isOperatorDriver).toBe(false);
        expect(res.body.driverName).toBe('Ricardo Dalisay');
        expect(res.body.driverContact).toBe('09187654321');
        expect(res.body.driverLicenseNo).toBe('N02-99-887766');

        // Confirm database state
        const saved = await Franchise.findById(res.body._id);
        expect(saved.isOperatorDriver).toBe(false);
        expect(saved.driverName).toBe('Ricardo Dalisay');
        expect(saved.driverContact).toBe('09187654321');
        expect(saved.driverLicenseNo).toBe('N02-99-887766');
        expect(new Date(saved.driverLicenseExpiryDate).toISOString().slice(0, 10)).toBe('2029-04-12');
    });

    // TC-03: Re-submission bug fix: When a franchise is rejected/Cancelled by Admin (status = 'Cancelled', cancelReason = 'Chassis mismatch', rejectedField = 'chassisNo'),
    // and the operator updates/re-submits via PUT /api/v1/franchises/:id, the status MUST transition back to 'Pending', cancelReason MUST be cleared to '',
    // rejectedField MUST be cleared to '', and isArchived MUST be false.
    it('TC-03: Re-submission bug fix: Cancelled franchise transitions back to Pending with cleared cancelReason, rejectedField, and unarchived', async () => {
        // Pre-create a rejected / cancelled franchise
        const franchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Yamaha',
            make: 'Sight 115',
            motorNo: 'MTR-REAPPLY-001',
            chassisNo: 'CHS-TYPO-999',
            plateNo: 'PLT-REAPPLY-001',
            todaName: 'BATODA',
            cedulaDate: new Date('2026-01-01'),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-REAPPLY-001',
            status: 'Cancelled',
            cancelReason: 'Chassis mismatch',
            rejectedField: 'chassisNo',
            isArchived: true
        });

        // Operator updates and re-submits the corrected chassis number
        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                chassisNo: 'CHS-CORRECTED-001'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Pending');
        expect(res.body.cancelReason).toBe('');
        expect(res.body.rejectedField).toBe('');
        expect(res.body.isArchived).toBe(false);
        expect(res.body.chassisNo).toBe('CHS-CORRECTED-001');

        // Query database to ensure persistence
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Pending');
        expect(updated.cancelReason).toBe('');
        expect(updated.rejectedField).toBe('');
        expect(updated.isArchived).toBe(false);
        expect(updated.chassisNo).toBe('CHS-CORRECTED-001');
    });

    // TC-04: Notification on re-submission: When an operator re-submits a Cancelled franchise, admin users receive a notification that the application was re-submitted.
    it('TC-04: Notification on re-submission: Admin users receive notification when operator re-submits a Cancelled franchise', async () => {
        const franchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Suzuki',
            make: 'GD110',
            motorNo: 'MTR-NOTIF-001',
            chassisNo: 'CHS-NOTIF-001',
            plateNo: 'PLT-NOTIF-001',
            todaName: 'BATODA',
            cedulaDate: new Date('2026-01-05'),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-NOTIF-001',
            status: 'Cancelled',
            cancelReason: 'Invalid Engine Number',
            rejectedField: 'motorNo',
            isArchived: false
        });

        // Operator re-submits corrected application
        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                motorNo: 'MTR-NOTIF-CORRECTED-001'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Pending');

        // Verify notification delivered to admin
        const adminNotifications = await Notification.find({ recipient: adminUser._id });
        expect(adminNotifications.length).toBeGreaterThanOrEqual(1);

        const resubmitNotif = adminNotifications.find(
            n => n.title === 'Franchise Application Re-submitted'
        );
        expect(resubmitNotif).toBeDefined();
        expect(resubmitNotif.type).toBe('INFO');
        expect(resubmitNotif.message).toContain(operatorUser.name);
        expect(resubmitNotif.message).toContain(franchise.plateNo);
    });

    // TC-05: Franchise renewal via PUT /api/v1/franchises/:id/renew should persist orCrNo, orCrExpiryDate, driverLicenseNo, driverLicenseExpiryDate and reset status to 'Pending' while clearing any cancelReason.
    it('TC-05: Franchise renewal via PUT /api/v1/franchises/:id/renew should persist document metadata and reset status to Pending', async () => {
        const franchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako',
            motorNo: 'MTR-RNW-005',
            chassisNo: 'CHS-RNW-005',
            plateNo: 'PLT-RNW-005',
            todaName: 'BATODA',
            cedulaDate: new Date('2025-01-01'),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-OLD-005',
            status: 'Cancelled',
            cancelReason: 'Expired with deficiencies',
            rejectedField: 'orCrDocument',
            isArchived: true
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                cedulaSerialNo: 'CED-RNW-2026',
                cedulaAddress: 'Gasan, Marinduque',
                cedulaDate: '2026-02-01',
                orCrNo: 'ORCR-RNW-2026',
                orCrExpiryDate: '2027-02-01',
                driverLicenseNo: 'DL-RNW-2026',
                driverLicenseExpiryDate: '2028-02-01'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Pending');
        expect(res.body.cancelReason).toBe('');
        expect(res.body.rejectedField).toBe('');
        expect(res.body.isArchived).toBe(false);
        expect(res.body.applicationType).toBe('Renewal');

        // Structured metadata verification in response
        expect(res.body.orCrNo).toBe('ORCR-RNW-2026');
        expect(new Date(res.body.orCrExpiryDate).toISOString().slice(0, 10)).toBe('2027-02-01');
        expect(res.body.driverLicenseNo).toBe('DL-RNW-2026');
        expect(new Date(res.body.driverLicenseExpiryDate).toISOString().slice(0, 10)).toBe('2028-02-01');

        // Structured metadata verification in DB
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Pending');
        expect(updated.cancelReason).toBe('');
        expect(updated.rejectedField).toBe('');
        expect(updated.isArchived).toBe(false);
        expect(updated.applicationType).toBe('Renewal');
        expect(updated.orCrNo).toBe('ORCR-RNW-2026');
        expect(new Date(updated.orCrExpiryDate).toISOString().slice(0, 10)).toBe('2027-02-01');
        expect(updated.driverLicenseNo).toBe('DL-RNW-2026');
        expect(new Date(updated.driverLicenseExpiryDate).toISOString().slice(0, 10)).toBe('2028-02-01');
    });

});
