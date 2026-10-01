process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const { app, server } = require('../../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

jest.mock('axios', () => ({
    get: jest.fn().mockResolvedValue({
        data: Buffer.from('fake image data'),
        headers: { 'content-type': 'image/jpeg' }
    })
}));

const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const { 
    normalizeString, 
    compareField, 
    verifyFranchiseDocuments 
} = require('../../src/services/documentVerificationService');

let mongoServer;
let adminUser, adminToken;
let operatorUser, operatorToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    adminUser = await User.create({
        name: 'Admin Inspector',
        contact: '09190001111',
        email: 'admin.inspector@example.com',
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

    operatorUser = await User.create({
        name: 'Pedro Operator',
        contact: '09192223333',
        email: 'pedro.op@example.com',
        address: 'Bahi, Gasan',
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
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    if (server && server.close) {
        await new Promise((resolve) => server.close(resolve));
    }
});

describe('Document Verification Service Unit & API Tests', () => {

    describe('1. Text Normalization and Field Comparison', () => {
        it('should correctly normalize strings by removing spaces, dashes, and converting to uppercase', () => {
            expect(normalizeString('abc-1234')).toBe('ABC1234');
            expect(normalizeString('  chassis # 9988-77  ')).toBe('CHASSIS998877');
            expect(normalizeString('')).toBe('');
            expect(normalizeString(null)).toBe('');
        });

        it('should identify matching fields accurately', () => {
            const result = compareField('ABC-1234', 'abc 1234', 'Plate Number', 'plateNo');
            expect(result.status).toBe('match');
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        });

        it('should identify mismatched fields and provide descriptive note', () => {
            const result = compareField('CHAS-1111', 'CHAS-9999', 'Chassis No', 'chassisNo');
            expect(result.status).toBe('mismatch');
            expect(result.notes).toContain('Hindi tugma');
        });

        it('should flag unclear or unreadable extracted values', () => {
            const result = compareField('ABC-1234', null, 'Plate Number', 'plateNo');
            expect(result.status).toBe('unclear');
            expect(result.notes).toContain('Hindi malinaw');
        });
    });

    describe('2. verifyFranchiseDocuments Service Engine', () => {
        it('should aggregate comparisons for all attached documents in simulated mode', async () => {
            const mockFranchise = {
                operator: operatorUser._id,
                fullName: 'Pedro Operator',
                address: 'Bahi, Gasan',
                plateNo: 'GA-9988',
                chassisNo: 'CHASSIS-123456789',
                motorNo: 'ENG-987654321',
                orCrNo: 'ORCR-554433',
                driverLicenseNo: 'D01-99-887766',
                isOperatorDriver: true,
                todaName: 'BATODA',
                cedulaSerialNo: 'CTC-2026-001',
                cedulaDate: new Date('2026-01-15'),
                orCrUrl: 'https://example.com/orcr.jpg',
                licenseUrl: 'https://example.com/license.jpg',
                cedulaUrl: 'https://example.com/cedula.jpg',
                todaEndorsementUrl: 'https://example.com/toda.jpg',
                brgyClearanceUrl: 'https://example.com/brgy.jpg'
            };

            const result = await verifyFranchiseDocuments(mockFranchise);

            expect(result).toBeDefined();
            expect(['verified', 'unverified']).toContain(result.status);
            expect(result.documents.orCr).toBeDefined();
            expect(result.documents.license).toBeDefined();
            expect(result.documents.cedula).toBeDefined();
            expect(result.documents.todaEndorsement).toBeDefined();
            expect(result.documents.brgyClearance).toBeDefined();
            expect(result.documents.brgyClearance).toBeDefined();
        });
    });

    describe('3. POST /api/v1/franchises/scan-document API Endpoint', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/v1/franchises/scan-document');

            expect(res.status).toBe(401);
        });

        it('should handle scan request without file gracefully', async () => {
            const res = await request(app)
                .post('/api/v1/franchises/scan-document')
                .set('Authorization', `Bearer ${operatorToken}`)
                .send({ docType: 'license' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should check unique franchise field accurately', async () => {
            const res = await request(app)
                .get('/api/v1/franchises/check-unique?field=plateNo&value=UNIQUE-999')
                .set('Authorization', `Bearer ${operatorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.isUnique).toBe(true);
            expect(res.body.unique).toBe(true);
            expect(res.body.exists).toBe(false);
        });
    });
});
