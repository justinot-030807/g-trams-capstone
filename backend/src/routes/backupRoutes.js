const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createManualBackup,
    listBackups,
    getBackupStatus,
    downloadBackup,
    downloadDirectSnapshot,
    restoreFromFile,
    restoreFromUpload,
    deleteBackup
} = require('../controllers/backupController');

// Multer memory storage for backup upload (up to 50MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

// All backup routes are strictly restricted to Admin / System Admin
router.use(protect);
router.use(authorize('admin', 'system_admin'));

router.post('/create', createManualBackup);
router.get('/list', listBackups);
router.get('/status', getBackupStatus);
router.get('/direct-download', downloadDirectSnapshot);
router.get('/download/:filename', downloadBackup);
router.post('/restore-file/:filename', restoreFromFile);
router.post('/restore-upload', upload.single('backupFile'), restoreFromUpload);
router.delete('/:filename', deleteBackup);

module.exports = router;
