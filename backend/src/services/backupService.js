const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditLog = require('../models/auditLogModel');
const Notification = require('../models/notificationModel');
const { ChatMessage, ChatThread } = require('../models/chatModel');

const ENCRYPTED_MAGIC = Buffer.from('GTRAMS_ENC_V1\n', 'ascii');
let restoreLock = Promise.resolve();

function withRestoreLock(fn) {
    const previous = restoreLock;
    let release;
    restoreLock = new Promise((resolve) => {
        release = resolve;
    });
    return previous.then(() => fn()).finally(() => release());
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
    push_subscriptions: require('../models/pushSubscriptionModel')
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

    for (const [key, model] of Object.entries(MODELS)) {
        const records = collections[key];
        if (!Array.isArray(records)) continue;
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
        }
    }
}

/**
 * Restore collections from backup data with safety pre-snapshot
 */
async function restoreFromBackup(backupPayload, { triggeredBy = 'System Admin' } = {}) {
    return await withRestoreLock(async () => {
        // Step 0: Validate archive integrity, collection keys, and every document shape BEFORE any deleteMany
        await validateBackupPayload(backupPayload);

        const { collections } = backupPayload;

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

        const restoredCounts = {};

        // Step 2: Clear and populate each collection with notification hooks suppressed ONLY for this async restore context
        await Notification.runWithNotificationHooksSuppressed(async () => {
            for (const [key, model] of Object.entries(MODELS)) {
                const records = collections[key];
                if (Array.isArray(records)) {
                    await model.deleteMany({});

                    if (records.length > 0) {
                        const BATCH_SIZE = 500;
                        for (let i = 0; i < records.length; i += BATCH_SIZE) {
                            const batch = records.slice(i, i + BATCH_SIZE);
                            await model.insertMany(batch, { ordered: false });
                        }
                    }
                    restoredCounts[key] = records.length;
                }
            }
        });

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

        return {
            success: true,
            message: 'Database successfully restored from archive.',
            restoredCounts,
            manifest: backupPayload.manifest
        };
    });
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
async function ensurePersistentBackups() {
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

        const currentFiles = listBackupFiles();
        if (currentFiles.length === 0) {
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
    assembleBackupPayload,
    encodeBackupPayload,
    validateBackupPayload,
    createBackupFile,
    listBackupFiles,
    parseBackupBuffer,
    restoreFromBackup,
    deleteBackupFile,
    pruneOldAutomatedBackups,
    ensurePersistentBackups
};
