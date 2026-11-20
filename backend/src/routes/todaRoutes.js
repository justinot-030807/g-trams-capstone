const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const TodaSubmission = require('../models/todaSubmission'); 
const TodaRemovalRequest = require('../models/todaRemovalRequest');
const TodaRoster = require('../models/todaModel');
const User = require('../models/userModel');
const Franchise = require('../models/franchiseModel');
const { protect, authorize } = require('../middleware/authMiddleware');
const { extractTodaRosterFromDocument } = require('../services/documentVerificationService');
const { isNameMatch } = require('../utils/nameMatcher');
const { syncSubmissionToRoster, getNextBodyNumber, addIndividualMember } = require('../controllers/todaController');
const { logAudit } = require('../utils/auditLogger');

// Ensure removal requests persist exact roster/submission target IDs without widening deletion to same-name rows (M9)
(function ensureRemovalRequestTargetPaths() {
    const extraPaths = {
        targetRosterId: { type: mongoose.Schema.Types.ObjectId, ref: 'TodaRoster', default: null },
        targetSubmissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'todaSubmission', default: null },
        targetSubmissionMemberId: { type: String, default: '' }
    };
    const toAdd = {};
    for (const [field, def] of Object.entries(extraPaths)) {
        if (!TodaRemovalRequest.schema.path(field)) {
            toAdd[field] = def;
        }
    }
    if (Object.keys(toAdd).length > 0) {
        TodaRemovalRequest.schema.add(toAdd);
        for (const field of Object.keys(toAdd)) {
            if (!Object.prototype.hasOwnProperty.call(TodaRemovalRequest.prototype, field)) {
                Object.defineProperty(TodaRemovalRequest.prototype, field, {
                    configurable: true,
                    enumerable: true,
                    get() { return this.get(field); },
                    set(v) { return this.set(field, v); }
                });
            }
        }
    }
})();

const upload = require('../config/cloudinary');

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }
});

// Auto-generate next unique body number for a TODA (strictly no duplicates)
router.get('/rosters', protect, authorize('bplo_staff', 'admin', 'system_admin'), async (req, res) => { try { const rosters = await TodaRoster.find().sort({ todaAssociation: 1, bodyNumber: 1 }); res.status(200).json(rosters); } catch (error) { res.status(500).json({ message: 'Error fetching TODA rosters' }); } });
router.get('/next-body-number', protect, authorize('bplo_staff', 'toda president', 'toda_president', 'admin', 'system_admin'), getNextBodyNumber);

// Register an individual member (when only one operator joins a TODA)
router.post('/members/individual', protect, authorize('bplo_staff', 'toda president', 'toda_president'), addIndividualMember);

// Real-time AI OCR scanning for roster documents (zero Cloudinary delay, memory buffer)
router.post('/scan-roster', protect, authorize('bplo_staff', 'toda president', 'toda_president'), memoryUpload.single('file'), async (req, res) => {
    try {
        let input = null;

        if (req.file && req.file.buffer) {
            let mType = req.file.mimetype || 'image/jpeg';
            if (req.file.originalname && req.file.originalname.toLowerCase().endsWith('.pdf')) {
                mType = 'application/pdf';
            }
            input = {
                base64Data: req.file.buffer.toString('base64'),
                mimeType: mType
            };
        } else if (req.body.base64) {
            let base64Data = req.body.base64;
            let mType = req.body.mimeType || 'image/jpeg';
            if (base64Data.includes(',')) {
                const parts = base64Data.split(',');
                const match = parts[0].match(/:(.*?);/);
                if (match) mType = match[1];
                base64Data = parts[1];
            }
            input = { base64Data, mimeType: mType };
        } else if (req.body.fileUrl) {
            input = req.body.fileUrl;
        }

        if (!input) {
            return res.status(400).json({ success: false, message: 'No file received for document scanning.' });
        }

        const ocr = await extractTodaRosterFromDocument(input);
        if (!ocr || !Array.isArray(ocr.members) || ocr.members.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No member records detected in document. Please verify the document format or image clarity.',
                extractedMembers: [],
                extractedCount: 0,
                ocrNotes: ocr?.notes || 'No members identified'
            });
        }

        const members = ocr.members.map(m => ({
            name: (m.name || m.operatorName || (typeof m === 'string' ? m : '')).trim(),
            operatorName: (m.operatorName || m.name || (typeof m === 'string' ? m : '')).trim(),
            bodyNumber: (m.bodyNumber || m.unitNo || '').trim(),
            unitNo: (m.bodyNumber || m.unitNo || '').trim(),
            confidence: 0.95
        })).filter(m => Boolean(m.name || m.operatorName));

        return res.status(200).json({
            success: true,
            extractedMembers: members,
            extractedCount: members.length,
            todaAssociation: ocr.todaAssociation || req.user.todaAssociation || '',
            documentTitle: ocr.documentTitle || '',
            ocrNotes: ocr.notes || ''
        });
    } catch (err) {
        console.error('Error in /scan-roster:', err);
        res.status(500).json({ success: false, message: 'Server error while scanning roster document.' });
    }
});

