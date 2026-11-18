const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getServerTime, getSettings, updateSettings, getSystemHealth } = require('../controllers/systemSettingsController');

router.get('/time', getServerTime);
router.get('/', getSettings);
router.get('/health', protect, authorize('system_admin', 'admin'), getSystemHealth);
router.put('/', protect, authorize('system_admin', 'admin'), updateSettings);

module.exports = router;
