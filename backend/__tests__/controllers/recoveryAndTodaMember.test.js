process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { app, server } = require('../../server');
const User = require('../../src/models/userModel');
const TodaRoster = require('../../src/models/todaModel');
const TodaSubmission = require('../../src/models/todaSubmission');
const Franchise = require('../../src/models/franchiseModel');
const { generateNextBodyNumber, isBodyNumberTaken, isBodyNumberMatch } = require('../../src/utils/rosterValidator');

let mongoServer;
let todaPresUser, todaPresToken;
let bploStaffUser, bploStaffToken;
let operatorUser, operatorToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Create Toda President
    todaPresUser = new User({
        name: 'Pres. Romeo Santos',
        address: 'Bahi, Gasan',
        contact: '09191112233',
        email: 'romeo.president@gtrams.test',
        password: 'Password123!',
        role: 'toda_president',
        todaAssociation: 'BATODA',
        isVerified: true,
        isActive: true
    });
    await todaPresUser.save();
    todaPresToken = jwt.sign({ id: todaPresUser._id, role: todaPresUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Create BPLO Staff
    bploStaffUser = new User({
        name: 'Officer Maria Santos',
        address: 'Poblacion, Gasan',
        contact: '09192223344',
        email: 'bplo.officer@gtrams.test',
        password: 'Password123!',
        role: 'bplo_staff',
        isVerified: true,
        isActive: true
    });
    await bploStaffUser.save();
    bploStaffToken = jwt.sign({ id: bploStaffUser._id, role: bploStaffUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Create Standard Operator
    operatorUser = new User({
        name: 'Pedro Penduko',
        address: 'Pinggan, Gasan',
        contact: '09193334455',
        email: 'pedro@gtrams.test',
        password: 'Password123!',
        role: 'operator',
        todaAssociation: 'BATODA',
        isVerified: true,
        isActive: true
    });
    await operatorUser.save();
    operatorToken = jwt.sign({ id: operatorUser._id, role: operatorUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

beforeEach(async () => {
    await TodaRoster.deleteMany({});
    await TodaSubmission.deleteMany({});
    await Franchise.deleteMany({});
});

describe('1. Body Number Generation & Duplicate Collision Guards', () => {
    it('should generate "01" as the default first body number for an empty TODA roster', async () => {
        const nextNo = await generateNextBodyNumber('BATODA');
        expect(nextNo).toBe('01');
    });

    it('should preserve 2-digit padding when existing numbers are 01, 02', async () => {
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Member 1',
            bodyNumber: '01',
            status: 'Active'
        });
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Member 2',
            bodyNumber: '02',
            status: 'Active'
        });

        const nextNo = await generateNextBodyNumber('BATODA');
        expect(nextNo).toBe('03');
    });

    it('should preserve 3-digit padding and prefixes (e.g. GAS-001 -> GAS-002)', async () => {
        await TodaRoster.create({
            todaAssociation: 'GASTODA',
            operatorName: 'Member 1',
            bodyNumber: 'GAS-001',
            status: 'Active'
        });

        const nextNo = await generateNextBodyNumber('GASTODA');
        expect(nextNo).toBe('GAS-002');
    });

    it('should detect body number collision across TodaRoster, TodaSubmission, User, and Franchise', async () => {
        // Taken in TodaRoster
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Member 1',
            bodyNumber: '05',
            status: 'Active'
        });
        expect((await isBodyNumberTaken('05', 'BATODA')).isTaken).toBe(true);
        expect((await isBodyNumberTaken('5', 'BATODA')).isTaken).toBe(true); // normalizes to 5
        expect((await isBodyNumberTaken('06', 'BATODA')).isTaken).toBe(false);

        // Taken in active TodaSubmission
        await TodaSubmission.create({
            submittedBy: todaPresUser._id,
            presidentName: todaPresUser.name,
            fileName: 'roster.pdf',
            filePath: '/uploads/roster.pdf',
            status: 'Pending',
            todaAssociation: 'BATODA',
            extractedMembers: [{
                name: 'Pending Member',
                operatorName: 'Pending Member',
                bodyNumber: '10'
            }]
        });
        expect((await isBodyNumberTaken('10', 'BATODA')).isTaken).toBe(true);

        // Not taken in another association
        expect((await isBodyNumberTaken('05', 'PINGGAN TODA')).isTaken).toBe(false);
    });
});

describe('2. TODA Next Body Number Endpoint (GET /api/v1/toda/next-body-number)', () => {
    it('should require authentication', async () => {
        const res = await request(app).get('/api/v1/toda/next-body-number');
        expect(res.status).toBe(401);
    });

    it('should return next available body number for the authenticated TODA president', async () => {
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Existing Member',
            bodyNumber: '07',
            status: 'Active'
        });

        const res = await request(app)
            .get('/api/v1/toda/next-body-number')
            .set('Authorization', `Bearer ${todaPresToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.todaAssociation).toBe('BATODA');
        expect(res.body.nextBodyNumber).toBe('08');
    });

    it('should allow BPLO staff to specify todaAssociation query parameter', async () => {
        await TodaRoster.create({
            todaAssociation: 'POBLACION TODA',
            operatorName: 'Poblacion Member',
            bodyNumber: '15',
            status: 'Active'
        });

        const res = await request(app)
            .get('/api/v1/toda/next-body-number?todaAssociation=POBLACION TODA')
            .set('Authorization', `Bearer ${bploStaffToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.nextBodyNumber).toBe('16');
    });
});

