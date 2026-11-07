const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

let mongoServer;
let app;
let adminToken;
let operatorToken;
let backupService;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_backup_secret_key_12345';

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const User = require('../../src/models/userModel');
    const Franchise = require('../../src/models/franchiseModel');
    backupService = require('../../src/services/backupService');

    const serverObj = require('../../server');
    app = serverObj.app;

    const admin = await User.create({
        name: 'Super Admin',
        email: 'admin.backup@gtrams.gov.ph',
        password: 'Password123!',
        role: 'admin',
        contact: '09120000001',
        address: 'Gasan, Marinduque'
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const op = await User.create({
        name: 'Test Operator',
        email: 'operator.backup@gtrams.gov.ph',
        password: 'Password123!',
        role: 'operator',
        contact: '09120000002',
        address: 'Bahi, Gasan'
    });
    operatorToken = jwt.sign({ id: op._id, role: op.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await Franchise.create({
        operator: op._id,
        fullName: 'Test Operator',
        address: 'Bahi, Gasan',
        zone: 'Zone 1',
        made: '2024',
        make: 'Honda TMX 125',
        motorNo: 'MOT-BACKUP-01',
        chassisNo: 'CHAS-BACKUP-01',
        plateNo: 'BAK-001',
        todaName: 'GASAN CENTRAL TODA',
        cedulaSerialNo: 'CTC-BAK-001',
        cedulaAddress: 'Bahi, Gasan',
        cedulaDate: new Date(),
        status: 'Active'
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();

    // Clean up created test backup files
    try {
        if (fs.existsSync(backupService.BACKUP_DIR)) {
            const files = fs.readdirSync(backupService.BACKUP_DIR);
            for (const f of files) {
                if (f.startsWith('gtrams_backup_')) {
                    fs.unlinkSync(path.join(backupService.BACKUP_DIR, f));
                }
            }
        }
    } catch {}
});

describe('Database Backup & Disaster Recovery API Tests', () => {
    it('1. should reject unauthorized non-admin roles (HTTP 403)', async () => {
        const res = await request(app)
            .post('/api/v1/backups/create')
            .set('Authorization', `Bearer ${operatorToken}`)
            .send({});

        expect(res.status).toBe(403);
    });

    it('2. should reject unauthenticated requests (HTTP 401)', async () => {
        const res = await request(app)
            .get('/api/v1/backups/status');

        expect(res.status).toBe(401);
    });

    it('3. should successfully create a manual backup and record manifest', async () => {
        const res = await request(app)
            .post('/api/v1/backups/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ notes: 'Jest manual test snapshot' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.backup.filename).toMatch(/^gtrams_backup_manual_/);
        expect(res.body.backup.manifest.system).toBe('G-TRAMS');
        expect(res.body.backup.manifest.counts.franchises).toBeGreaterThanOrEqual(1);
    });

    it('4. should list available backup archives with stats', async () => {
        const res = await request(app)
            .get('/api/v1/backups/list')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.backups)).toBe(true);
        expect(res.body.backups.length).toBeGreaterThanOrEqual(1);
    });

    it('5. should return system backup health and schedule status', async () => {
        const res = await request(app)
            .get('/api/v1/backups/status')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.stats.cronSchedule).toContain('Sunday');
        expect(res.body.stats.totalBackups).toBeGreaterThanOrEqual(1);
    });

    it('6. should stream direct gzipped snapshot without disk dependency', async () => {
        const res = await request(app)
            .get('/api/v1/backups/direct-download')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.header['content-type']).toBe('application/gzip');
        expect(res.header['content-disposition']).toContain('attachment; filename="gtrams_live_snapshot_');
    });

    it('7. should successfully restore from uploaded archive payload', async () => {
        // Assemble payload to simulate restore
        const payload = await backupService.assembleBackupPayload();
        const Franchise = require('../../src/models/franchiseModel');

        // Modify a record in DB to verify restore overwrites
        await Franchise.deleteMany({});
        expect(await Franchise.countDocuments()).toBe(0);

        const restoreResult = await backupService.restoreFromBackup(payload, { triggeredBy: 'Jest Test' });
        expect(restoreResult.success).toBe(true);

        const restoredCount = await Franchise.countDocuments();
        expect(restoredCount).toBe(1);
    });
});
