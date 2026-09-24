const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/userModel');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

describe('User Model Test', () => {
    it('should create and save a user successfully', async () => {
        const validUser = new User({
            name: 'Test Operator',
            email: 'operator@test.com',
            password: 'password123',
            role: 'operator',
            contact: '09123456789',
            address: 'Gasan, Marinduque'
        });
        
        const savedUser = await validUser.save();
        
        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe(validUser.name);
        expect(savedUser.role).toBe('operator');
        // Password should be hashed by pre-save hook
        expect(savedUser.password).not.toBe('password123');
    });

    it('should fail if required fields are missing', async () => {
        const userWithoutRequiredField = new User({ name: 'Test' });
        let err;
        try {
            await userWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.address).toBeDefined(); // Address is required
        expect(err.errors.contact).toBeDefined(); // Contact is required
        expect(err.errors.password).toBeDefined(); // Password is required
    });
});
