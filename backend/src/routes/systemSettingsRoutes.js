const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/systemSettingsController');

router.get('/', getSettings);
router.put('/', protect, authorize('admin', 'administrator'), updateSettings);

module.exports = router;
