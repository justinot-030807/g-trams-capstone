const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Franchise = require('../../src/models/franchiseModel');
const User = require('../../src/models/userModel');
const Notification = require('../../src/models/notificationModel');
const SystemSettings = require('../../src/models/systemSettingsModel');
const { 
    getManilaNow, 
    getManilaDateString, 
    getManilaStartOfDay, 
    getManilaEndOfDay, 
    computeManilaExpiryDate, 
    calculateDaysRemaining, 
    isExpired 
} = require('../../src/utils/phTime');
const { 
    syncFranchiseStatuses, 
    sendRenewalReminders 
} = require('../../src/services/cronService');

let mongoServer;
let testOperator;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }

    testOperator = await User.create({
        name: 'Juan Dela Cruz',
        email: 'juan@example.com',
        password: 'password123',
        role: 'operator',
        contact: '09123456789',
        address: 'Gasan, Marinduque'
    });

    await SystemSettings.create({
        expiryWarningDays: 30,
        validityNew: 1,
        validityRenew: 1
    });
});

describe('1. Philippine Standard Time (Asia/Manila, UTC+8) Utility Tests', () => {
    it('should format date string in Asia/Manila correctly', () => {
        // 2026-10-18 01:00:00 UTC is 2026-10-18 09:00:00 in Manila
        const utcDate = new Date('2026-10-18T01:00:00.000Z');
        expect(getManilaDateString(utcDate)).toBe('2026-10-18');

        // 2026-10-17 18:00:00 UTC is 2026-10-18 02:00:00 in Manila
        const lateUtcDate = new Date('2026-10-17T18:00:00.000Z');
        expect(getManilaDateString(lateUtcDate)).toBe('2026-10-18');
    });

    it('should calculate Manila start and end of day boundaries', () => {
        const testDate = new Date('2026-10-18T10:00:00.000Z');
        const start = getManilaStartOfDay(testDate);
        const end = getManilaEndOfDay(testDate);

        // 2026-10-18 00:00:00+08:00 is 2026-10-17 16:00:00Z
        expect(start.toISOString()).toBe('2026-10-17T16:00:00.000Z');
        // 2026-10-18 23:59:59.999+08:00 is 2026-10-18 15:59:59.999Z
        expect(end.toISOString()).toBe('2026-10-18T15:59:59.999Z');
    });

    it('should compute exact 1-year Manila expiry date', () => {
        const approval = new Date('2026-05-15T08:00:00.000Z');
        const expiry = computeManilaExpiryDate(approval, 1);
        expect(getManilaDateString(expiry)).toBe('2027-05-15');
        expect(expiry.toISOString()).toBe('2027-05-15T15:59:59.999Z');
    });

    it('should calculate calendar days remaining relative to Manila time', () => {
        const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const days = calculateDaysRemaining(futureDate);
        expect(days).toBeGreaterThanOrEqual(14);
        expect(days).toBeLessThanOrEqual(16);

        const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        expect(calculateDaysRemaining(pastDate)).toBeLessThan(0);
        expect(isExpired(pastDate)).toBe(true);
    });
});

