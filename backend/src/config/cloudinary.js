// Cloudinary configuration for document uploads
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_DOC_MIME_MAP = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf']
};

function validateMagicBytes(buffer, mimetype) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
        return false;
    }
    const mime = String(mimetype || '').toLowerCase().trim();
    if (mime === 'image/jpeg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mime === 'image/png') {
        return (
            buffer.length >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a
        );
    }
    if (mime === 'image/webp') {
        return (
            buffer.length >= 12 &&
            buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
            buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
    }
    if (mime === 'application/pdf') {
        return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    }
    return false;
}

function verifyUploadedFileMagicBytes(file) {
    if (!file) return false;
    if (Buffer.isBuffer(file.buffer)) {
        return validateMagicBytes(file.buffer, file.mimetype);
    }
    if (file.path && fs.existsSync(file.path)) {
        const fd = fs.openSync(file.path, 'r');
        try {
            const header = Buffer.alloc(16);
            const bytesRead = fs.readSync(fd, header, 0, 16, 0);
            return validateMagicBytes(header.subarray(0, bytesRead), file.mimetype);
        } finally {
            fs.closeSync(fd);
        }
    }
    return false;
}

const storage = process.env.NODE_ENV === 'test'
    ? multer.diskStorage({
        destination: (req, file, cb) => {
            const os = require('os');
            cb(null, os.tmpdir());
        },
        filename: (req, file, cb) => {
            cb(null, `test_${Date.now()}_${path.basename(file.originalname || 'file')}`);
        }
    })
    : new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'GTRAMS_Documents',
            allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp']
        }
    });

const uploadOptions = {
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max for documents
        fields: 40,
        fieldSize: 64 * 1024,
        files: 12,
        parts: 55
    },
    fileFilter: (req, file, cb) => {
        const mime = String(file.mimetype || '').toLowerCase().trim();
        const ext = path.extname(String(file.originalname || '')).toLowerCase();
        const allowedExts = ALLOWED_DOC_MIME_MAP[mime];
        if (allowedExts && allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, WebP, and PDF files with matching extensions are allowed.'), false);
        }
    }
};

const upload = multer(uploadOptions);

// The full application includes vehicle, driver, and document metadata in one multipart submission.
upload.franchiseApplication = multer({
    ...uploadOptions,
    limits: { ...uploadOptions.limits, fields: 80, parts: 93 }
});

upload.validateMagicBytes = validateMagicBytes;
upload.verifyUploadedFileMagicBytes = verifyUploadedFileMagicBytes;
upload.ALLOWED_DOC_MIME_MAP = ALLOWED_DOC_MIME_MAP;

module.exports = upload;
