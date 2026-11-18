const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { validateMagicBytes, verifyUploadedFileMagicBytes } = require('../config/cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_IMAGE_MIME_MAP = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
};

// Multer -> Cloudinary (local temp storage in test environment)
const storage = process.env.NODE_ENV === 'test'
    ? multer.diskStorage({
        destination: (req, file, cb) => {
            const os = require('os');
            cb(null, os.tmpdir());
        },
        filename: (req, file, cb) => {
            cb(null, `test_profile_${Date.now()}_${path.basename(file.originalname || 'avatar')}`);
        }
    })
    : new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'gtrams_profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
        }
    });

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const mime = String(file.mimetype || '').toLowerCase().trim();
        const ext = path.extname(String(file.originalname || '')).toLowerCase();
        const allowedExts = ALLOWED_IMAGE_MIME_MAP[mime];
        if (allowedExts && allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, and WebP images with matching extensions are allowed.'), false);
        }
    }
});

upload.validateMagicBytes = validateMagicBytes;
upload.verifyUploadedFileMagicBytes = verifyUploadedFileMagicBytes;
upload.ALLOWED_IMAGE_MIME_MAP = ALLOWED_IMAGE_MIME_MAP;

module.exports = upload;
