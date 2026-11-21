const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const ADMIN_PASSWORD = 'Restore Admin 42!';
const SAVED_ARCHIVE = 'restore-audit-fixture.json';
const originalEnvironment = { ...process.env };
let database;
let backupDir;
let app;
let backupService;
let syncFranchiseStatuses;
let User;
let SystemSettings;
let PaymentLedger;
let admin;
let authorization;

function settingsArchive(franchiseFees = [650]) {
    const collections = { system_settings: franchiseFees.map(franchiseFee => ({ franchiseFee })) };
    const checksum = crypto.createHash('sha256').update(JSON.stringify(collections)).digest('hex');
    return { manifest: { system: 'G-TRAMS', checksum }, collections };
}

test('M6 preserves the higher issued MTOP sequence when restoring an older archive', async () => {
    const MtopCounter = require('../../src/models/mtopCounterModel');
    await MtopCounter.create([{ _id: '2035', sequence: 800 }, { _id: '2036', sequence: 10 }]);
    const archive = {
        manifest: { system: 'G-TRAMS' },
        collections: { mtop_counters: [{ _id: '2035', sequence: 500 }, { _id: '2036', sequence: 100 }] }
    };

    await backupService.restoreFromBackup(archive);
    expect(await MtopCounter.find().sort('_id').lean()).toEqual([
        { _id: '2035', sequence: 800 }, { _id: '2036', sequence: 100 }
    ]);
});

async function waitForRestoreLock() {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
        if (await backupService.isRestoreInProgress()) return;
        await delay(20);
    }
    throw new Error('The restore did not claim its lock.');
}

beforeAll(async () => {
    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtrams-restore-audit-'));
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'restore-audit-test-secret';
    process.env.BACKUP_DIR = backupDir;
    database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(database.getUri());
    ({ app } = require('../../server'));
    backupService = require('../../src/services/backupService');
    ({ syncFranchiseStatuses } = require('../../src/services/cronService'));
    User = require('../../src/models/userModel');
    SystemSettings = require('../../src/models/systemSettingsModel');
    PaymentLedger = require('../../src/models/paymentLedgerModel');
    admin = await User.create({
        name: 'Restore Administrator',
        email: 'restore.admin@example.com',
        contact: '09120000840',
        address: 'Gasan, Marinduque',
        role: 'system_admin',
        password: ADMIN_PASSWORD,
        isVerified: true
    });
    authorization = `Bearer ${jwt.sign(
        { id: admin._id, tokenVersion: admin.tokenVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    )}`;
    fs.writeFileSync(path.join(backupDir, SAVED_ARCHIVE), JSON.stringify(settingsArchive()));
}, 60000);

beforeEach(async () => {
    await backupService.SystemLock.deleteMany({});
    await SystemSettings.deleteMany({});
    await PaymentLedger.deleteMany({});
    await SystemSettings.create({ franchiseFee: 500 });
});

afterAll(async () => {
    await mongoose.disconnect();
    if (database) await database.stop();
    if (backupDir) fs.rmSync(backupDir, { recursive: true, force: true });
    for (const key of ['NODE_ENV', 'JWT_SECRET', 'BACKUP_DIR']) {
        if (originalEnvironment[key] === undefined) delete process.env[key];
        else process.env[key] = originalEnvironment[key];
    }
});

