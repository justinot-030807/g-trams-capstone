const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, server } = require('../../server');
const Franchise = require('../../src/models/franchiseModel');
const User = require('../../src/models/userModel');
const jwt = require('jsonwebtoken');

let mongoServer;
let adminToken;
let operatorToken;
let operatorId;

beforeAll(async () => {
    // Setup in-memory DB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Close existing mongoose connections if any, then connect to in-memory
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);

    // Create a mock admin user
    const admin = new User({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        contact: '09123456789',
        address: 'Gasan'
    });
    await admin.save();

    // Create a mock operator user
    const operator = new User({
        name: 'Operator User',
        email: 'operator@test.com',
        password: 'password123',
        role: 'operator',
        contact: '09987654321',
        address: 'Gasan'
    });
    await operator.save();
    operatorId = operator._id;

    // Generate token for operator
    operatorToken = jwt.sign({ id: operator._id, role: operator.role }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close(); // Close http server
});

afterEach(async () => {
    await Franchise.deleteMany();
});

describe('Franchise API Tests', () => {
    it('should create a franchise if unique constraints are met', async () => {
        // Create an active franchise
        const activeFranchise = new Franchise({
            operator: operatorId,
            fullName: 'John Doe',
            address: 'Gasan',
            zone: 'Zone 1',
            made: 'Honda',
            make: 'Tricycle',
            motorNo: 'MOT123',
            chassisNo: 'CHAS123',
            plateNo: 'ABC-123',
            todaName: 'GASAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: '123456',
            status: 'Active',
            isArchived: false
        });
        await activeFranchise.save();

        // Attempting to register the same plateNo should fail since it's not archived
        const res = await request(app)
            .post('/api/v1/franchises')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({
                operator: operatorId,
                fullName: 'Jane Doe',
                address: 'Gasan',
                zone: 'Zone 1',
                made: 'Kawasaki',
                make: 'Tricycle',
                motorNo: 'MOT999',
                chassisNo: 'CHAS999',
                plateNo: 'ABC-123', // Same plate
                todaName: 'GASAN TODA',
                cedulaDate: new Date(),
                cedulaAddress: 'Gasan',
                cedulaSerialNo: '654321'
            });
            
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Tricycle (Plate/Motor/Chassis) is already registered');
    });
});