// Upload member list (TODA President) with AI OCR Roster Parsing
router.post('/upload', protect, authorize('bplo_staff', 'toda president', 'toda_president'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        let extractedMembers = [];
        let extractedCount = 0;
        let ocrNotes = '';
        let todaAssociation = req.user.todaAssociation || '';

        // If client already pre-scanned and confirmed members:
        if (req.body.extractedMembers) {
            try {
                const parsed = typeof req.body.extractedMembers === 'string' 
                    ? JSON.parse(req.body.extractedMembers) 
                    : req.body.extractedMembers;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    extractedMembers = parsed.map(m => ({
                        name: (m.name || m.operatorName || (typeof m === 'string' ? m : '')).trim(),
                        operatorName: (m.operatorName || m.name || (typeof m === 'string' ? m : '')).trim(),
                        bodyNumber: (m.bodyNumber || m.unitNo || '').trim(),
                        unitNo: (m.bodyNumber || m.unitNo || '').trim(),
                        plateNo: (m.plateNo || '').trim(),
                        confidence: m.confidence || 0.95
                    })).filter(m => Boolean(m.name || m.operatorName));
                    extractedCount = extractedMembers.length;
                    ocrNotes = req.body.ocrNotes || 'Pre-scanned & verified by TODA President';
                }
            } catch (pErr) {
                console.warn('[TodaRoster] Error parsing client extractedMembers:', pErr.message);
            }
        }

        // Fallback: If not provided by client, run OCR extraction directly on file path
        let ocrError = null;
        if (extractedMembers.length === 0) {
            try {
                const ocr = await extractTodaRosterFromDocument(req.file.path);
                if (ocr && Array.isArray(ocr.members)) {
                    extractedMembers = ocr.members.map(m => ({
                        name: (m.name || m.operatorName || '').trim(),
                        operatorName: (m.operatorName || m.name || '').trim(),
                        bodyNumber: (m.bodyNumber || m.unitNo || '').trim(),
                        unitNo: (m.bodyNumber || m.unitNo || '').trim(),
                        plateNo: (m.plateNo || '').trim(),
                        confidence: 0.95
                    })).filter(m => Boolean(m.name || m.operatorName));
                    extractedCount = extractedMembers.length;
                    ocrNotes = ocr.notes || '';
                    if (ocr.todaAssociation && (!todaAssociation || todaAssociation === 'NON-TODA')) {
                        todaAssociation = ocr.todaAssociation;
                    }
                }
            } catch (ocrErr) {
                ocrError = ocrErr;
                console.warn('[TodaRoster] OCR extraction failed:', ocrErr.message);
            }
        }

        // M9: Never silently save an empty OCR submission as success when OCR fails or extracts 0 valid members
        if (extractedMembers.length === 0) {
            return res.status(422).json({
                success: false,
                ocrFailed: Boolean(ocrError),
                emptyExtraction: true,
                needsManualEntry: true,
                extractedCount: 0,
                extractedMembers: [],
                warning: ocrError
                    ? `AI OCR extraction failed: ${ocrError.message}. Please upload a clearer image/PDF or provide manual member rows before submitting.`
                    : 'No valid member records were detected in the uploaded roster document. Please upload a clearer scan or add manual member rows before submitting.',
                message: ocrError
                    ? `OCR extraction failed (${ocrError.message}). Roster submission was not saved because no valid members were extracted.`
                    : 'No valid members could be extracted from the uploaded document. Please verify the file or provide manual member rows before submitting.'
            });
        }

        const newSubmission = await TodaSubmission.create({
            submittedBy: req.user._id,
            presidentName: req.user.name,
            todaAssociation,
            fileName: req.file.originalname,
            filePath: req.file.path, // Cloudinary URL
            extractedMembers,
            extractedCount,
            ocrNotes
        });

        res.status(201).json({ 
            message: `Roster submitted successfully! ${extractedCount} member(s) recorded.`, 
            submission: newSubmission 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// Get all submissions (BPLO Staff only)
router.get('/submissions', protect, authorize('bplo_staff'), async (req, res) => {
    try {
        const submissions = await TodaSubmission.find().sort({ createdAt: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

// Re-scan an existing submission with AI OCR (BPLO Staff only)
router.put('/submissions/:id/rescan', protect, authorize('bplo_staff'), async (req, res) => {
    try {
        const submission = await TodaSubmission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        if (submission.status === 'Approved') {
            return res.status(400).json({ message: 'Cannot overwrite an already approved TODA roster submission via rescan.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on server.' });
        }

        const expectedUpdatedAt = submission.updatedAt;
        const ocr = await extractTodaRosterFromDocument(submission.filePath);
        if (!ocr || !Array.isArray(ocr.members) || ocr.members.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'Re-scan completed, but no member records could be detected in the document file.',
                submission
            });
        }

        const extractedMembers = ocr.members.map(m => ({
            name: (m.name || m.operatorName || (typeof m === 'string' ? m : '')).trim(),
            operatorName: (m.operatorName || m.name || (typeof m === 'string' ? m : '')).trim(),
            bodyNumber: (m.bodyNumber || m.unitNo || '').trim(),
            unitNo: (m.bodyNumber || m.unitNo || '').trim(),
            plateNo: (m.plateNo || '').trim(),
            confidence: m.confidence || 0.95
        })).filter(m => Boolean(m.name || m.operatorName));

        const updateSet = {
            extractedMembers,
            extractedCount: extractedMembers.length
        };
        if (ocr.notes) updateSet.ocrNotes = ocr.notes;
        if (ocr.todaAssociation && (!submission.todaAssociation || submission.todaAssociation === 'NON-TODA')) {
            updateSet.todaAssociation = ocr.todaAssociation;
        }

        const updatedSubmission = await TodaSubmission.findOneAndUpdate(
            {
                _id: req.params.id,
                status: { $ne: 'Approved' },
                updatedAt: expectedUpdatedAt
            },
            { $set: updateSet },
            { returnDocument: 'after' }
        );

        if (!updatedSubmission) {
            return res.status(409).json({
                success: false,
                message: 'Submission was approved or modified concurrently during re-scan. Please refresh and try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: `Successfully re-scanned! ${extractedMembers.length} members extracted.`,
            submission: updatedSubmission
        });
    } catch (err) {
        console.error('Error re-scanning submission:', err);
        res.status(500).json({ message: 'Server error while re-scanning submission.' });
    }
});

// Approve submission (BPLO Staff only)
router.put('/approve/:id', protect, authorize('bplo_staff'), async (req, res) => {
    try {
        const existing = await TodaSubmission.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        if (existing.status === 'Approved') {
            return res.status(409).json({ message: 'Submission has already been approved.' });
        }

        const expectedUpdatedAt = req.body?.expectedUpdatedAt;
        let expectedDate = null;
        if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== null && expectedUpdatedAt !== '') {
            expectedDate = new Date(expectedUpdatedAt);
            if (Number.isNaN(expectedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid expectedUpdatedAt timestamp.' });
            }
            const actualUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt) : null;
            if (!actualUpdatedAt || actualUpdatedAt.getTime() !== expectedDate.getTime()) {
                return res.status(409).json({ message: 'Submission was modified concurrently since it was opened. Please refresh and try again.' });
            }
        }

        // M9: Synchronize extracted members into TodaRoster using idempotent upserts BEFORE committing status='Approved'
        // If sync fails, the error propagates and the submission remains Pending so retries work cleanly.
        await syncSubmissionToRoster(existing, { allowPending: true });

        const updatedSubmission = await TodaSubmission.findOneAndUpdate(
            { _id: req.params.id, status: { $ne: 'Approved' }, updatedAt: expectedDate || existing.updatedAt },
            { $set: { status: 'Approved' } },
            { returnDocument: 'after' }
        );

        if (!updatedSubmission) {
            return res.status(409).json({ message: 'Submission was modified concurrently. Please refresh and try again.' });
        }

        logAudit(req, { action: 'TODA_ROSTER_APPROVED', targetType: 'TODA', targetId: updatedSubmission._id, details: { todaName: updatedSubmission.todaAssociation, presidentName: updatedSubmission.presidentName, fileName: updatedSubmission.fileName, extractedCount: updatedSubmission.extractedCount || (updatedSubmission.extractedMembers || []).length, previousStatus: existing.status, newStatus: 'Approved' } });
        res.status(200).json({ message: 'Approved successfully', submission: updatedSubmission });
    } catch (error) {
        console.error('[TodaRoster] Submission approval/sync failed:', error);
        res.status(500).json({ message: 'Failed to synchronize TODA roster members. Submission remains Pending and can be retried.' });
    }
});

// Submit member removal / kick request (TODA President / BPLO Staff)
router.post('/removal-requests', protect, authorize('bplo_staff', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const { memberId, memberName: bodyMemberName, reason, details, todaName: bodyTodaName, targetRosterId: bodyTargetRosterId } = req.body;
        if (!memberId || !reason || !details) {
            return res.status(400).json({ message: 'Member ID, reason, and detailed explanation are required.' });
        }

        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isStaff = userRole === 'bplo_staff' || userRole === 'admin' || userRole === 'system_admin';

        // Determine and strictly scope target TODA association
        let presidentToda = '';
        if (isStaff) {
            presidentToda = String(bodyTodaName || req.user.todaAssociation || '').trim();
        } else {
            const assignedToda = String(req.user.todaAssociation || '').trim();
            if (!assignedToda || assignedToda.toUpperCase() === 'NON-TODA') {
                return res.status(403).json({ message: 'ACCESS DENIED: Your TODA President account must be assigned to an official TODA association.' });
            }
            if (bodyTodaName && String(bodyTodaName).trim().toUpperCase() !== assignedToda.toUpperCase()) {
                return res.status(403).json({ message: 'ACCESS DENIED: You can only file removal requests for your own assigned TODA association.' });
            }
            presidentToda = assignedToda;
        }

        if (!presidentToda || presidentToda.toUpperCase() === 'NON-TODA') {
            return res.status(400).json({ message: 'You must have a registered TODA Association to submit removal requests.' });
        }

        const escapedToda = presidentToda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const todaExactRegex = new RegExp(`^${escapedToda}$`, 'i');

        const rawIdStr = String(memberId).trim();
        let member = null;
        let targetRosterId = null;
        let targetSubmissionId = null;
        let targetSubmissionMemberId = '';
        let resolvedName = (bodyMemberName || '').trim();
        let resolvedContact = '';
        let resolvedAddress = '';
        let foundInAssociation = false;

        if (mongoose.Types.ObjectId.isValid(rawIdStr) && !rawIdStr.startsWith('roster-')) {
            member = await User.findOne({ _id: rawIdStr, todaAssociation: todaExactRegex });
            if (member) {
                foundInAssociation = true;
                // Link exact TodaRoster record if explicitly specified or bound to this user
                if (bodyTargetRosterId && mongoose.Types.ObjectId.isValid(String(bodyTargetRosterId))) {
                    const explicitRoster = await TodaRoster.findOne({ _id: bodyTargetRosterId, todaAssociation: todaExactRegex }).select('_id');
                    if (explicitRoster) targetRosterId = explicitRoster._id;
                }
                if (!targetRosterId) {
                    const linkedRoster = await TodaRoster.findOne({
                        todaAssociation: todaExactRegex,
                        $or: [{ registeredUser: member._id }, { claimedBy: member._id }]
                    }).select('_id');
                    if (linkedRoster) targetRosterId = linkedRoster._id;
                }
            } else {
                // Also check if the ObjectId belongs directly to a TodaRoster document within this TODA
                const directDoc = await TodaRoster.findOne({ _id: rawIdStr, todaAssociation: todaExactRegex });
                if (directDoc) {
                    foundInAssociation = true;
                    targetRosterId = directDoc._id;
                    resolvedName = directDoc.operatorName || resolvedName;
                    resolvedContact = directDoc.contact || '';
                    resolvedAddress = directDoc.remarks || 'TODA Masterlist Member';
                    const linkedUserId = directDoc.registeredUser || directDoc.claimedBy;
                    if (linkedUserId) {
                        member = await User.findOne({ _id: linkedUserId, todaAssociation: todaExactRegex });
                    }
                }
            }
        } else if (rawIdStr.startsWith('roster-direct-')) {
            const rosterDocId = rawIdStr.replace('roster-direct-', '');
            if (mongoose.Types.ObjectId.isValid(rosterDocId)) {
                const directDoc = await TodaRoster.findOne({ _id: rosterDocId, todaAssociation: todaExactRegex });
                if (directDoc) {
                    foundInAssociation = true;
                    targetRosterId = directDoc._id;
                    resolvedName = directDoc.operatorName || resolvedName;
                    resolvedContact = directDoc.contact || '';
                    resolvedAddress = directDoc.remarks || 'TODA Masterlist Member';
                    const linkedUserId = directDoc.registeredUser || directDoc.claimedBy;
                    if (linkedUserId) {
                        member = await User.findOne({ _id: linkedUserId, todaAssociation: todaExactRegex });
                    }
                }
            }
        } else if (rawIdStr.startsWith('roster-')) {
            const subMemberId = rawIdStr.replace('roster-', '');
            const submissions = await TodaSubmission.find({ todaAssociation: todaExactRegex });
            for (const sub of submissions) {
                const found = (sub.extractedMembers || []).find(
                    m => String(m._id) === subMemberId
                ) || (sub.extractedMembers || []).find(
                    m => resolvedName && isNameMatch(m.name || m.operatorName, resolvedName)
                );
                if (found) {
                    foundInAssociation = true;
                    targetSubmissionId = sub._id;
                    targetSubmissionMemberId = found._id ? String(found._id) : '';
                    resolvedName = found.name || found.operatorName || resolvedName;
                    resolvedAddress = 'Endorsed Masterlist Record';
                    const foundBody = String(found.bodyNumber || found.unitNo || '').trim().toUpperCase();
                    if (foundBody) {
                        const matchedRoster = await TodaRoster.findOne({
                            todaAssociation: todaExactRegex,
                            bodyNumber: foundBody
                        }).select('_id');
                        if (matchedRoster) targetRosterId = matchedRoster._id;
                    }
                    break;
                }
            }
        }

        if (!foundInAssociation || (!member && !resolvedName)) {
            return res.status(404).json({ message: `Operator member not found within ${presidentToda}.` });
        }

        if (member) {
            const memberToda = (member.todaAssociation || '').trim();
            if (!memberToda || memberToda.toUpperCase() === 'NON-TODA' || memberToda.toUpperCase() !== presidentToda.toUpperCase()) {
                return res.status(403).json({ message: `Operator is not affiliated with ${presidentToda}.` });
            }
            resolvedName = member.name;
            resolvedContact = member.contact || '';
            resolvedAddress = member.address || '';
        }

        const removalReq = await TodaRemovalRequest.create({
            todaName: presidentToda,
            president: req.user._id,
            presidentName: req.user.name,
            member: member ? member._id : null,
            targetRosterId,
            targetSubmissionId,
            targetSubmissionMemberId,
            memberName: resolvedName,
            memberContact: resolvedContact,
            memberAddress: resolvedAddress,
            reason,
            details: details.trim(),
            status: 'Pending'
        });

        logAudit(req, {
            action: 'TODA_REMOVAL_REQUESTED',
            targetType: 'TODA',
            targetId: removalReq._id,
            details: {
                todaName: removalReq.todaName,
                memberName: removalReq.memberName,
                targetRosterId: targetRosterId ? String(targetRosterId) : '',
                reason: removalReq.reason
            }
        });

        res.status(201).json({
            message: 'Removal request filed successfully and routed to Admin for approval.',
            request: {
                _id: removalReq._id,
                todaName: removalReq.todaName,
                presidentName: removalReq.presidentName,
                member: removalReq.member,
                targetRosterId: removalReq.get('targetRosterId') || null,
                memberName: removalReq.memberName,
                reason: removalReq.reason,
                details: removalReq.details,
                status: removalReq.status,
                createdAt: removalReq.createdAt
            }
        });
    } catch (error) {
        console.error('Error filing removal request:', error);
        res.status(500).json({ message: 'Failed to file removal request.' });
    }
});

// Get removal requests (BPLO Staff sees all; Toda President sees for their TODA)
router.get('/removal-requests', protect, authorize('bplo_staff', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isStaff = userRole === 'bplo_staff' || userRole === 'admin' || userRole === 'system_admin';

        let query = {};
        if (!isStaff) {
            const presidentToda = (req.user.todaAssociation || '').trim();
            if (!presidentToda || presidentToda.toUpperCase() === 'NON-TODA') {
                return res.status(200).json([]);
            }
            const escaped = presidentToda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.todaName = new RegExp(`^${escaped}$`, 'i');
        }

        const requests = await TodaRemovalRequest.find(query)
            .populate('member', 'name contact address role')
            .populate('president', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching removal requests:', error);
        res.status(500).json({ message: 'Failed to fetch removal requests.' });
    }
});

// Approve removal request (BPLO Staff only)
router.put('/removal-requests/:id/approve', protect, authorize('bplo_staff'), async (req, res) => {
    try {
        const { adminRemarks = '' } = req.body;
        const existing = await TodaRemovalRequest.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Removal request not found.' });
        if (existing.status !== 'Pending') {
            return res.status(400).json({ message: `Request has already been ${existing.status.toLowerCase()}.` });
        }

        const targetTodaName = String(existing.todaName || '').trim();
        if (!targetTodaName || targetTodaName.toUpperCase() === 'NON-TODA') {
            return res.status(400).json({ message: 'Removal request does not specify a valid TODA association.' });
        }

        const escapedToda = targetTodaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const todaExactRegex = new RegExp(`^${escapedToda}$`, 'i');
        const trimmedName = String(existing.memberName || '').trim();
        const exactNameRegex = trimmedName
            ? new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            : null;

        const targetRosterId = existing.get('targetRosterId') || null;
        const targetSubmissionId = existing.get('targetSubmissionId') || null;
        const targetSubmissionMemberId = String(existing.get('targetSubmissionMemberId') || '').trim();

        // M9: Resolve exact target roster row without widening deletion to same-name rows when targetRosterId is present
        let targetRosterDoc = null;
        let matchingRosterIds = [];
        if (targetRosterId) {
            targetRosterDoc = await TodaRoster.findOne({ _id: targetRosterId, todaAssociation: todaExactRegex });
            if (targetRosterDoc) {
                matchingRosterIds = [targetRosterDoc._id];
            }
        } else if (existing.member) {
            const linkedRosters = await TodaRoster.find({
                todaAssociation: todaExactRegex,
                $or: [{ registeredUser: existing.member }, { claimedBy: existing.member }]
            });
            if (linkedRosters.length > 0) {
                matchingRosterIds = linkedRosters.map(r => r._id);
                targetRosterDoc = linkedRosters[0];
            } else {
                const rosterCandidates = await TodaRoster.find({ todaAssociation: todaExactRegex });
                matchingRosterIds = rosterCandidates
                    .filter(r => trimmedName && isNameMatch(r.operatorName, trimmedName))
                    .map(r => r._id);
            }
        } else {
            const rosterCandidates = await TodaRoster.find({ todaAssociation: todaExactRegex });
            matchingRosterIds = rosterCandidates
                .filter(r => trimmedName && isNameMatch(r.operatorName, trimmedName))
                .map(r => r._id);
        }

        const targetUserId = existing.member || targetRosterDoc?.registeredUser || targetRosterDoc?.claimedBy || null;
        const targetBodyNumber = String(targetRosterDoc?.bodyNumber || '').trim().toUpperCase();

        const matchingSubmissions = targetSubmissionId
            ? await TodaSubmission.find({ _id: targetSubmissionId, todaAssociation: todaExactRegex })
            : await TodaSubmission.find({ todaAssociation: todaExactRegex });

        const hasSubmissionMemberMatch = matchingSubmissions.some(sub =>
            Array.isArray(sub.extractedMembers) &&
            sub.extractedMembers.some(m => {
                if (targetSubmissionMemberId) {
                    return String(m._id) === targetSubmissionMemberId;
                }
                if (targetBodyNumber) {
                    return String(m.bodyNumber || m.unitNo || '').trim().toUpperCase() === targetBodyNumber;
                }
                return Boolean(trimmedName) && isNameMatch(m.name || m.operatorName || '', trimmedName);
            })
        );

        let hasValidAffiliation = matchingRosterIds.length > 0 || hasSubmissionMemberMatch;
        if (targetUserId) {
            const [targetUserDoc, matchedFranchise, matchedRegisteredRoster] = await Promise.all([
                User.findById(targetUserId).select('todaAssociation').lean(),
                Franchise.findOne({ operator: targetUserId, todaName: todaExactRegex }).select('_id').lean(),
                TodaRoster.findOne({
                    todaAssociation: todaExactRegex,
                    $or: [{ registeredUser: targetUserId }, { claimedBy: targetUserId }]
                }).select('_id').lean()
            ]);
            const userMatchesToda = Boolean(targetUserDoc && todaExactRegex.test(String(targetUserDoc.todaAssociation || '').trim()));
            if (userMatchesToda || matchedFranchise || matchedRegisteredRoster) {
                hasValidAffiliation = true;
            } else if (targetUserDoc && !targetRosterDoc) {
                const currentUserToda = String(targetUserDoc.todaAssociation || '').trim();
                // Reject if the registered user is no longer affiliated with targetTodaName (e.g. transferred or already NON-TODA)
                if (currentUserToda && !todaExactRegex.test(currentUserToda)) {
                    hasValidAffiliation = false;
                }
            }
        } else if (!targetRosterId && exactNameRegex) {
            // Only fall back to name lookup for legacy requests that lack both member and targetRosterId
            const [matchedUser, matchedFranchise] = await Promise.all([
                User.findOne({ name: exactNameRegex, todaAssociation: todaExactRegex }).select('_id').lean(),
                Franchise.findOne({ fullName: exactNameRegex, todaName: todaExactRegex }).select('_id').lean()
            ]);
            if (matchedUser || matchedFranchise) {
                hasValidAffiliation = true;
            }
        }

        if (!hasValidAffiliation) {
            return res.status(409).json({
                message: `Target member is no longer affiliated with ${targetTodaName}.`
            });
        }

        // M9: Execute all downstream user/franchise/roster/submission updates BEFORE marking the request Approved!
        // If any downstream write throws, the removal request stays Pending so approval can be retried cleanly.

        // 1. Disaffiliate registered User member & franchises strictly scoped to targetTodaName
        if (targetUserId) {
            await User.findOneAndUpdate(
                { _id: targetUserId, todaAssociation: todaExactRegex },
                { $set: { todaAssociation: 'NON-TODA', bodyNumber: '' } }
            );
            await Franchise.updateMany(
                { operator: targetUserId, todaName: todaExactRegex },
                { $set: { todaName: 'NON-TODA', bodyNumber: '' } }
            );
        } else if (!targetRosterId && !targetSubmissionMemberId && exactNameRegex) {
            // Legacy name-only fallback (never runs when targetRosterId or targetSubmissionMemberId identifies a specific row)
            await User.updateMany(
                { name: exactNameRegex, todaAssociation: todaExactRegex },
                { $set: { todaAssociation: 'NON-TODA', bodyNumber: '' } }
            );
            await Franchise.updateMany(
                { fullName: exactNameRegex, todaName: todaExactRegex },
                { $set: { todaName: 'NON-TODA', bodyNumber: '' } }
            );
        }

        // 2. Remove matching member from TodaRoster — strictly by _id: targetRosterId when present!
        if (targetRosterId) {
            await TodaRoster.deleteOne({ _id: targetRosterId, todaAssociation: todaExactRegex });
        } else if (matchingRosterIds.length > 0) {
            await TodaRoster.deleteMany({ _id: { $in: matchingRosterIds }, todaAssociation: todaExactRegex });
        }

        // 3. Pull matching member from TodaSubmission.extractedMembers (strictly scoped)
        if (targetSubmissionMemberId || targetBodyNumber || (!targetRosterId && trimmedName)) {
            for (const sub of matchingSubmissions) {
                if (Array.isArray(sub.extractedMembers) && sub.extractedMembers.length > 0) {
                    const beforeLen = sub.extractedMembers.length;
                    sub.extractedMembers = sub.extractedMembers.filter(m => {
                        if (targetSubmissionMemberId) {
                            return String(m._id) !== targetSubmissionMemberId;
                        }
                        if (targetBodyNumber) {
                            return String(m.bodyNumber || m.unitNo || '').trim().toUpperCase() !== targetBodyNumber;
                        }
                        return !isNameMatch(m.name || m.operatorName || '', trimmedName);
                    });
                    if (sub.extractedMembers.length !== beforeLen) {
                        sub.extractedCount = sub.extractedMembers.length;
                        await sub.save();
                    }
                }
            }
        }

        // 4. Commit removal request status to Approved ONLY after all downstream updates succeeded
        const request = await TodaRemovalRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' },
            {
                $set: {
                    status: 'Approved',
                    adminRemarks: adminRemarks.trim(),
                    reviewedBy: req.user._id,
                    reviewedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        if (!request) {
            return res.status(409).json({ message: 'Removal request was already processed concurrently.' });
        }

        logAudit(req, {
            action: 'TODA_REMOVAL_APPROVED',
            targetType: 'TODA',
            targetId: request._id,
            details: {
                todaName: request.todaName,
                memberName: request.memberName,
                memberId: request.member ? String(request.member) : '',
                targetRosterId: targetRosterId ? String(targetRosterId) : '',
                adminRemarks: request.adminRemarks
            }
        });

        res.status(200).json({ message: `Member ${request.memberName} officially disaffiliated from ${request.todaName}.`, request });
    } catch (error) {
        console.error('Error approving removal request:', error);
        res.status(500).json({ message: 'Failed to approve removal request.' });
    }
});

// Reject removal request (BPLO Staff only)
router.put('/removal-requests/:id/reject', protect, authorize('bplo_staff'), async (req, res) => {
    try {
        const { adminRemarks = '' } = req.body;
        const existing = await TodaRemovalRequest.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Removal request not found.' });
        if (existing.status !== 'Pending') {
            return res.status(400).json({ message: `Request has already been ${existing.status.toLowerCase()}.` });
        }

        const request = await TodaRemovalRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' },
            {
                $set: {
                    status: 'Rejected',
                    adminRemarks: adminRemarks.trim() || 'Request disapproved by municipal administrator.',
                    reviewedBy: req.user._id,
                    reviewedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        if (!request) {
            return res.status(409).json({ message: 'Removal request was already processed concurrently.' });
        }

        logAudit(req, {
            action: 'TODA_REMOVAL_REJECTED',
            targetType: 'TODA',
            targetId: request._id,
            details: {
                todaName: request.todaName,
                memberName: request.memberName,
                adminRemarks: request.adminRemarks
            }
        });

        res.status(200).json({ message: 'Removal request has been rejected.', request });
    } catch (error) {
        console.error('Error rejecting removal request:', error);
        res.status(500).json({ message: 'Failed to reject removal request.' });
    }
});

// Get user submissions
router.get('/my-submissions', protect, async (req, res) => {
    try {
        const mySubmissions = await TodaSubmission.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(mySubmissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your submissions' });
    }
});

// Get all members, operators, and registered tricycle units under the TODA Association (for TODA Presidents / Admin)
router.get('/my-members', protect, authorize('toda_president', 'toda president', 'bplo_staff', 'system_admin', 'admin'), async (req, res) => {
    try {
        // Determine the target TODA association
        let todaName = (req.query.todaName || '').trim();
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isAdmin = userRole === 'admin' || userRole === 'administrator' || userRole === 'bplo_staff' || userRole === 'system_admin';

        if (!todaName) {
            if (req.user.todaAssociation && req.user.todaAssociation !== 'NON-TODA') {
                todaName = req.user.todaAssociation.trim();
            }
        } else if (!isAdmin) {
            // Non-admin users are restricted to viewing only their own assigned TODA association
            const userToda = (req.user.todaAssociation || '').trim();
            if (userToda.toUpperCase() !== todaName.toUpperCase()) {
                return res.status(403).json({ message: 'ACCESS DENIED: You can only view members of your own TODA association.' });
            }
        }

        if (!todaName || todaName.toUpperCase() === 'NON-TODA') {
            return res.status(200).json({
                todaName: req.user.todaAssociation || 'NON-TODA',
                stats: { totalMembers: 0, totalUnits: 0, activeUnits: 0, pendingUnits: 0, expiredUnits: 0 },
                members: []
            });
        }

        const escapedToda = todaName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const todaRegex = new RegExp(`^${escapedToda}$`, 'i');

        // 1. Fetch all franchises matching this TODA
        const franchises = await Franchise.find({ todaName: todaRegex })
            .populate('operator', 'name contact address email profilePic role todaAssociation lastActive createdAt')
            .sort({ createdAt: -1 });

        // 2. Fetch all users registered under this TODA
        const users = await User.find({ todaAssociation: todaRegex })
            .select('name contact address email profilePic role todaAssociation lastActive createdAt bodyNumber')
            .sort({ name: 1 });

        // 3. Aggregate into member profiles
        const membersMap = new Map();

        // Seed from User collection first
        for (const u of users) {
            const uId = String(u._id);
            const isPres = String(u.role).toLowerCase().includes('president') || 
                           (String(req.user._id) === uId && String(req.user.role).toLowerCase().includes('president'));
            membersMap.set(uId, {
                _id: u._id,
                name: u.name,
                contact: u.contact || 'N/A',
                address: u.address || 'N/A',
                email: u.email || '',
                bodyNumber: u.bodyNumber || '',
                profilePic: u.profilePic || '',
                role: u.role,
                isPresident: isPres,
                isCurrentUser: String(req.user._id) === uId,
                lastActive: u.lastActive,
                createdAt: u.createdAt,
                units: []
            });
        }

        // Add units from Franchise collection
        for (const f of franchises) {
            const opKey = f.operator && f.operator._id ? String(f.operator._id) : (f.fullName || String(f._id));
            let member = membersMap.get(opKey);

            if (!member) {
                if (f.operator && f.operator.name) {
                    const isPres = String(f.operator.role || '').toLowerCase().includes('president');
                    member = {
                        _id: f.operator._id,
                        name: f.operator.name,
                        contact: f.operator.contact || 'N/A',
                        address: f.operator.address || f.address || 'N/A',
                        email: f.operator.email || '',
                        bodyNumber: f.operator.bodyNumber || '',
                        profilePic: f.operator.profilePic || '',
                        role: f.operator.role || 'operator',
                        isPresident: isPres,
                        isCurrentUser: String(req.user._id) === String(f.operator._id),
                        lastActive: f.operator.lastActive,
                        createdAt: f.operator.createdAt || f.createdAt,
                        units: []
                    };
                } else {
                    member = {
                        _id: opKey,
                        name: f.fullName,
                        contact: 'N/A',
                        address: f.address || 'N/A',
                        email: '',
                        bodyNumber: '',
                        profilePic: '',
                        role: 'operator',
                        isPresident: false,
                        isCurrentUser: false,
                        lastActive: null,
                        createdAt: f.createdAt,
                        units: []
                    };
                }
                membersMap.set(opKey, member);
            }

            member.units.push({
                _id: f._id,
                plateNo: f.plateNo,
                make: f.make,
                made: f.made,
                motorNo: f.motorNo,
                chassisNo: f.chassisNo,
                zone: f.zone,
                status: f.status,
                dateApplied: f.dateApplied,
                createdAt: f.createdAt
            });
        }

        // 3. Fetch direct TodaRoster records (including individually registered members)
        const directRoster = await TodaRoster.find({ todaAssociation: todaRegex });
        for (const dr of directRoster) {
            const drName = (dr.operatorName || '').trim();
            if (!drName) continue;

            const existing = Array.from(membersMap.values()).find(m => isNameMatch(m.name, drName));
            if (!existing) {
                const tempId = `roster-direct-${dr._id}`;
                membersMap.set(tempId, {
                    _id: tempId,
                    name: drName,
                    contact: dr.contact || 'N/A',
                    address: dr.remarks || 'TODA Masterlist Member',
                    email: '',
                    bodyNumber: dr.bodyNumber || '',
                    plateNo: dr.plateNo || '',
                    profilePic: '',
                    role: 'operator',
                    isPresident: false,
                    isCurrentUser: false,
                    isRosterEndorsed: true,
                    registeredInApp: Boolean(dr.registeredUser),
                    lastActive: null,
                    createdAt: dr.createdAt,
                    units: dr.plateNo ? [{
                        _id: `unit-${dr._id}`,
                        plateNo: dr.plateNo,
                        make: 'Tricycle',
                        status: 'Active',
                        dateApplied: dr.createdAt,
                        createdAt: dr.createdAt
                    }] : []
                });
            } else {
                if (!existing.bodyNumber && dr.bodyNumber) {
                    existing.bodyNumber = dr.bodyNumber;
                }
                existing.isRosterEndorsed = true;
            }
        }

        // 4. Fetch approved TODA Submissions to include endorsed masterlist members
        const approvedSubmissions = await TodaSubmission.find({
            status: 'Approved',
            $or: [{ todaAssociation: todaRegex }, { fileName: todaRegex }]
        }).sort({ createdAt: -1 });

        const latestApprovedSub = approvedSubmissions[0] || null;

        for (const sub of approvedSubmissions) {
            for (const rm of (sub.extractedMembers || [])) {
                const rmName = (rm.name || rm.operatorName || '').trim();
                const rmBodyNo = (rm.bodyNumber || rm.unitNo || '').trim();
                if (!rmName) continue;

                const existing = Array.from(membersMap.values()).find(m => isNameMatch(m.name, rmName));
                if (!existing) {
                    const tempId = `roster-${rm._id || Math.random().toString(36).slice(2, 9)}`;
                    membersMap.set(tempId, {
                        _id: tempId,
                        name: rmName,
                        contact: 'N/A',
                        address: 'Endorsed Masterlist Record',
                        email: '',
                        bodyNumber: rmBodyNo,
                        plateNo: rm.plateNo || '',
                        profilePic: '',
                        role: 'operator',
                        isPresident: false,
                        isCurrentUser: false,
                        isRosterEndorsed: true,
                        registeredInApp: false,
                        lastActive: null,
                        createdAt: sub.createdAt,
                        units: rm.plateNo ? [{
                            _id: `sub-unit-${tempId}`,
                            plateNo: rm.plateNo,
                            make: 'Tricycle',
                            status: 'Active',
                            dateApplied: sub.createdAt,
                            createdAt: sub.createdAt
                        }] : []
                    });
                } else {
                    if (!existing.bodyNumber && rmBodyNo) {
                        existing.bodyNumber = rmBodyNo;
                    }
                    existing.isRosterEndorsed = true;
                }
            }
        }

        const membersList = Array.from(membersMap.values());

        // Sort: President first, then registered members, then by name
        membersList.sort((a, b) => {
            if (a.isPresident && !b.isPresident) return -1;
            if (!a.isPresident && b.isPresident) return 1;
            const regA = a.registeredInApp !== false ? 1 : 0;
            const regB = b.registeredInApp !== false ? 1 : 0;
            if (regA !== regB) return regB - regA;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Compute statistics
        let totalUnits = 0;
        let activeUnits = 0;
        let pendingUnits = 0;
        let expiredUnits = 0;

        membersList.forEach(m => {
            (m.units || []).forEach(u => {
                totalUnits++;
                if (u.status === 'Active') activeUnits++;
                else if (u.status === 'Pending' || u.status === 'For Signing' || u.status === 'Ready for Pickup') pendingUnits++;
                else if (u.status === 'Expired') expiredUnits++;
            });
        });

        const certifiedRosterCount = directRoster.length + approvedSubmissions.reduce((acc, s) => acc + (s.extractedMembers?.length || 0), 0);

        res.status(200).json({
            todaName,
            stats: {
                totalMembers: membersList.length,
                totalUnits,
                activeUnits,
                pendingUnits,
                expiredUnits,
                certifiedRosterCount
            },
            members: membersList,
            latestSubmission: latestApprovedSub
        });
    } catch (error) {
        console.error('Error fetching TODA members:', error);
        res.status(500).json({ message: 'Error fetching TODA member directory' });
    }
});

// Handler for adding single member to accredited roster
const handleAddSingleMember = async (req, res) => {
    try {
        const { operatorName, bodyNumber, plateNo, contact, remarks, todaAssociation } = req.body;
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isTodaPres = userRole === 'toda_president';
        if (isTodaPres) {
            const assignedToda = (req.user.todaAssociation || '').trim();
            if (!assignedToda || assignedToda.toUpperCase() === 'NON-TODA') {
                return res.status(403).json({ message: 'Your TODA President account does not have an assigned TODA association.' });
            }
            if (todaAssociation && todaAssociation.trim().toUpperCase() !== assignedToda.toUpperCase()) {
                return res.status(403).json({ message: 'You can only add members to your own assigned TODA association.' });
            }
        }
        const targetToda = (isTodaPres ? (req.user.todaAssociation || '') : (todaAssociation || req.user.todaAssociation || '')).trim();

        if (!operatorName || !operatorName.trim()) {
            return res.status(400).json({ message: 'Operator full name is required' });
        }
        if (!bodyNumber || !bodyNumber.trim()) {
            return res.status(400).json({ message: 'Assigned body number is required' });
        }
        if (!targetToda) {
            return res.status(400).json({ message: 'TODA association could not be determined' });
        }

        const cleanName = operatorName.trim().toUpperCase();
        const cleanBodyNumber = bodyNumber.trim().toUpperCase();
        const cleanPlateNo = (plateNo || '').trim().toUpperCase();
        const cleanContact = (contact || '').trim();

        // 1. Strict Duplicate Check on Compound Key (todaAssociation + bodyNumber)
        const escapedToda = targetToda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const todaRegex = new RegExp(`^${escapedToda}$`, 'i');
        const bodyRegex = new RegExp(`^${cleanBodyNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        const existingBodyInRoster = await TodaRoster.findOne({
            todaAssociation: todaRegex,
            bodyNumber: bodyRegex
        });

        if (existingBodyInRoster) {
            return res.status(409).json({
                message: `Body Number "${cleanBodyNumber}" is already assigned to ${existingBodyInRoster.operatorName} in ${targetToda}. Duplicate body numbers are strictly prohibited.`,
                conflictField: 'bodyNumber',
                assignedTo: existingBodyInRoster.operatorName
            });
        }

        // 2. Cross-check if vehicle plate is registered under another active franchise
        if (cleanPlateNo) {
            const plateRegex = new RegExp(`^${cleanPlateNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const existingPlate = await Franchise.findOne({
                plateNo: plateRegex,
                status: { $in: ['Active', 'Pending', 'For Signing', 'Ready for Pickup'] }
            });
            if (existingPlate && existingPlate.todaName?.toUpperCase() !== targetToda.toUpperCase()) {
                return res.status(409).json({
                    message: `Vehicle plate number "${cleanPlateNo}" is already actively associated with ${existingPlate.todaName}. A unit cannot belong to multiple TODAs simultaneously.`,
                    conflictField: 'plateNo'
                });
            }
        }

        // 3. Create active roster entry
        const newRosterEntry = await TodaRoster.create({
            todaAssociation: targetToda,
            operatorName: cleanName,
            bodyNumber: cleanBodyNumber,
            plateNo: cleanPlateNo,
            contact: cleanContact,
            status: 'Active',
            remarks: remarks?.trim() || `Individually added by ${req.user.name || req.user.role} on ${new Date().toLocaleDateString('en-PH')}`
        });

        res.status(201).json({
            message: `Operator ${cleanName} with Body No. ${cleanBodyNumber} successfully added to ${targetToda} roster.`,
            member: newRosterEntry
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Database constraint violation: Body Number already exists in this association.',
                conflictField: 'bodyNumber'
            });
        }
        console.error('Error adding individual member:', error);
        res.status(500).json({ message: 'Error adding individual member to TODA roster' });
    }
};

// @route   POST /api/v1/toda/members/single
// @desc    Add a single individual member directly to active accredited TODA roster
// @access  Private (TODA President, BPLO Staff, Admin)
router.post('/members/single', protect, authorize('toda_president', 'toda president', 'bplo_staff'), handleAddSingleMember);

module.exports = router;