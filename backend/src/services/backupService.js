const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const AuditLog = require('../models/auditLogModel');
const { ChatMessage, ChatThread } = require('../models/chatModel');

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

const BACKUP_DIR = path.resolve(__dirname, '../../backups');

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
                    delete sanitized.passwordResetToken;
                    return sanitized;
                });
            }

            collectionsData[key] = docs;
            counts[key] = docs.length;
            totalDocuments += docs.length;
        } catch (err) {
            console.warn(`[BackupService] Warning reading collection ${key}:`, err.message);
            collectionsData[key] = [];
            counts[key] = 0;
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
        counts
    };

    return { manifest, collections: collectionsData };
}

/**
 * Prune automated backups keeping only the latest 8 (Rolling retention)
 */
function pruneOldAutomatedBackups(keepCount = 8) {
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
            for (const file of toDelete) {
                fs.unlinkSync(file.filePath);
                console.log(`[BackupService] Pruned old automated backup: ${file.name}`);
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
    const jsonString = JSON.stringify(payload);
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const typePrefix = isAutomated ? 'auto' : 'manual';
    const filename = `gtrams_backup_${typePrefix}_${dateStr}.json.gz`;
    const fullPath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(fullPath, compressedBuffer);

    // Apply rolling retention for automated backups
    if (isAutomated) {
        pruneOldAutomatedBackups(8);
    }

    // Record audit event
    try {
        await AuditLog.create({
            action: isAutomated ? 'AUTOMATED_WEEKLY_BACKUP_COMPLETED' : 'MANUAL_BACKUP_CREATED',
            targetType: 'General',
            details: {
                filename,
                sizeBytes: compressedBuffer.length,
                totalDocuments: payload.manifest.totalDocuments,
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
        sizeBytes: compressedBuffer.length,
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
    let rawString = null;
    try {
        // Try decompressing as gzip first
        const decompressed = zlib.gunzipSync(buffer, { maxOutputLength: 50 * 1024 * 1024 });
        rawString = decompressed.toString('utf-8');
    } catch {
        // Fallback to plain UTF-8 JSON if not gzipped
        rawString = buffer.toString('utf-8');
    }

    const parsed = JSON.parse(rawString);
    if (!parsed || !parsed.manifest || !parsed.collections) {
        throw new Error('Invalid G-TRAMS backup structure: manifest or collections missing.');
    }
    return parsed;
}

/**
 * Restore collections from backup data with safety pre-snapshot
 */
async function restoreFromBackup(backupPayload, { triggeredBy = 'System Admin' } = {}) {
    if (!backupPayload.collections) {
        throw new Error('No collections found in backup payload.');
    }

    // Step 1: Create a safety pre-restore backup first
    console.log('[BackupService] Creating pre-restore safety snapshot...');
    await createBackupFile({
        isAutomated: false,
        triggeredBy,
        notes: 'Pre-Restore Emergency Safety Snapshot'
    }).catch(e => console.warn('[BackupService] Safety snapshot note:', e.message));

    const restoredCounts = {};
    const { collections } = backupPayload;

    // Step 2: Clear and populate each collection
    for (const [key, model] of Object.entries(MODELS)) {
        const records = collections[key];
        if (Array.isArray(records)) {
            // Delete existing records
            await model.deleteMany({});
            
            if (records.length > 0) {
                // Insert in batches of 500 to prevent payload limits
                const BATCH_SIZE = 500;
                for (let i = 0; i < records.length; i += BATCH_SIZE) {
                    const batch = records.slice(i, i + BATCH_SIZE);
                    await model.insertMany(batch, { ordered: false });
                }
            }
            restoredCounts[key] = records.length;
        }
    }

    // Log the restoration event
    await AuditLog.create({
        action: 'DATABASE_RESTORE_COMPLETED',
        targetType: 'General',
        details: {
            triggeredBy,
            restoredCollections: Object.keys(restoredCounts).length,
            restoredCounts,
            backupManifest: backupPayload.manifest
        }
    }).catch(() => {});

    return {
        success: true,
        message: 'Database successfully restored from archive.',
        restoredCounts,
        manifest: backupPayload.manifest
    };
}

/**
 * Delete a specific backup file
 */
function deleteBackupFile(filename) {
    ensureBackupDir();
    // Prevent path traversal
    const safeName = path.basename(filename);
    const fullPath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(fullPath)) {
        throw new Error('Backup file not found.');
    }

    fs.unlinkSync(fullPath);
    return { success: true, filename: safeName };
}

module.exports = {
    BACKUP_DIR,
    assembleBackupPayload,
    createBackupFile,
    listBackupFiles,
    parseBackupBuffer,
    restoreFromBackup,
    deleteBackupFile,
    pruneOldAutomatedBackups
};
