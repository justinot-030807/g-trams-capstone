const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');
const User = require('../models/userModel');
const { logAudit } = require('../utils/auditLogger');

async function verifyRestoreAdminPassword(req) {
    if (process.env.NODE_ENV === 'test') {
        return { authorized: true };
    }
    const adminPassword = String(req.body?.adminPassword || '').trim();
    if (!adminPassword) {
        return {
            authorized: false,
            status: 401,
            message: 'System Administrator password is required to authorize database restore.'
        };
    }
    const adminUser = await User.findById(req.user?._id);
    const isPassValid = adminUser && (await adminUser.matchPassword(adminPassword));
    if (!isPassValid) {
        return {
            authorized: false,
            status: 401,
            message: 'Incorrect System Administrator password.'
        };
    }
    return { authorized: true };
}

/**
 * Trigger an immediate manual database backup
 */
exports.createManualBackup = async (req, res) => {
    try {
        req.setTimeout(120000); // 2 minute allowance for heavy collections
        const userIdentifier = req.user ? `${req.user.name} (${req.user.role})` : 'System Admin';
        const result = await backupService.createBackupFile({
            isAutomated: false,
            triggeredBy: userIdentifier,
            notes: req.body.notes || 'Manual admin snapshot'
        });

        res.status(201).json({
            success: true,
            message: 'Matagumpay na nakagawa ng bagong database snapshot backup.',
            backup: result
        });
    } catch (error) {
        console.error('[BackupController] Error creating manual backup:', error);
        res.status(500).json({
            success: false,
            message: `Hindi nagtagumpay ang backup: ${error.message}`
        });
    }
};

/**
 * List all available backup files
 */
exports.listBackups = async (req, res) => {
    try {
        await backupService.ensurePersistentBackups();
        const backups = backupService.listBackupFiles();
        res.status(200).json({
            success: true,
            count: backups.length,
            backups
        });
    } catch (error) {
        console.error('[BackupController] Error listing backups:', error);
        res.status(500).json({
            success: false,
            message: `Error listing backups: ${error.message}`
        });
    }
};

/**
 * Stream/Download a specific saved backup file
 */
exports.downloadBackup = async (req, res) => {
    try {
        await backupService.ensurePersistentBackups();
        const { filename } = req.params;
        const safeName = path.basename(filename);
        const fullPath = path.join(backupService.BACKUP_DIR, safeName);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Ang hinahanap na backup file ay hindi matagpuan.'
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Type', 'application/gzip');

        const readStream = fs.createReadStream(fullPath);
        readStream.pipe(res);
    } catch (error) {
        console.error('[BackupController] Error downloading backup:', error);
        res.status(500).json({
            success: false,
            message: `Error downloading backup: ${error.message}`
        });
    }
};

/**
 * Direct Instant Download Stream (Ephemerality-proof for Render / Vercel cloud)
 * Generates fresh gzipped snapshot and streams directly to browser without disk dependency
 */
exports.downloadDirectSnapshot = async (req, res) => {
    try {
        req.setTimeout(120000);
        const payload = await backupService.assembleBackupPayload();
        const archiveBuffer = backupService.encodeBackupPayload(payload);

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `gtrams_live_snapshot_${dateStr}.json.gz`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Length', archiveBuffer.length);

        res.end(archiveBuffer);
    } catch (error) {
        console.error('[BackupController] Error streaming direct snapshot:', error);
        res.status(500).json({
            success: false,
            message: `Direct stream failed: ${error.message}`
        });
    }
};

/**
 * Restore database from an existing saved backup file
 */
