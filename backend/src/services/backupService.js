const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { setTimeout: delay } = require('node:timers/promises');
const mongoose = require('mongoose');
const AuditLog = require('../models/auditLogModel');
const Notification = require('../models/notificationModel');
const { ChatMessage, ChatThread } = require('../models/chatModel');

const ENCRYPTED_MAGIC = Buffer.from('GTRAMS_ENC_V1\n', 'ascii');
const RESTORE_LOCK_ID = 'db_restore_lock';
const RESTORE_WORK_PREFIX = 'db_restore_work:';
const RESTORE_LEASE_MS = 10 * 60 * 1000;
const RESTORE_DRAIN_MS = 15 * 1000;
const MAJORITY_WRITE = { writeConcern: { w: 'majority' } };

// MongoDB-backed distributed lock for coordinating restores across instances (H1)
const systemLockSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    ownerId: { type: String, required: true },
    triggeredBy: { type: String, default: 'System' },
    acquiredAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { versionKey: false });

const SystemLock = mongoose.models.SystemLock || mongoose.model('SystemLock', systemLockSchema, 'system_locks');

function restoreError(statusCode, message) {
    return Object.assign(new Error(message), { statusCode });
}

function requireRestoreDatabase() {
    if (mongoose.connection.readyState !== 1) {
        throw restoreError(503, 'Database restore coordination is unavailable. Please retry shortly.');
    }
}

async function isRestoreInProgress() {
    requireRestoreDatabase();
    return Boolean(await SystemLock.exists({
        _id: RESTORE_LOCK_ID,
        $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }]
    }).read('primary'));
}

async function releaseSystemLock(filter) {
    await SystemLock.deleteOne(filter, MAJORITY_WRITE).catch((err) => {
        console.warn('[BackupService] Failed releasing database restore coordination record:', err.message);
    });
}

function startRestoreLeaseHeartbeat(filter) {
    const heartbeat = setInterval(() => {
        const now = new Date();
        SystemLock.updateOne(
            { ...filter, expiresAt: { $gt: now } },
            { $set: { expiresAt: new Date(now.getTime() + RESTORE_LEASE_MS) } },
            MAJORITY_WRITE
        ).catch((err) => console.warn('[BackupService] Failed renewing restore coordination lease:', err.message));
    }, 60 * 1000);
    heartbeat.unref();
    return () => clearInterval(heartbeat);
}

// Register before checking again so a restore either sees this work or keeps it from starting.
async function beginRestoreSensitiveWork() {
    if (await isRestoreInProgress()) return null;

    const ownerId = crypto.randomUUID();
    const filter = { _id: RESTORE_WORK_PREFIX + ownerId, ownerId };
    await SystemLock.collection.insertOne({
        ...filter,
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + RESTORE_LEASE_MS)
    }, MAJORITY_WRITE);

    try {
        if (await isRestoreInProgress()) {
            await releaseSystemLock(filter);
            return null;
        }
    } catch (err) {
        await releaseSystemLock(filter);
        throw err;
    }

    const stopHeartbeat = startRestoreLeaseHeartbeat(filter);
    return async function release({ keepLease = false } = {}) {
        stopHeartbeat();
        if (!keepLease) await releaseSystemLock(filter);
    };
}

async function acquireDistributedRestoreLock(triggeredBy) {
    requireRestoreDatabase();
    const ownerId = crypto.randomUUID();
    const now = new Date();
    // Clear any expired lock document that TTL monitor hasn't reaped yet
    await SystemLock.deleteOne({ _id: RESTORE_LOCK_ID, expiresAt: { $lte: now } }, MAJORITY_WRITE);

    try {
        await SystemLock.collection.insertOne({
            _id: RESTORE_LOCK_ID,
            ownerId,
            triggeredBy,
            acquiredAt: now,
            expiresAt: new Date(now.getTime() + RESTORE_LEASE_MS)
        }, MAJORITY_WRITE);
        return ownerId;
    } catch (err) {
        if (err && err.code === 11000) {
            throw restoreError(409, 'Database restore is already in progress. Please retry shortly.');
        }
        throw err;
    }
}

