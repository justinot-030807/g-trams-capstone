# 3-Tier OCR & Document Verification

Links: [[00-index]] · [[architecture]] · [[decisions]] · [[modules/franchise-lifecycle]]
Tags: #core #ocr #api #security

## Scope & Responsibilities
- Extracts and cross-checks LTO CR, LTO OR, Driver's License (front/back), Barangay Clearance, Cedula, and TODA Rosters with zero-latency memory uploads (`multer.memoryStorage()`).
- Enforces RA 10173 / LGU exclusions (never extracts blood type, document payment amounts, or signatory signatures) and rejects invalid/non-official images.

## Key Files
- `backend/src/services/documentVerificationService.js` — Tier 1 Google Gen AI (`@google/genai` Gemini cascade), Tier 2 local offline `tesseract.js` regex parsers, Tier 3 `OCR.space` Engine 2 backup.
- `backend/src/utils/nameMatcher.js` — Lenient Philippine name comparison (inverted, middle initial, compound names).
- `backend/src/config/cloudinary.js` — Production upload storage (`GTRAMS_Documents`), MIME/extension validation, and magic-byte verification.
- `frontend/src/components/operator/DocumentScannerModal.jsx`, `DocumentUploadCard.jsx`, `DocumentPreviewModal.jsx`, `frontend/src/utils/imageCompressor.js`.