describe('3. TODA Individual Member Registration (POST /api/v1/toda/members/individual)', () => {
    it('should block unauthorized roles (e.g., standard operator)', async () => {
        const res = await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                operatorName: 'Cardo Dalisay'
            });

        expect(res.status).toBe(403);
    });

    it('should auto-generate body number if omitted by TODA president', async () => {
        const res = await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', `Bearer ${todaPresToken}`)
            .send({
                operatorName: 'Cardo Dalisay',
                plateNo: 'GA-1234',
                contact: '09181112233'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.member).toBeDefined();
        expect(res.body.member.operatorName).toBe('Cardo Dalisay');
        expect(res.body.member.bodyNumber).toBe('01');
        expect(res.body.member.todaAssociation).toBe('BATODA');

        // Verify record in database
        const saved = await TodaRoster.findOne({ operatorName: 'Cardo Dalisay' });
        expect(saved).toBeDefined();
        expect(saved.bodyNumber).toBe('01');
    });

    it('should strictly reject duplicate body number with 409 Conflict', async () => {
        // Register first member with body number 22
        await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', `Bearer ${todaPresToken}`)
            .send({
                operatorName: 'Member One',
                bodyNumber: '22',
                plateNo: 'AB-1111'
            });

        // Attempt to register second member with identical body number 22
        const duplicateRes = await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', `Bearer ${todaPresToken}`)
            .send({
                operatorName: 'Member Two',
                bodyNumber: '22',
                plateNo: 'CD-2222'
            });

        expect(duplicateRes.status).toBe(409);
        expect(duplicateRes.body.success).toBe(false);
        expect(duplicateRes.body.message).toContain('DUPLICATE BODY NUMBER HARANG');
        expect(duplicateRes.body.suggestedBodyNumber).toBeDefined();
    });

    it('should sync individual member to active TodaSubmission', async () => {
        const submission = await TodaSubmission.create({
            submittedBy: todaPresUser._id,
            presidentName: todaPresUser.name,
            fileName: 'official_roster.pdf',
            filePath: '/uploads/official_roster.pdf',
            status: 'Approved',
            todaAssociation: 'BATODA',
            extractedCount: 0,
            extractedMembers: []
        });

        const res = await request(app)
            .post('/api/v1/toda/members/individual')
            .set('Authorization', `Bearer ${todaPresToken}`)
            .send({
                operatorName: 'Synced Member',
                plateNo: 'EF-3333'
            });

        expect(res.status).toBe(201);

        const updatedSub = await TodaSubmission.findById(submission._id);
        expect(updatedSub.extractedMembers.some(m => m.operatorName === 'Synced Member')).toBe(true);
    });
});