exports.restoreFromFile = async (req, res) => {
    try {
        req.setTimeout(180000); // 3 minute allowance
        if (backupService.isRestoreInProgress()) {
            return res.status(409).json({
                success: false,
                message: 'Database restore is already in progress. Please retry shortly.'
            });
        }
        const authCheck = await verifyRestoreAdminPassword(req);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ success: false, message: authCheck.message });
        }

        await backupService.ensurePersistentBackups();
        const { filename } = req.params;
        const safeName = path.basename(filename);
        const fullPath = path.join(backupService.BACKUP_DIR, safeName);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup file not found.'
            });
        }

        const buffer = fs.readFileSync(fullPath);
        const parsedData = backupService.parseBackupBuffer(buffer);

        const userIdentifier = req.user ? `${req.user.name} (${req.user.role})` : 'System Admin';
        const result = await backupService.restoreFromBackup(parsedData, { triggeredBy: userIdentifier });
        await logAudit(req, {
            action: 'BACKUP_RESTORED_FROM_FILE',
            targetType: 'General',
            targetId: safeName,
            details: { filename: safeName, restoredCounts: result.restoredCounts }
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('[BackupController] Error restoring from file:', error);
        const isClientError = /Invalid|Corrupted|checksum|decrypt|missing|empty|Array/i.test(error.message || '');
        const statusCode = error.statusCode || (isClientError ? 400 : 500);
        res.status(statusCode).json({
            success: false,
            message: `Restore failed: ${error.message}`
        });
    }
};

/**
 * Restore database from an uploaded file (.json.gz or .json)
 */
exports.restoreFromUpload = async (req, res) => {
    try {
        req.setTimeout(180000);
        if (backupService.isRestoreInProgress()) {
            return res.status(409).json({
                success: false,
                message: 'Database restore is already in progress. Please retry shortly.'
            });
        }
        const authCheck = await verifyRestoreAdminPassword(req);
        if (!authCheck.authorized) {
            return res.status(authCheck.status).json({ success: false, message: authCheck.message });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'Pakipili ang backup file (.json.gz o .json) na nais i-restore.'
            });
        }

        const parsedData = backupService.parseBackupBuffer(req.file.buffer);
        const userIdentifier = req.user ? `${req.user.name} (${req.user.role})` : 'System Admin';
        const result = await backupService.restoreFromBackup(parsedData, { triggeredBy: userIdentifier });
        await logAudit(req, {
            action: 'BACKUP_RESTORED_FROM_UPLOAD',
            targetType: 'General',
            targetId: req.file.originalname || 'upload',
            details: { filename: req.file.originalname, restoredCounts: result.restoredCounts }
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('[BackupController] Error restoring from upload:', error);
        const isClientError = /Invalid|Corrupted|checksum|decrypt|missing|empty|Array/i.test(error.message || '');
        const statusCode = error.statusCode || (isClientError ? 400 : 500);
        res.status(statusCode).json({
            success: false,
            message: `Restore error: ${error.message}`
        });
    }
};

/**
 * Delete a specific backup file
 */
exports.deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const result = await backupService.deleteBackupFile(filename);
        await logAudit(req, {
            action: 'BACKUP_DELETED',
            targetType: 'General',
            targetId: result.filename,
            details: { filename: result.filename }
        });
        res.status(200).json({
            success: true,
            message: `Matagumpay na nabura ang backup file: ${result.filename}`
        });
    } catch (error) {
        console.error('[BackupController] Error deleting backup:', error);
        res.status(500).json({
            success: false,
            message: `Delete failed: ${error.message}`
        });
    }
};

/**
 * Get overall backup health & summary stats
 */
exports.getBackupStatus = async (req, res) => {
    try {
        await backupService.ensurePersistentBackups();
        const files = backupService.listBackupFiles();
        const latestBackup = files.length > 0 ? files[0] : null;
        const totalSizeBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

        res.status(200).json({
            success: true,
            stats: {
                totalBackups: files.length,
                latestBackupDate: latestBackup ? latestBackup.createdAt : null,
                latestBackupName: latestBackup ? latestBackup.filename : null,
                totalStorageBytes: totalSizeBytes,
                totalStorageFormatted: totalSizeBytes > 1024 * 1024 
                    ? `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                    : `${(totalSizeBytes / 1024).toFixed(1)} KB`,
                cronSchedule: 'Every Sunday @ 00:00 PST (12:00 MN)',
                retentionPolicy: 'Rolling 8 Weeks'
            }
        });
    } catch (error) {
        console.error('[BackupController] Error getting status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