async function drainRestoreSensitiveWork() {
    const deadline = Date.now() + RESTORE_DRAIN_MS;
    while (await SystemLock.exists({
        _id: { $regex: new RegExp(`^${RESTORE_WORK_PREFIX}`) },
        expiresAt: { $gt: new Date() }
    }).read('primary')) {
        if (Date.now() >= deadline) {
            throw restoreError(409, 'Database writes are still finishing. Please retry the restore shortly.');
        }
        await delay(100);
    }
}

async function pinRestoreLock(ownerId) {
    // Once cutover is allowed, loss of this process must leave the database in maintenance.
    const result = await SystemLock.collection.updateOne(
        { _id: RESTORE_LOCK_ID, ownerId, expiresAt: { $gt: new Date() } },
        { $unset: { expiresAt: 1 }, $set: { restorePhase: 'preparing' } },
        MAJORITY_WRITE
    );
    if (result.modifiedCount !== 1) {
        throw restoreError(503, 'Database restore coordination was interrupted. Please retry shortly.');
    }
}

function pinnedRestoreFilter(ownerId) {
    return { _id: RESTORE_LOCK_ID, ownerId, expiresAt: { $exists: false } };
}

async function writeRestoreCollections(collections, targetEntries, mutatedEntries) {
    const restoredCounts = {};
    await Notification.runWithNotificationHooksSuppressed(async () => {
        for (const [key, model] of targetEntries) {
            const records = collections[key];
            mutatedEntries?.push([key, model]);
            await model.deleteMany({}, MAJORITY_WRITE);
            const batchSize = 500;
            for (let i = 0; i < records.length; i += batchSize) {
                await model.insertMany(records.slice(i, i + batchSize), { ordered: true, ...MAJORITY_WRITE });
            }
            restoredCounts[key] = records.length;
        }
    });
    return restoredCounts;
}

function getBackupEncryptionKey() {
    const secret = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!secret || !String(secret).trim()) {
        return null;
    }
    return crypto.createHash('sha256').update(`gtrams-backup-v1:${String(secret)}`).digest();
}

function computeCollectionsChecksum(collections) {
    return crypto.createHash('sha256').update(JSON.stringify(collections)).digest('hex');
}

function verifyChecksum(collections, expectedChecksum) {
    if (!expectedChecksum || typeof expectedChecksum !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedChecksum)) {
        throw new Error('Invalid backup checksum format.');
    }
    const actualHex = computeCollectionsChecksum(collections);
    const expectedBuf = Buffer.from(expectedChecksum.toLowerCase(), 'hex');
    const actualBuf = Buffer.from(actualHex, 'hex');
    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
        throw new Error('Backup integrity check failed: SHA-256 checksum mismatch.');
    }
}