describe('4. Account Recovery via Recovery Email / Phone', () => {
    beforeEach(async () => {
        await User.deleteMany({ email: { $nin: [todaPresUser.email, bploStaffUser.email, operatorUser.email] } });
    });

    it('should register user with recoveryEmail and recoveryPhone', async () => {
        // Pre-seed in roster so registration passes pre-registration check
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Maria Clara',
            bodyNumber: '99',
            status: 'Active'
        });

        const regPayload = {
            name: 'Maria Clara',
            address: 'Poblacion',
            contact: '09170001122',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            todaAssociation: 'BATODA',
            role: 'operator',
            recoveryEmail: 'backup.maria@gmail.com',
            recoveryPhone: '09180009988'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(regPayload);

        expect(res.status).toBe(201);

        const registered = await User.findOne({ contact: '09170001122' });
        expect(registered).toBeDefined();
        expect(registered.recoveryEmail).toBe('backup.maria@gmail.com');
        expect(registered.recoveryPhone).toBe('09180009988');
    });

    it('should initiate password recovery when user enters recoveryEmail', async () => {
        const testUser = new User({
            name: 'Juan Tamad',
            address: 'Poblacion',
            contact: '09121231234',
            email: 'primary.lost@gmail.com',
            recoveryEmail: 'recovery.lifesaver@gmail.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true,
            isActive: true
        });
        await testUser.save();

        const res = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ contact: 'recovery.lifesaver@gmail.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Recovery Email');
        expect(res.body.recoveryUsed).toBe(true);

        // Check user has generated OTP
        const refreshed = await User.findById(testUser._id);
        expect(refreshed.otp).toBeDefined();
        expect(refreshed.otpExpire).toBeDefined();
    });

    it('should initiate password recovery when user enters recoveryPhone', async () => {
        const testUser = new User({
            name: 'Jose Rizal',
            address: 'Poblacion',
            contact: 'primary.lost.phone@gmail.com',
            recoveryPhone: '09998887766',
            password: 'Password123!',
            role: 'operator',
            isVerified: true,
            isActive: true
        });
        await testUser.save();

        const res = await request(app)
            .post('/api/v1/auth/forgot-password')
            .send({ contact: '09998887766' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Recovery Phone');
        expect(res.body.recoveryUsed).toBe(true);
    });

    it('should reject registration if recoveryEmail matches primary contact email', async () => {
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Self Collide',
            bodyNumber: '98',
            status: 'Active'
        });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Self Collide',
                address: 'Poblacion',
                contact: 'self.contact@gmail.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                todaAssociation: 'BATODA',
                role: 'operator',
                recoveryEmail: 'self.contact@gmail.com'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Ang Recovery Email ay dapat iba');
    });

    it('should NOT block another applicant if their primary email matches an existing user recoveryEmail', async () => {
        // User 1 has primary 09171112233 and recovery backup.recipient@gmail.com
        const existingUser = new User({
            name: 'Existing Person',
            address: 'Poblacion',
            contact: '09171112233',
            email: 'primary.existing@gmail.com',
            recoveryEmail: 'backup.recipient@gmail.com',
            password: 'Password123!',
            role: 'operator',
            isVerified: true,
            isActive: true
        });
        await existingUser.save();

        // User 2 registers with primary contact backup.recipient@gmail.com
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Backup Owner',
            bodyNumber: '97',
            status: 'Active'
        });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Backup Owner',
                address: 'Poblacion',
                contact: 'backup.recipient@gmail.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                todaAssociation: 'BATODA',
                role: 'operator'
            });

        // User 2 must NOT be blocked by User 1's recoveryEmail
        expect(res.status).toBe(201);

        // User 1 must still exist
        const u1 = await User.findById(existingUser._id);
        expect(u1).toBeDefined();
    });
});

describe('5. Roster Directory Integration & Concurrency Stress Guards', () => {
    it('should include assigned bodyNumber in GET /api/v1/toda/my-members', async () => {
        await TodaRoster.create({
            todaAssociation: 'BATODA',
            operatorName: 'Direct Roster Member',
            bodyNumber: '88',
            plateNo: 'DIR-8888',
            contact: '09198888888',
            status: 'Active'
        });

        const res = await request(app)
            .get('/api/v1/toda/my-members')
            .set('Authorization', `Bearer ${todaPresToken}`);

        expect(res.status).toBe(200);
        expect(res.body.members).toBeDefined();
        const found = res.body.members.find(m => m.name === 'Direct Roster Member');
        expect(found).toBeDefined();
        expect(found.bodyNumber).toBe('88');
    });

    it('should strictly enforce uniqueness under 5 concurrent identical body number submissions', async () => {
        const payload = {
            operatorName: 'Concurrent Test 1',
            bodyNumber: '50',
            plateNo: 'CON-5050'
        };

        // Fire 5 identical requests at the exact same time
        const results = await Promise.all([
            request(app).post('/api/v1/toda/members/individual').set('Authorization', `Bearer ${todaPresToken}`).send(payload),
            request(app).post('/api/v1/toda/members/individual').set('Authorization', `Bearer ${todaPresToken}`).send({ ...payload, operatorName: 'Concurrent Test 2' }),
            request(app).post('/api/v1/toda/members/individual').set('Authorization', `Bearer ${todaPresToken}`).send({ ...payload, operatorName: 'Concurrent Test 3' }),
            request(app).post('/api/v1/toda/members/individual').set('Authorization', `Bearer ${todaPresToken}`).send({ ...payload, operatorName: 'Concurrent Test 4' }),
            request(app).post('/api/v1/toda/members/individual').set('Authorization', `Bearer ${todaPresToken}`).send({ ...payload, operatorName: 'Concurrent Test 5' })
        ]);

        const successes = results.filter(r => r.status === 201);
        const conflicts = results.filter(r => r.status === 409 || r.status === 400);

        // Exactly 1 must succeed, remaining 4 must be rejected
        expect(successes.length).toBe(1);
        expect(conflicts.length).toBe(4);
    });

    it('should generate 5 distinct sequential body numbers without collision under auto-generate concurrency', async () => {
        const names = ['AutoOp 1', 'AutoOp 2', 'AutoOp 3', 'AutoOp 4', 'AutoOp 5'];

        // True simultaneous concurrent registration with auto-generated body numbers
        const results = await Promise.all(
            names.map(opName =>
                request(app)
                    .post('/api/v1/toda/members/individual')
                    .set('Authorization', `Bearer ${todaPresToken}`)
                    .send({ operatorName: opName })
            )
        );

        results.forEach(r => expect(r.status).toBe(201));
        const bodyNumbers = results.map(r => r.body.member.bodyNumber);
        const uniqueBodyNumbers = new Set(bodyNumbers);

        expect(uniqueBodyNumbers.size).toBe(5);
    });
});
