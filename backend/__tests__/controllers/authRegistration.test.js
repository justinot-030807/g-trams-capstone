process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../../server');
const User = require('../../src/models/userModel');

let mongoServer;

beforeAll(async () => {

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

afterEach(async () => {
    await User.deleteMany();
});

describe('Registration & Auth Verification Flow', () => {

    it('1. should successfully register an operator with name, address, contact, password', async () => {
        const payload = {
            name: 'Juan Dela Cruz',
            address: 'Antipolo',
            contact: '09123456789',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            todaAssociation: 'NON-TODA',
            role: 'operator'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('OTP sent successfully');

        const user = await User.findOne({ contact: '09123456789' });
        expect(user).toBeDefined();
        expect(user.name).toBe('Juan Dela Cruz');
        expect(user.address).toBe('Antipolo');
        expect(user.role).toBe('operator');
        expect(user.isVerified).toBe(false);
        expect(user.otp).toBeDefined();
        // Password must be hashed
        expect(user.password).not.toBe('Password123!');
        const isMatch = await user.matchPassword('Password123!');
        expect(isMatch).toBe(true);
    });

    it('2. should accept fullName in registration payload', async () => {
        const payload = {
            fullName: 'Maria Santos',
            address: 'Pangi',
            contact: 'maria.santos@test.com',
            password: 'Password123!',
            todaAssociation: 'BATODA'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: 'maria.santos@test.com' });
        expect(user).toBeDefined();
        expect(user.name).toBe('Maria Santos');
        expect(user.email).toBe('maria.santos@test.com');
        expect(user.todaAssociation).toBe('BATODA');
    });

    it('3. should accept short Gasan barangays like Bahi (4 chars) and Dili (4 chars)', async () => {
        const payload1 = {
            name: 'Pedro Bahi',
            address: 'Bahi',
            contact: '09111111111',
            password: 'Password123!'
        };

        const res1 = await request(app)
            .post('/api/v1/auth/register')
            .send(payload1);
        expect(res1.status).toBe(201);

        const payload2 = {
            name: 'Lucia Dili',
            address: 'Dili',
            contact: '09222222222',
            password: 'Password123!'
        };

        const res2 = await request(app)
            .post('/api/v1/auth/register')
            .send(payload2);
        expect(res2.status).toBe(201);
    });

    it('4. should fail registration if name is missing or too short', async () => {
        const payload = {
            name: 'J',
            address: 'Antipolo',
            contact: '09123456789',
            password: 'Password123!'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('5. should fail registration if password is less than 6 characters', async () => {
        const payload = {
            name: 'Juan Dela Cruz',
            address: 'Antipolo',
            contact: '09123456789',
            password: '123'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(400);
    });

    it('6. should register TODA President with valid TODA association', async () => {
        const payload = {
            name: 'President Carlos',
            address: 'Bognuyan',
            contact: 'pres.carlos@test.com',
            password: 'Password123!',
            role: 'toda president',
            todaAssociation: 'BATODA'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: 'pres.carlos@test.com' });
        expect(user).toBeDefined();
        expect(user.role).toBe('toda president');
        expect(user.todaAssociation).toBe('BATODA');
    });

    it('7. should reject TODA President registration if TODA is NON-TODA', async () => {
        const payload = {
            name: 'President Invalid',
            address: 'Bognuyan',
            contact: 'pres.invalid@test.com',
            password: 'Password123!',
            role: 'toda president',
            todaAssociation: 'NON-TODA'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('TODA');
    });

    it('8. should reject duplicate registration if user is already verified', async () => {
        const verifiedUser = new User({
            name: 'Existing User',
            address: 'Antipolo',
            contact: 'existing@test.com',
            password: 'HashedPassword123!',
            role: 'operator',
            isVerified: true
        });
        await verifiedUser.save();

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Duplicate Attempt',
                address: 'Antipolo',
                contact: 'existing@test.com',
                password: 'NewPassword123!'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('ALREADY EXISTS');
    });

    it('9. should allow re-registration if prior attempt was unverified', async () => {
        const unverifiedUser = new User({
            name: 'Unverified User',
            address: 'Antipolo',
            contact: 'unverified@test.com',
            password: 'OldPassword123!',
            role: 'operator',
            isVerified: false,
            otp: '111111'
        });
        await unverifiedUser.save();

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Fresh Attempt',
                address: 'Antipolo',
                contact: 'unverified@test.com',
                password: 'NewPassword123!'
            });

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: 'unverified@test.com' });
        expect(user.name).toBe('Fresh Attempt');
        const isNewPass = await user.matchPassword('NewPassword123!');
        expect(isNewPass).toBe(true);
    });

    it('10. should successfully verify OTP and return auth token and user', async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Verification Target',
                address: 'Antipolo',
                contact: 'target@test.com',
                password: 'Password123!'
            });

        const unverifiedUser = await User.findOne({ contact: 'target@test.com' });
        const otpCode = unverifiedUser.otp;

        const verifyRes = await request(app)
            .post('/api/v1/auth/verify-otp')
            .send({
                contact: 'Target@test.com', // test case-insensitivity
                otp: otpCode
            });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.token).toBeDefined();
        expect(verifyRes.body.role).toBe('operator');
        expect(verifyRes.body.user).toBeDefined();

        const verifiedUser = await User.findOne({ contact: 'target@test.com' });
        expect(verifiedUser.isVerified).toBe(true);
        expect(verifiedUser.otp).toBeUndefined();
    });

    it('11. should fail OTP verification with wrong code', async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Wrong OTP Target',
                address: 'Antipolo',
                contact: 'wrongotp@test.com',
                password: 'Password123!'
            });

        const verifyRes = await request(app)
            .post('/api/v1/auth/verify-otp')
            .send({
                contact: 'wrongotp@test.com',
                otp: '999999'
            });

        expect(verifyRes.status).toBe(400);
        expect(verifyRes.body.message).toContain('Invalid or expired OTP');
    });

    it('12. should allow instant Google onboarding without OTP code', async () => {
        const googlePayload = {
            googleProfile: {
                email: 'google.user@gmail.com',
                googleId: 'google-sub-123456',
                name: 'Google User',
                picture: 'https://lh3.googleusercontent.com/photo.jpg'
            },
            onboardingData: {
                fullName: 'Google Operator User',
                address: 'Dawis',
                contact: '09333333333',
                todaAssociation: 'BATODA',
                role: 'operator'
            }
        };

        const res = await request(app)
            .post('/api/v1/auth/google')
            .send(googlePayload);

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.role).toBe('operator');

        const dbUser = await User.findOne({ googleId: 'google-sub-123456' });
        expect(dbUser).toBeDefined();
        expect(dbUser.isVerified).toBe(true);
        expect(dbUser.authProvider).toBe('google');
        expect(dbUser.email).toBe('google.user@gmail.com');
        expect(dbUser.todaAssociation).toBe('BATODA');
    });

    it('13. should normalize phone numbers with dashes or +63 and allow verify-otp across formats', async () => {
        const payload = {
            name: 'Phone Formatted User',
            address: 'Bahi',
            contact: '0912-345-6789',
            password: 'Password123!',
            role: 'operator'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: '09123456789' });
        expect(user).toBeDefined();

        // Verify OTP using +63 international format
        const verifyRes = await request(app)
            .post('/api/v1/auth/verify-otp')
            .send({
                contact: '+639123456789',
                otp: user.otp
            });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.token).toBeDefined();
    });

    it('14. should prevent Google onboarding from hijacking an existing verified user phone account', async () => {
        const existingVerifiedUser = new User({
            name: 'Original Phone Owner',
            address: 'Antipolo',
            contact: '09444444444',
            password: 'HashedPassword123!',
            role: 'operator',
            isVerified: true
        });
        await existingVerifiedUser.save();

        const hijackPayload = {
            googleProfile: {
                email: 'stranger@gmail.com',
                googleId: 'stranger-google-id',
                name: 'Stranger'
            },
            onboardingData: {
                fullName: 'Stranger Name',
                address: 'Antipolo',
                contact: '09444444444',
                todaAssociation: 'NON-TODA',
                role: 'operator'
            }
        };

        const res = await request(app)
            .post('/api/v1/auth/google')
            .send(hijackPayload);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('ALREADY EXISTS');
    });

    it('15. should accept name when fullName is an empty string without validation failure', async () => {
        const payload = {
            name: 'Valid Name Provided',
            fullName: '',
            address: 'Pinggan',
            contact: '09555555555',
            password: 'Password123!'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: '09555555555' });
        expect(user).toBeDefined();
        expect(user.name).toBe('Valid Name Provided');
    });

    it('16. should accept toda_president role and normalize to toda president', async () => {
        const payload = {
            name: 'President UnderScore',
            address: 'Pinggan',
            contact: 'pres.underscore@test.com',
            password: 'Password123!',
            role: 'toda_president',
            todaAssociation: 'BATODA'
        };

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send(payload);

        expect(res.status).toBe(201);
        const user = await User.findOne({ contact: 'pres.underscore@test.com' });
        expect(user).toBeDefined();
        expect(user.role).toBe('toda president');
    });

    it('17. should seamlessly authenticate an existing registered email user via Continue with Google', async () => {
        // User registers with email first
        const regPayload = {
            name: 'Maria Dela Cruz',
            address: 'Antipolo',
            contact: 'maria.cruz@gmail.com',
            password: 'Password123!',
            role: 'operator'
        };

        const regRes = await request(app)
            .post('/api/v1/auth/register')
            .send(regPayload);
        expect(regRes.status).toBe(201);

        const createdUser = await User.findOne({ contact: 'maria.cruz@gmail.com' });
        expect(createdUser).toBeDefined();
        // Verify user OTP
        createdUser.isVerified = true;
        await createdUser.save();

        // User now clicks "Continue with Google" after registration
        const googleLoginRes = await request(app)
            .post('/api/v1/auth/google')
            .send({
                googleProfile: {
                    email: 'maria.cruz@gmail.com',
                    googleId: 'google-maria-12345',
                    name: 'Maria Dela Cruz'
                }
            });

        expect(googleLoginRes.status).toBe(200);
        expect(googleLoginRes.body.isNewUser).toBe(false);
        expect(googleLoginRes.body.token).toBeDefined();

        const updatedUser = await User.findById(createdUser._id);
        expect(updatedUser.googleId).toBe('google-maria-12345');
        expect(updatedUser.authProvider).toBe('google');
    });

    it('18. should decode JWT idToken as fallback and authenticate without tokeninfo failure', async () => {
        const jwt = require('jsonwebtoken');
        const fakeToken = jwt.sign({
            email: 'jwt.fallback@gmail.com',
            sub: 'sub-jwt-777',
            name: 'JWT Fallback User'
        }, 'secret');

        const res = await request(app)
            .post('/api/v1/auth/google')
            .send({ idToken: fakeToken });

        expect(res.status).toBe(200);
        expect(res.body.isNewUser).toBe(true);
        expect(res.body.googleProfile.email).toBe('jwt.fallback@gmail.com');
        expect(res.body.googleProfile.googleId).toBe('sub-jwt-777');
    });

    it('19. should accept credential parameter (Google One Tap standard payload name)', async () => {
        const jwt = require('jsonwebtoken');
        const oneTapCredential = jwt.sign({
            email: 'onetap.user@gmail.com',
            sub: 'sub-onetap-888',
            name: 'One Tap User'
        }, 'secret');

        const res = await request(app)
            .post('/api/v1/auth/google')
            .send({ credential: oneTapCredential });

        expect(res.status).toBe(200);
        expect(res.body.isNewUser).toBe(true);
        expect(res.body.googleProfile.email).toBe('onetap.user@gmail.com');
    });

    it('20. should unwrap nested googleProfile payload gracefully', async () => {
        const nestedPayload = {
            googleProfile: {
                googleProfile: {
                    email: 'nested.profile@gmail.com',
                    googleId: 'sub-nested-999',
                    name: 'Nested User'
                }
            },
            onboardingData: {
                fullName: 'Nested User',
                address: 'Bahi',
                contact: '09777777777',
                todaAssociation: 'BATODA',
                role: 'operator'
            }
        };

        const res = await request(app)
            .post('/api/v1/auth/google')
            .send(nestedPayload);

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();

        const dbUser = await User.findOne({ email: 'nested.profile@gmail.com' });
        expect(dbUser).toBeDefined();
        expect(dbUser.contact).toBe('09777777777');
    });
});