describe('2. Mongoose Dynamic Status Evaluation on Fetch/Query', () => {
    it('should dynamically report status as Expired when expiryDate < serverNow', async () => {
        const pastExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

        const franchise = await Franchise.create({
            operator: testOperator._id,
            fullName: 'Juan Dela Cruz',
            address: 'Bunganay, Gasan',
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako 175',
            motorNo: 'MTR-EXP-001',
            chassisNo: 'CHS-EXP-001',
            plateNo: 'EXP-001',
            todaName: 'BAGASAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CTC-001',
            status: 'Active',
            approvalDate: new Date('2025-01-01'),
            expiryDate: pastExpiry
        });

        // Even though stored with status 'Active', fetch/query must dynamically report 'Expired'
        const fetched = await Franchise.findById(franchise._id);
        expect(fetched.status).toBe('Expired');
        expect(fetched.isExpired).toBe(true);
        expect(fetched.daysRemaining).toBeLessThan(0);

        // Plain object/JSON serialization must also report 'Expired'
        const json = fetched.toJSON();
        expect(json.status).toBe('Expired');
        expect(json.isExpired).toBe(true);
    });

    it('should report status as Active when expiryDate is in the future', async () => {
        const futureExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

        const franchise = await Franchise.create({
            operator: testOperator._id,
            fullName: 'Juan Dela Cruz',
            address: 'Bunganay, Gasan',
            zone: 'Zone 1',
            made: 'Kawasaki',
            make: 'Barako 175',
            motorNo: 'MTR-ACT-001',
            chassisNo: 'CHS-ACT-001',
            plateNo: 'ACT-001',
            todaName: 'BAGASAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CTC-002',
            status: 'Active',
            approvalDate: new Date(),
            expiryDate: futureExpiry
        });

        const fetched = await Franchise.findById(franchise._id);
        expect(fetched.status).toBe('Active');
        expect(fetched.isExpired).toBe(false);
        expect(fetched.daysRemaining).toBeGreaterThan(0);
    });
});

describe('3. Cron Synchronization and 30-Day Renewal Reminders', () => {
    it('should synchronize expired franchises in DB to Expired and notify operator', async () => {
        const pastExpiry = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

        const franchise = await Franchise.create({
            operator: testOperator._id,
            fullName: 'Juan Dela Cruz',
            address: 'Bunganay, Gasan',
            zone: 'Zone 1',
            made: 'Honda',
            make: 'TMX 125',
            motorNo: 'MTR-CRON-001',
            chassisNo: 'CHS-CRON-001',
            plateNo: 'CRON-001',
            todaName: 'BAGASAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CTC-003',
            status: 'Active',
            approvalDate: new Date('2025-01-01'),
            expiryDate: pastExpiry
        });

        const syncResult = await syncFranchiseStatuses();
        expect(syncResult.count).toBe(1);

        // Verify in DB that raw record is now Expired
        const rawInDb = await Franchise.collection.findOne({ _id: franchise._id });
        expect(rawInDb.status).toBe('Expired');

        // Verify notification was sent
        const notif = await Notification.findOne({
            recipient: testOperator._id,
            type: 'status_change'
        });
        expect(notif).toBeDefined();
        expect(notif.title).toContain('Expired');
        expect(notif.relatedFranchise.toString()).toBe(franchise._id.toString());
    });

    it('should send 30-day renewal reminders for active units expiring soon', async () => {
        // Expiring in 20 days (within 30-day window)
        const expiringIn20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

        const franchise = await Franchise.create({
            operator: testOperator._id,
            fullName: 'Juan Dela Cruz',
            address: 'Bunganay, Gasan',
            zone: 'Zone 1',
            made: 'Yamaha',
            make: 'YTX 125',
            motorNo: 'MTR-REM-001',
            chassisNo: 'CHS-REM-001',
            plateNo: 'REM-001',
            todaName: 'BAGASAN TODA',
            cedulaDate: new Date(),
            cedulaAddress: 'Gasan',
            cedulaSerialNo: 'CTC-004',
            status: 'Active',
            approvalDate: new Date(),
            expiryDate: expiringIn20Days
        });

        const reminderResult = await sendRenewalReminders();
        expect(reminderResult.count).toBe(1);

        // Verify reminder notification was dispatched
        const reminderNotif = await Notification.findOne({
            recipient: testOperator._id,
            type: 'renewal_reminder'
        });
        expect(reminderNotif).toBeDefined();
        expect(reminderNotif.title).toContain('Renewal Reminder');
        expect(reminderNotif.message).toContain('REM-001');

        // Running it again should throttle (no duplicate reminder within 7 days)
        const secondRun = await sendRenewalReminders();
        expect(secondRun.count).toBe(0);
    });
});
