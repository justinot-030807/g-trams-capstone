const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const backupService = require('../services/backupService');

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
        const jsonString = JSON.stringify(payload);
        const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `gtrams_live_snapshot_${dateStr}.json.gz`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Length', compressedBuffer.length);

        res.end(compressedBuffer);
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

        res.status(200).json(result);
    } catch (error) {
        console.error('[BackupController] Error restoring from file:', error);
        res.status(500).json({
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
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'Pakipili ang backup file (.json.gz o .json) na nais i-restore.'
            });
        }

        const parsedData = backupService.parseBackupBuffer(req.file.buffer);
        const userIdentifier = req.user ? `${req.user.name} (${req.user.role})` : 'System Admin';
        const result = await backupService.restoreFromBackup(parsedData, { triggeredBy: userIdentifier });

        res.status(200).json(result);
    } catch (error) {
        console.error('[BackupController] Error restoring from upload:', error);
        res.status(500).json({
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
        const result = backupService.deleteBackupFile(filename);
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
