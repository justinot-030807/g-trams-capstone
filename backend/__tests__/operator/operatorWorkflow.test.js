process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const { app, server } = require('../../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Ticket = require('../../src/models/ticketModel');
const Notification = require('../../src/models/notificationModel');

let mongoServer;
let operatorUser, operatorToken;
let operator2User, operator2Token;
let adminUser, adminToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Operator 1
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
    operatorToken = jwt.sign({ id: operatorUser._id, role: operatorUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Operator 2 (for data isolation testing)
    operator2User = await User.create({
        name: 'Pedro Calungsod',
        contact: '09194445566',
        email: 'pedro.operator@example.com',
        address: 'Mahunig, Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'PINGGAN TODA'
    });
    operator2Token = jwt.sign({ id: operator2User._id, role: operator2User.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

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
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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
    await Ticket.deleteMany({});
    await Notification.deleteMany({});
});

describe('Operator Workflow & Field Operations Test Suite', () => {

    // 1. Data Isolation & Garage View
    it('OP-01: Operator should only see their own franchises in my-franchises', async () => {
        // Create franchise for Operator 1
        await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako II',
            motorNo: 'MTR-OP1-001',
            chassisNo: 'CHS-OP1-001',
            plateNo: 'PLT-OP1-001',
            todaName: 'BATODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-001',
            status: 'Active'
        });

        // Create franchise for Operator 2
        await Franchise.create({
            operator: operator2User._id,
            fullName: operator2User.name,
            address: operator2User.address,
            zone: 'Zone 2',
            made: 'Honda',
            make: 'TMX Supremo',
            motorNo: 'MTR-OP2-002',
            chassisNo: 'CHS-OP2-002',
            plateNo: 'PLT-OP2-002',
            todaName: 'PINGGAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-002',
            status: 'Active'
        });

        const res = await request(app)
            .get('/api/v1/franchises/my-franchises')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        const list = Array.isArray(res.body) ? res.body : res.body.data;
        expect(list.length).toBe(1);
        expect(list[0].plateNo).toBe('PLT-OP1-001');
        expect(list[0].motorNo).toBe('MTR-OP1-001');
    });

    // 2. New Franchise Application
    it('OP-02: Operator should successfully submit a new franchise application', async () => {
        const payload = {
            operator: operatorUser._id.toString(),
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 3',
            made: 'Yamaha',
            make: 'Sight 115',
            motorNo: 'MTR-NEW-9988',
            chassisNo: 'CHS-NEW-9988',
            plateNo: '9988-GS',
            todaName: 'BATODA',
            cedulaDate: '2026-01-15',
            cedulaAddress: 'Gasan, Marinduque',
            cedulaSerialNo: '11223344',
            applicationType: 'New'
        };

        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.plateNo).toBe('9988-GS');
        expect(res.body.status).toBe('Pending');
    });

    // 3. Duplicate Plate Collision (Anti-Colorum)
    it('OP-03: System must block duplicate plate number submission with 409 Conflict', async () => {
        const existingPlate = 'DUP-7777';

        // Pre-existing franchise
        await Franchise.create({
            operator: operator2User._id,
            fullName: operator2User.name,
            address: operator2User.address,
            zone: 'Zone 1',
            made: 'Suzuki',
            make: 'GD110',
            motorNo: 'MTR-EXISTING-1',
            chassisNo: 'CHS-EXISTING-1',
            plateNo: existingPlate,
            todaName: 'BATODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-777',
            status: 'Active'
        });

        // Operator 1 attempts to use the same plate number
        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                operator: operatorUser._id.toString(),
                fullName: operatorUser.name,
                address: operatorUser.address,
                zone: 'Zone 1',
                made: 'Honda',
                make: 'TMX 150',
                motorNo: 'MTR-DIFFERENT-2',
                chassisNo: 'CHS-DIFFERENT-2',
                plateNo: existingPlate,
                todaName: 'BATODA',
                cedulaDate: '2026-01-10',
                cedulaAddress: 'Gasan',
                cedulaSerialNo: 'CED-888',
                applicationType: 'New'
            });

        expect([400, 409]).toContain(res.status);
        expect(res.body.message).toMatch(/already registered/i);
    });

    // 4. Franchise Renewal Workflow
    it('OP-04: Operator should be able to submit renewal for an expired or active franchise', async () => {
        const franchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako',
            motorNo: 'MTR-RENEW-1',
            chassisNo: 'CHS-RENEW-1',
            plateNo: 'RNW-1122',
            todaName: 'BATODA',
            cedulaDate: new Date('2025-01-01'),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-OLD',
            status: 'Active'
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/renew`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .field('cedulaSerialNo', 'CED-NEW-2026')
            .field('cedulaAddress', 'Gasan, Marinduque')
            .field('cedulaDate', '2026-02-01');

        expect(res.status).toBe(200);
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Pending');
        expect(updated.applicationType).toBe('Renewal');
    });

    // 5. Operator Franchise Cancellation
    it('OP-05: Operator can request cancellation of their franchise', async () => {
        const franchise = await Franchise.create({
            operator: operatorUser._id,
            fullName: operatorUser.name,
            address: operatorUser.address,
            zone: 'Zone 1',
            made: 'Honda',
            make: 'TMX',
            motorNo: 'MTR-CAN-1',
            chassisNo: 'CHS-CAN-1',
            plateNo: 'CAN-3344',
            todaName: 'BATODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CED-CAN',
            status: 'Pending'
        });

        const res = await request(app)
            .put(`/api/v1/franchises/${franchise._id}/cancel`)
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({ cancelReason: 'Sold the tricycle unit to another operator' });

        expect(res.status).toBe(200);
        const updated = await Franchise.findById(franchise._id);
        expect(updated.status).toBe('Cancelled');
        expect(updated.cancelReason).toContain('Sold');
    });

    // 6. Support Tickets / Helpdesk
    it('OP-06: Operator can submit support ticket and retrieve their tickets', async () => {
        // Create ticket
        const createRes = await request(app)
            .post('/api/v1/tickets')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                subject: 'Clarification on TODA endorsement fee',
                contactNumber: operatorUser.contact,
                category: 'Inquiry',
                message: 'Magkano po ba ang official endorsement fee para sa BATODA?'
            });

        expect(createRes.status).toBe(201);
        expect(createRes.body.ticket).toBeDefined();

        // Get my tickets
        const getRes = await request(app)
            .get('/api/v1/tickets/my-tickets')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(getRes.status).toBe(200);
        const tickets = Array.isArray(getRes.body) ? getRes.body : getRes.body.data;
        expect(tickets.length).toBeGreaterThanOrEqual(1);
        expect(tickets[0].subject).toContain('TODA endorsement fee');
    });

    // 7. Profile Updates & Password Change
    it('OP-07: Operator can update profile info and change password', async () => {
        // Update profile
        const updateRes = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                name: 'Mang Juan Dela Cruz Jr.',
                address: 'Barangay Antipolo, Gasan, Marinduque'
            });

        expect(updateRes.status).toBe(200);
        const updatedUser = await User.findById(operatorUser._id);
        expect(updatedUser.name).toBe('Mang Juan Dela Cruz Jr.');

        // Change password
        const passRes = await request(app)
            .put('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                oldPassword: 'Password123!',
                newPassword: 'NewSecurePassword456!'
            });

        expect(passRes.status).toBe(200);

        // Verify login with new password
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                contact: operatorUser.contact,
                password: 'NewSecurePassword456!'
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
    });

    // 8. Notifications & Read Status
    it('OP-08: Operator can fetch unread notification count and mark all as read', async () => {
        // Seed 3 unread notifications
        await Notification.insertMany([
            { recipient: operatorUser._id, type: 'status_change', title: 'Permit Approved', message: 'Ready for pickup', isRead: false },
            { recipient: operatorUser._id, type: 'chat', title: 'New Message', message: 'LGU Officer sent a reply', isRead: false },
            { recipient: operatorUser._id, type: 'system', title: 'Advisory', message: 'Annual inspection next week', isRead: false }
        ]);

        // Unread count
        const countRes = await request(app)
            .get('/api/v1/notifications/unread-count')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(countRes.status).toBe(200);
        expect(countRes.body.count).toBe(3);

        // Mark all as read
        const markRes = await request(app)
            .put('/api/v1/notifications/mark-all-read')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(markRes.status).toBe(200);

        const checkRes = await request(app)
            .get('/api/v1/notifications/unread-count')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(checkRes.body.count).toBe(0);
    });

    // 9. Push Subscription Status Check
    it('OP-09: Operator can check Push Notification status without errors', async () => {
        const res = await request(app)
            .get('/api/v1/push/status')
            .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.isSubscribed).toBeDefined();
    });

});