function encodeBackupPayload(payload) {
    const jsonString = JSON.stringify(payload);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    const key = getBackupEncryptionKey();
    if (!key) {
        return compressedBuffer;
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(compressedBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([ENCRYPTED_MAGIC, iv, authTag, encrypted]);
}

// Persistent MongoDB storage for backup archives (prevents data loss on Render ephemeral filesystem)
const backupArchiveSchema = new mongoose.Schema({
    filename: { type: String, required: true, unique: true },
    sizeBytes: { type: Number, required: true },
    isAutomated: { type: Boolean, default: false },
    triggeredBy: { type: String, default: 'System' },
    notes: { type: String, default: '' },
    data: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now }
});

const BackupArchive = mongoose.models.BackupArchive || mongoose.model('BackupArchive', backupArchiveSchema, 'backup_archives');

// Models mapping for full system data recovery
const MODELS = {
    users: require('../models/userModel'),
    franchises: require('../models/franchiseModel'),
    toda_roster: require('../models/todaModel'),
    toda_submissions: require('../models/todaSubmission'),
    toda_removal_requests: require('../models/todaRemovalRequest'),
    tickets: require('../models/ticketModel'),
    violations: require('../models/violationModel'),
    system_settings: require('../models/systemSettingsModel'),
    audit_logs: require('../models/auditLogModel'),
    sms_logs: require('../models/smsLogModel'),
    notifications: require('../models/notificationModel'),
    chat_threads: ChatThread,
    chat_messages: ChatMessage,
    push_subscriptions: require('../models/pushSubscriptionModel'),
    payment_ledgers: require('../models/paymentLedgerModel')
};

const BACKUP_DIR = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.resolve(__dirname, '../../backups');

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Extract, sanitize, and assemble all collection records into a single backup object
 */
async function assembleBackupPayload() {
    const collectionsData = {};
    const counts = {};
    let totalDocuments = 0;

    for (const [key, model] of Object.entries(MODELS)) {
        try {
            let docs = await model.find().lean();
            
            // Data Privacy Act compliance: sanitize ephemeral security tokens on user records
            if (key === 'users') {
                docs = docs.map(u => {
                    const sanitized = { ...u };
                    delete sanitized.otp;
                    delete sanitized.otpExpire;
                    delete sanitized.otpAttempts;
                    delete sanitized.otpPurpose;
                    delete sanitized.otpRecipient;
                    delete sanitized.passwordResetToken;
                    return sanitized;
                });
            }

            collectionsData[key] = docs;
            counts[key] = docs.length;
            totalDocuments += docs.length;
        } catch (err) {
            throw new Error(`[BackupService] Failed reading collection ${key}: ${err.message}`);
        }
    }

    const manifest = {
        system: 'G-TRAMS',
        fullName: 'Gasan Tricycle Regulatory and Management System',
        lgu: 'Municipality of Gasan, Marinduque',
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        collectionsCount: Object.keys(MODELS).length,
        totalDocuments,
        counts,
        checksumAlgorithm: 'sha256',
        checksum: computeCollectionsChecksum(collectionsData)
    };

    return { manifest, collections: collectionsData };
}

/**
 * Prune automated backups keeping only the latest 8 (Rolling retention)
 */
async function pruneOldAutomatedBackups(keepCount = 8) {
    try {
        ensureBackupDir();
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('gtrams_backup_auto_') && f.endsWith('.json.gz'))
            .map(f => {
                const filePath = path.join(BACKUP_DIR, f);
                const stats = fs.statSync(filePath);
                return { name: f, filePath, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime); // newest first

        if (files.length > keepCount) {
            const toDelete = files.slice(keepCount);
            const prunedFilenames = [];
            for (const file of toDelete) {
                fs.unlinkSync(file.filePath);
                prunedFilenames.push(file.name);
                console.log(`[BackupService] Pruned old automated backup: ${file.name}`);
            }
            if (prunedFilenames.length > 0) {
                await BackupArchive.deleteMany({ filename: { $in: prunedFilenames } }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('[BackupService] Error pruning old backups:', err.message);
    }
}

/**
 * Create a new backup file (.json.gz)
 */
async function createBackupFile({ isAutomated = false, triggeredBy = 'System', notes = '' } = {}) {
    ensureBackupDir();
    const payload = await assembleBackupPayload();
    const archiveBuffer = encodeBackupPayload(payload);

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const typePrefix = isAutomated ? 'auto' : 'manual';
    const filename = `gtrams_backup_${typePrefix}_${dateStr}.json.gz`;
    const fullPath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(fullPath, archiveBuffer);

    // Persist archive in MongoDB so ephemeral cloud disks (Render) never lose backups
    if (archiveBuffer.length < 14 * 1024 * 1024) {
        try {
            await BackupArchive.findOneAndUpdate(
                { filename },
                {
                    filename,
                    sizeBytes: archiveBuffer.length,
                    isAutomated,
                    triggeredBy,
                    notes,
                    data: archiveBuffer,
                    createdAt: new Date()
                },
                { upsert: true, new: true }
            );
        } catch (dbErr) {
            console.warn('[BackupService] Could not persist backup archive to MongoDB:', dbErr.message);
        }
    }

    // Apply rolling retention for automated backups
    if (isAutomated) {
        await pruneOldAutomatedBackups(8);
    }

    // Record audit event
    try {
        await AuditLog.create({
            action: isAutomated ? 'AUTOMATED_WEEKLY_BACKUP_COMPLETED' : 'MANUAL_BACKUP_CREATED',
            targetType: 'General',
            details: {
                filename,
                sizeBytes: archiveBuffer.length,
                totalDocuments: payload.manifest.totalDocuments,
                encrypted: Boolean(getBackupEncryptionKey()),
                checksum: payload.manifest.checksum,
                triggeredBy,
                notes
            }
        });
    } catch (auditErr) {
        console.warn('[BackupService] Could not write audit log:', auditErr.message);
    }

    return {
        success: true,
        filename,
        filePath: fullPath,
        sizeBytes: archiveBuffer.length,
        manifest: payload.manifest
    };
}

/**
 * List all available backup files
 */
function listBackupFiles() {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json.gz') || f.endsWith('.json'))
        .map(f => {
            const filePath = path.join(BACKUP_DIR, f);
            const stats = fs.statSync(filePath);
            const isAuto = f.includes('_auto_');
            return {
                filename: f,
                sizeBytes: stats.size,
                sizeFormatted: stats.size > 1024 * 1024 
                    ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
                    : `${(stats.size / 1024).toFixed(1)} KB`,
                createdAt: stats.mtime,
                isAutomated: isAuto,
                type: isAuto ? 'Automated (Weekly)' : 'Manual (On-Demand)'
            };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return files;
}

/**
 * Safely parse a backup buffer or file path
 */
function parseBackupBuffer(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error('Backup buffer is empty or invalid.');
    }

    let payloadBuffer = buffer;

    // Support AES-256-GCM encrypted archives (GTRAMS_ENC_V1)
    if (buffer.length >= ENCRYPTED_MAGIC.length && buffer.subarray(0, ENCRYPTED_MAGIC.length).equals(ENCRYPTED_MAGIC)) {
        const minEncryptedLen = ENCRYPTED_MAGIC.length + 12 + 16 + 1;
        if (buffer.length < minEncryptedLen) {
            throw new Error('Corrupted encrypted backup archive.');
        }
        const key = getBackupEncryptionKey();
        if (!key) {
            throw new Error('Encrypted backup archive requires BACKUP_ENCRYPTION_KEY or JWT_SECRET.');
        }
        const ivStart = ENCRYPTED_MAGIC.length;
        const tagStart = ivStart + 12;
        const cipherStart = tagStart + 16;
        const iv = buffer.subarray(ivStart, tagStart);
        const authTag = buffer.subarray(tagStart, cipherStart);
        const ciphertext = buffer.subarray(cipherStart);

        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            payloadBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        } catch {
            throw new Error('Failed to decrypt backup archive: invalid encryption key or tampered file.');
        }
    }

    let rawString = null;
    if (payloadBuffer.length >= 2 && payloadBuffer[0] === 0x1f && payloadBuffer[1] === 0x8b) {
        const decompressed = zlib.gunzipSync(payloadBuffer, { maxOutputLength: 50 * 1024 * 1024 });
        rawString = decompressed.toString('utf-8');
    } else {
        // Legacy plain UTF-8 JSON archive compatibility
        rawString = payloadBuffer.toString('utf-8');
    }

    const parsed = JSON.parse(rawString);
    if (!parsed || typeof parsed !== 'object' || !parsed.manifest || typeof parsed.manifest !== 'object' || !parsed.collections || typeof parsed.collections !== 'object' || Array.isArray(parsed.collections)) {
        throw new Error('Invalid G-TRAMS backup structure: manifest or collections missing.');
    }

    if (parsed.manifest.checksum !== undefined) {
        verifyChecksum(parsed.collections, parsed.manifest.checksum);
    }

    return parsed;
}

/**
 * Preflight validation of all collections and document shapes before any destructive database operation
 */
async function validateBackupPayload(backupPayload) {
    if (!backupPayload || typeof backupPayload !== 'object' || !backupPayload.manifest || typeof backupPayload.manifest !== 'object' || !backupPayload.collections || typeof backupPayload.collections !== 'object' || Array.isArray(backupPayload.collections)) {
        throw new Error('Invalid backup payload: manifest or collections missing.');
    }

    const { manifest, collections } = backupPayload;
    if (manifest.checksum !== undefined) {
        verifyChecksum(collections, manifest.checksum);
    }

    const collectionKeys = Object.keys(collections);
    if (collectionKeys.length === 0) {
        throw new Error('Invalid backup payload: collections object is empty.');
    }

    for (const key of collectionKeys) {
        if (!Object.prototype.hasOwnProperty.call(MODELS, key)) {
            throw new Error(`Invalid backup payload: unknown collection "${key}".`);
        }
        const records = collections[key];
        if (records !== undefined && !Array.isArray(records)) {
            throw new Error(`Invalid backup payload: collection "${key}" must be an Array.`);
        }
    }

    const preparedCollections = {};
    for (const [key, model] of Object.entries(MODELS)) {
        const records = collections[key];
        if (!Array.isArray(records)) continue;
        const prepared = [];
        const seenIds = new Set();
        for (let i = 0; i < records.length; i++) {
            const rec = records[i];
            if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
                throw new Error(`Invalid backup document in "${key}" at index ${i}: expected an object.`);
            }
            if (rec._id !== undefined && rec._id !== null) {
                const rawId = typeof rec._id === 'object' && rec._id.$oid ? rec._id.$oid : rec._id;
                const idKey = String(rawId);
                if (seenIds.has(idKey)) {
                    throw new Error(`Invalid backup payload in "${key}" at index ${i}: duplicate _id "${idKey}".`);
                }
                seenIds.add(idKey);
            }
            const doc = new model(rec);
            await doc.validate();
            doc.initializeTimestamps?.();
            if (model.schema.options.versionKey) doc.set(model.schema.options.versionKey, 0);
            prepared.push(doc.toObject({
                depopulate: true, getters: false, virtuals: false, transform: false
            }));
        }
        preparedCollections[key] = prepared;
    }
    return preparedCollections;
}

function copyCollation(collation) {
    if (!collation) return {};
    // listIndexes and listCollections include the server-generated ICU version.
    const { version: _version, ...options } = collation;
    return { collation: options };
}

async function stageRestoreCollections(collections, targetEntries) {
    const db = mongoose.connection.db;
    for (const [key, model] of targetEntries) {
        const records = collections[key];
        if (records.length < 2) continue;
        await model.init();
        const collectionName = model.collection.name;
        const live = await db.listCollections({ name: collectionName }, { readPreference: 'primary' }).next();
        const indexes = live
            ? await db.collection(collectionName).indexes({ readPreference: 'primary' })
            : [];
        const stageName = `gtrams_restore_stage_${crypto.randomUUID().replace(/-/g, '')}`;
        const stage = await db.createCollection(stageName, copyCollation(live?.options?.collation));
        try {
            for (const index of indexes) {
                if (!index.unique || index.name === '_id_') continue;
                const { name, sparse, partialFilterExpression } = index;
                await stage.createIndex(index.key, {
                    name,
                    unique: true,
                    ...(sparse === true && { sparse }),
                    ...(partialFilterExpression && { partialFilterExpression }),
                    ...copyCollation(index.collation)
                });
            }
            const batchSize = 500;
            for (let i = 0; i < records.length; i += batchSize) {
                await stage.insertMany(records.slice(i, i + batchSize), { ordered: true });
            }
        } catch (err) {
            if (err.code === 11000) {
                throw restoreError(400, `Invalid backup payload: unique index conflict in "${key}".`);
            }
            throw err;
        } finally {
            await stage.drop();
        }
    }
}

/**
 * Restore collections from backup data with coordinated locking, safety pre-snapshot,
 * and full in-memory rollback if any collection mutation fails (H1).
 */
async function restoreFromBackup(backupPayload, { triggeredBy = 'System Admin', onRestored } = {}) {
    const collections = await validateBackupPayload(backupPayload);
    // Collections absent in legacy archives (including payment_ledgers) are left intact.
    const targetEntries = Object.entries(MODELS).filter(([key]) => Object.hasOwn(collections, key));

    const lockOwnerId = await acquireDistributedRestoreLock(triggeredBy);
    const stopHeartbeat = startRestoreLeaseHeartbeat({ _id: RESTORE_LOCK_ID, ownerId: lockOwnerId });
    let compensationIncomplete = false;
    try {
        await stageRestoreCollections(collections, targetEntries);
        await drainRestoreSensitiveWork();
        await pinRestoreLock(lockOwnerId);
        stopHeartbeat();

        // Step 1: Create a safety pre-restore backup first (must succeed and exist on disk before any deleteMany)
        console.log('[BackupService] Creating pre-restore safety snapshot...');
        const safetySnapshot = await createBackupFile({
            isAutomated: false,
            triggeredBy,
            notes: 'Pre-Restore Emergency Safety Snapshot'
        });
        if (!safetySnapshot || !safetySnapshot.success || !safetySnapshot.filePath || !fs.existsSync(safetySnapshot.filePath)) {
            throw new Error('Pre-restore safety snapshot failed to verify on disk. Aborting restore.');
        }

        // Step 2: Capture full raw in-memory rollback copy of every target collection before any destructive mutation
        const rollbackSnapshot = {};
        for (const [key, model] of targetEntries) {
            if (model.collection && typeof model.collection.find === 'function') {
                rollbackSnapshot[key] = await model.collection.find({}).toArray();
            } else {
                rollbackSnapshot[key] = await model.find().lean();
            }
        }

        const recoveryRecord = await SystemLock.collection.updateOne(
            pinnedRestoreFilter(lockOwnerId),
            {
                $set: {
                    restorePhase: 'cutover',
                    recoverySnapshot: safetySnapshot.filename,
                    recoveryChecksum: safetySnapshot.manifest.checksum,
                    recoveryCollections: targetEntries.map(([key]) => key)
                }
            },
            MAJORITY_WRITE
        );
        if (recoveryRecord.matchedCount !== 1) {
            throw restoreError(503, 'Database restore ownership was lost before cutover.');
        }

        let restoredCounts;
        const mutatedEntries = [];

        // Step 3: Clear and populate each collection with notification hooks suppressed ONLY for this async restore context
        // If ANY collection delete/insert fails, automatically roll back all mutated collections to prior live state.
        try {
            restoredCounts = await writeRestoreCollections(collections, targetEntries, mutatedEntries);
        } catch (cutoverErr) {
            compensationIncomplete = true;
            console.error('[BackupService] Restore cutover failed; rolling back mutated collections:', cutoverErr.message);
            const rollbackErrors = [];
            await Notification.runWithNotificationHooksSuppressed(async () => {
                for (const [key, model] of [...mutatedEntries].reverse()) {
                    try {
                        await model.deleteMany({}, MAJORITY_WRITE);
                        const priorDocs = rollbackSnapshot[key] || [];
                        if (priorDocs.length > 0) {
                            const BATCH_SIZE = 500;
                            for (let i = 0; i < priorDocs.length; i += BATCH_SIZE) {
                                const batch = priorDocs.slice(i, i + BATCH_SIZE);
                                if (model.collection && typeof model.collection.insertMany === 'function') {
                                    await model.collection.insertMany(batch, { ordered: true, ...MAJORITY_WRITE });
                                } else {
                                    await model.insertMany(batch, { ordered: true, ...MAJORITY_WRITE });
                                }
                            }
                        }
                    } catch (rbErr) {
                        console.error(`[BackupService] CRITICAL: Rollback failed for collection "${key}":`, rbErr.message);
                        rollbackErrors.push(`${key}: ${rbErr.message}`);
                    }
                }
            });

            if (rollbackErrors.length > 0) {
                console.error(
                    '[BackupService] Restore remains pinned for offline recovery:',
                    lockOwnerId,
                    safetySnapshot.filename
                );
                throw new Error(`Restore failed (${cutoverErr.message}) and rollback encountered errors (${rollbackErrors.join('; ')}). Safety snapshot: ${safetySnapshot.filename}`);
            }
            compensationIncomplete = false;
            throw new Error(`Restore failed and live data was rolled back cleanly: ${cutoverErr.message}`);
        }

        // Log the restoration event
        await AuditLog.create({
            action: 'DATABASE_RESTORE_COMPLETED',
            targetType: 'General',
            details: {
                triggeredBy,
                safetySnapshot: safetySnapshot.filename,
                restoredCollections: Object.keys(restoredCounts).length,
                restoredCounts,
                backupManifest: backupPayload.manifest
            }
        }).catch((err) => {
            console.error('[BackupService] Failed to record restore audit log:', err.message);
        });

        if (onRestored) await onRestored(restoredCounts);

        return {
            success: true,
            message: 'Database successfully restored from archive.',
            restoredCounts,
            manifest: backupPayload.manifest
        };
    } finally {
        stopHeartbeat();
        if (!compensationIncomplete) {
            await releaseSystemLock({ _id: RESTORE_LOCK_ID, ownerId: lockOwnerId });
        }
    }
}

/**
 * Offline recovery only. Stop all backend workers before calling this function.
 * The caller must have direct database access and the current pinned owner ID.
 */
async function recoverPinnedRestore({ ownerId, triggeredBy = 'Offline administrator' } = {}) {
    requireRestoreDatabase();
    if (typeof ownerId !== 'string' || !ownerId) {
        throw restoreError(400, 'The pinned restore owner ID is required for recovery.');
    }
    const filter = pinnedRestoreFilter(ownerId);
    const pinned = await SystemLock.collection.findOne(filter, { readPreference: 'primary' });
    if (!pinned || !['preparing', 'cutover'].includes(pinned.restorePhase)) {
        throw restoreError(409, 'The pinned restore owner or phase changed. Inspect the lock before retrying.');
    }

    let collections;
    let targetEntries = [];
    if (pinned.restorePhase === 'cutover') {
        const { recoverySnapshot, recoveryChecksum, recoveryCollections } = pinned;
        if (typeof recoverySnapshot !== 'string' || recoverySnapshot !== path.basename(recoverySnapshot) ||
            !recoveryChecksum || !Array.isArray(recoveryCollections) || recoveryCollections.length === 0) {
            throw new Error('Pinned restore recovery metadata is incomplete.');
        }

        const snapshotPath = path.join(BACKUP_DIR, recoverySnapshot);
        let archive;
        if (fs.existsSync(snapshotPath)) {
            archive = fs.readFileSync(snapshotPath);
        } else {
            const stored = await BackupArchive.findOne({ filename: recoverySnapshot }).select('data');
            if (!stored?.data) throw new Error('The pinned restore safety snapshot is unavailable.');
            archive = Buffer.from(stored.data);
        }

        const backup = parseBackupBuffer(archive);
        if (backup.manifest.checksum !== recoveryChecksum) {
            throw new Error('The safety snapshot checksum does not match the pinned restore.');
        }
        const recoveryKeys = new Set(recoveryCollections);
        targetEntries = Object.entries(MODELS).filter(([key]) => recoveryKeys.has(key));
        if (targetEntries.length !== recoveryKeys.size ||
            targetEntries.some(([key]) => !Array.isArray(backup.collections[key]))) {
            throw new Error('The safety snapshot is missing a collection required for recovery.');
        }
        collections = Object.fromEntries(targetEntries.map(([key]) => [key, backup.collections[key]]));
        // The complete archive was verified above. Validate the selected documents before cutover.
        collections = await validateBackupPayload({ manifest: { system: 'G-TRAMS' }, collections });
    }

    const recoveryOwnerId = crypto.randomUUID();
    const claim = await SystemLock.collection.updateOne(
        filter,
        { $set: { ownerId: recoveryOwnerId } },
        MAJORITY_WRITE
    );
    if (claim.matchedCount !== 1) {
        throw restoreError(409, 'Another administrator claimed the pinned restore. Inspect the lock before retrying.');
    }

    try {
        await drainRestoreSensitiveWork();
        if (collections) await stageRestoreCollections(collections, targetEntries);
        const restoredCounts = collections ? await writeRestoreCollections(collections, targetEntries) : {};
        for (const [key, model] of targetEntries) {
            if (await model.countDocuments() !== restoredCounts[key]) {
                throw new Error(`Recovery verification failed for collection "${key}".`);
            }
        }
        await AuditLog.create({
            action: 'DATABASE_RESTORE_RECOVERED',
            targetType: 'General',
            details: { triggeredBy, safetySnapshot: pinned.recoverySnapshot, restoredCounts }
        });
        const released = await SystemLock.deleteOne(pinnedRestoreFilter(recoveryOwnerId), MAJORITY_WRITE);
        if (released.deletedCount !== 1) throw new Error('Recovery lock ownership changed before release.');
        return { success: true, restoredCounts };
    } catch (err) {
        console.error('[BackupService] Offline recovery did not complete. Inspect pinned owner:', recoveryOwnerId);
        throw err;
    }
}

/**
 * Delete a specific backup file
 */
async function deleteBackupFile(filename) {
    ensureBackupDir();
    // Prevent path traversal
    const safeName = path.basename(filename);
    const fullPath = path.join(BACKUP_DIR, safeName);

    // Propagate DB deletion failures so deleted backups cannot silently resurrect from BackupArchive
    await BackupArchive.deleteOne({ filename: safeName });

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
    return { success: true, filename: safeName };
}

/**
 * Sync persisted MongoDB backup archives to local disk & auto-create baseline snapshot if empty
 */
async function ensurePersistentBackups({ createBaseline = true } = {}) {
    if (process.env.NODE_ENV === 'test') return;
    try {
        ensureBackupDir();
        const storedArchives = await BackupArchive.find().sort({ createdAt: -1 }).limit(12).lean();
        for (const arch of storedArchives) {
            if (!arch.filename || !arch.data) continue;
            const safeName = path.basename(arch.filename);
            const fullPath = path.join(BACKUP_DIR, safeName);
            if (!fs.existsSync(fullPath)) {
                const buf = Buffer.isBuffer(arch.data)
                    ? arch.data
                    : (arch.data.buffer ? Buffer.from(arch.data.buffer) : Buffer.from(arch.data));
                fs.writeFileSync(fullPath, buf);
                if (arch.createdAt) {
                    const mtime = new Date(arch.createdAt);
                    fs.utimesSync(fullPath, mtime, mtime);
                }
            }
        }

        if (createBaseline && listBackupFiles().length === 0) {
            await createBackupFile({
                isAutomated: true,
                triggeredBy: 'System Auto-Baseline',
                notes: 'Initial automated baseline snapshot'
            });
        }
    } catch (err) {
        console.warn('[BackupService] ensurePersistentBackups warning:', err.message);
    }
}

module.exports = {
    BACKUP_DIR,
    RESTORE_LOCK_ID,
    SystemLock,
    isRestoreInProgress,
    beginRestoreSensitiveWork,
    assembleBackupPayload,
    encodeBackupPayload,
    validateBackupPayload,
    createBackupFile,
    listBackupFiles,
    parseBackupBuffer,
    restoreFromBackup,
    recoverPinnedRestore,
    deleteBackupFile,
    pruneOldAutomatedBackups,
    ensurePersistentBackups
};