describe('Batch 1 restore coordination and administrator confirmation', () => {
    it('honors a shared restore lock for HTTP writes, presence updates, and cron', async () => {
        const lock = await backupService.SystemLock.create({
            _id: backupService.RESTORE_LOCK_ID,
            ownerId: 'another-worker',
            expiresAt: new Date(Date.now() + 60000)
        });
        const lastActive = new Date('2026-01-01T00:00:00Z');
        await User.updateOne({ _id: admin._id }, { $set: { lastActive } });

        await request(app).post('/api/v1/auth/heartbeat').set('Authorization', authorization).expect(503);
        await request(app).get('/api/v1/auth/profile').set('Authorization', authorization).expect(200);
        expect((await User.findById(admin._id)).lastActive).toEqual(lastActive);
        await expect(syncFranchiseStatuses()).resolves.toMatchObject({ skipped: true });
        await request(app).post(`/api/v1/backups/restore-file/${SAVED_ARCHIVE}`)
            .set('Authorization', authorization).send({ adminPassword: ADMIN_PASSWORD }).expect(409);

        await backupService.SystemLock.updateOne({ _id: lock._id }, { $set: { expiresAt: new Date(0) } });
        await request(app).post('/api/v1/auth/heartbeat').set('Authorization', authorization).expect(200);
    });

    it('drains admitted work and preserves payment ledger rows omitted by older archives', async () => {
        const payment = await PaymentLedger.create({
            franchiseId: new mongoose.Types.ObjectId(),
            applicantName: 'Test Operator',
            officialReceiptNo: 'AUDIT-001',
            amountPaid: 500,
            processedBy: admin._id,
            processedByName: admin.name
        });
        const release = await backupService.beginRestoreSensitiveWork();
        expect(release).toEqual(expect.any(Function));
        const restore = backupService.restoreFromBackup(settingsArchive()).then(
            result => ({ result }),
            error => ({ error })
        );
        let outcome;
        try {
            await waitForRestoreLock();
            expect((await SystemSettings.findOne()).franchiseFee).toBe(500);
            await expect(backupService.beginRestoreSensitiveWork()).resolves.toBeNull();
            await expect(backupService.restoreFromBackup(settingsArchive())).rejects.toMatchObject({ statusCode: 409 });
        } finally {
            await release();
            outcome = await restore;
        }

        expect(outcome).toMatchObject({ result: { success: true, restoredCounts: { system_settings: 1 } } });
        expect(await backupService.isRestoreInProgress()).toBe(false);
        expect((await SystemSettings.findOne()).franchiseFee).toBe(650);
        expect(await PaymentLedger.findById(payment._id)).toMatchObject({ officialReceiptNo: 'AUDIT-001' });
    });

    it('checks live unique indexes before any live collection is deleted', async () => {
        const index = await SystemSettings.collection.createIndex({ franchiseFee: 1 }, { unique: true });
        const deleteLive = jest.spyOn(SystemSettings, 'deleteMany');
        try {
            await expect(backupService.restoreFromBackup(settingsArchive([650, 650])))
                .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('unique index conflict') });
            expect(deleteLive).not.toHaveBeenCalled();
            expect((await SystemSettings.findOne()).franchiseFee).toBe(500);
            expect(await backupService.isRestoreInProgress()).toBe(false);
        } finally {
            deleteLive.mockRestore();
            await SystemSettings.collection.dropIndex(index);
        }
    });

    it('keeps failed compensation frozen until offline recovery verifies the safety snapshot', async () => {
        const insertLive = jest.spyOn(SystemSettings.collection, 'insertMany')
            .mockRejectedValueOnce(new Error('Cutover write unavailable'))
            .mockRejectedValueOnce(new Error('Compensation write unavailable'));
        try {
            await expect(backupService.restoreFromBackup(settingsArchive()))
                .rejects.toThrow('rollback encountered errors');
        } finally {
            insertLive.mockRestore();
        }

        const pinned = await backupService.SystemLock.collection.findOne({ _id: backupService.RESTORE_LOCK_ID });
        expect(pinned).toMatchObject({ restorePhase: 'cutover', recoveryCollections: ['system_settings'] });
        expect(pinned.expiresAt).toBeUndefined();
        await request(app).post('/api/v1/auth/heartbeat').set('Authorization', authorization).expect(503);
        await expect(backupService.recoverPinnedRestore({ ownerId: pinned.ownerId })).resolves.toEqual({
            success: true,
            restoredCounts: { system_settings: 1 }
        });
        expect((await SystemSettings.findOne()).franchiseFee).toBe(500);
        expect(await backupService.isRestoreInProgress()).toBe(false);
    });

    it.each(['saved archive', 'uploaded archive'])('requires the current password for a %s', async (source) => {
        const submit = (password) => {
            if (source === 'saved archive') {
                return request(app).post(`/api/v1/backups/restore-file/${SAVED_ARCHIVE}`)
                    .set('Authorization', authorization)
                    .send(password === undefined ? {} : { adminPassword: password });
            }
            const upload = request(app).post('/api/v1/backups/restore-upload').set('Authorization', authorization);
            if (password !== undefined) upload.field('adminPassword', password);
            return upload.attach('backupFile', Buffer.from(JSON.stringify(settingsArchive())), SAVED_ARCHIVE);
        };
        await submit().expect(401);
        await submit('Incorrect administrator password').expect(401);
        expect((await SystemSettings.findOne()).franchiseFee).toBe(500);
        const restored = await submit(ADMIN_PASSWORD).expect(200);
        expect(restored.body.restoredCounts).toEqual({ system_settings: 1 });
        expect((await SystemSettings.findOne()).franchiseFee).toBe(650);
    });
});
