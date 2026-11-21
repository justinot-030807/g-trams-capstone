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
const { resolveTodaAssociation, todaAssociationPattern } = require('../controllers/franchiseController');
const { logAudit } = require('../utils/auditLogger');
const { findRosterSlot, rosterBodyKey, rosterClaimKey, rosterConflict, rosterOwners, sameRosterName } = require('../utils/rosterClaims');
const { withRosterMutation } = require('../utils/rosterMutation');

function getOfficialToda(value) {
    const entry = resolveTodaAssociation(value);
    return entry?.id === 'NON-TODA' ? null : entry;
}

function requirePresidentAssociation(req, res, next) {
    const role = String(req.user.role).toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (role === 'toda_president' && !getOfficialToda(req.user.todaAssociation)) {
        return res.status(403).json({ message: 'Your TODA President account must be assigned to an official TODA association.' });
    }
    next();
}

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
router.get('/rosters', protect, authorize('bplo_staff'), async (req, res) => { try { const rosters = await TodaRoster.find().sort({ todaAssociation: 1, bodyNumber: 1 }); res.status(200).json(rosters); } catch (error) { res.status(500).json({ message: 'Error fetching TODA rosters' }); } });
router.get('/next-body-number', protect, authorize('bplo_staff', 'toda_president'), requirePresidentAssociation, getNextBodyNumber);

// Register an individual member (when only one operator joins a TODA)
router.post('/members/individual', protect, authorize('bplo_staff', 'toda_president'), requirePresidentAssociation, addIndividualMember);

// Real-time AI OCR scanning for roster documents (zero Cloudinary delay, memory buffer)
router.post('/scan-roster', protect, authorize('bplo_staff', 'toda_president'), requirePresidentAssociation, memoryUpload.single('file'), async (req, res) => {
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
router.post('/upload', protect, authorize('bplo_staff', 'toda_president'), requirePresidentAssociation, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        let extractedMembers = [];
        let extractedCount = 0;
        let ocrNotes = '';
        let todaAssociation = getOfficialToda(req.user.todaAssociation)?.id || '';

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
                    if (!todaAssociation) {
                        todaAssociation = getOfficialToda(ocr.todaAssociation)?.id || '';
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

        const updatedSubmission = await withRosterMutation(TodaSubmission.db, async writes => {
            const approved = await writes.update(TodaSubmission,
                { _id: existing._id, status: existing.status, updatedAt: expectedDate || existing.updatedAt },
                { $set: { status: 'Approved' } }
            );
            if (!approved) return null;
            await syncSubmissionToRoster(approved, writes);
            return approved;
        });

        if (!updatedSubmission) {
            return res.status(409).json({ message: 'Submission was modified concurrently. Please refresh and try again.' });
        }

        logAudit(req, { action: 'TODA_ROSTER_APPROVED', targetType: 'TODA', targetId: updatedSubmission._id, details: { todaName: updatedSubmission.todaAssociation, presidentName: updatedSubmission.presidentName, fileName: updatedSubmission.fileName, extractedCount: updatedSubmission.extractedCount || (updatedSubmission.extractedMembers || []).length, previousStatus: existing.status, newStatus: 'Approved' } });
        res.status(200).json({ message: 'Approved successfully', submission: updatedSubmission });
    } catch (error) {
        if (error.statusCode === 409 || error.code === 11000) {
            return res.status(409).json({ message: error.statusCode === 409 ? error.message : 'Roster changed concurrently. Please refresh and try again.' });
        }
        console.error('[TodaRoster] Submission approval/sync failed:', error);
        res.status(500).json({ message: 'Failed to synchronize TODA roster members. Submission remains Pending and can be retried.' });
    }
});

function isRemovalOperator(user) {
    return ['operator', 'driver'].includes(String(user.role).trim().toLowerCase());
}

const submissionMemberName = member => member.operatorName || member.name || '';
const submissionMemberBody = member => member.bodyNumber || member.unitNo || '';

async function resolveRemovalTarget(todaEntry, selector, session) {
    const association = todaAssociationPattern(todaEntry);
    const userScope = { todaAssociation: association, role: { $in: ['operator', 'driver'] } };
    let user = null;
    let roster = null;
    let submission = null;
    let entry = null;

    if (selector.userId) {
        user = await User.findOne({ ...userScope, _id: selector.userId }).session(session ?? null);
        if (!user) return null;
    }
    if (selector.rosterId) {
        roster = await TodaRoster.findOne({ _id: selector.rosterId, todaAssociation: association }).session(session ?? null);
        if (!roster) return null;
    }
    if (selector.entryId) {
        const submissions = await TodaSubmission.find({
            todaAssociation: association,
            status: 'Approved',
            ...(selector.submissionId && { _id: selector.submissionId })
        }).session(session ?? null);
        const matches = submissions.filter(sub => sub.extractedMembers.some(item => String(item._id) === selector.entryId));
        if (matches.length !== 1) return null;
        submission = matches[0];
        entry = submission.extractedMembers.find(item => String(item._id) === selector.entryId);
    }

    const bodyNumber = user ? user.bodyNumber : (roster?.bodyNumber || (entry && submissionMemberBody(entry)));
    const key = rosterBodyKey(bodyNumber);
    const slot = await findRosterSlot(todaEntry.id, bodyNumber, session);
    if (roster && (!slot || String(slot._id) !== String(roster._id))) return null;
    if (entry && slot && !sameRosterName(submissionMemberName(entry), slot.operatorName)) return null;
    if (entry && rosterBodyKey(submissionMemberBody(entry)) !== key) return null;
    roster = slot;

    if (!roster && user) {
        if (!key) return null;
        const approved = await TodaSubmission.find({ todaAssociation: association, status: 'Approved' }).session(session ?? null);
        const copies = approved.flatMap(sub => sub.extractedMembers)
            .filter(item => rosterBodyKey(submissionMemberBody(item)) === key);
        if (!copies.length || copies.some(item => !sameRosterName(submissionMemberName(item), user.name))) return null;
        if (!entry) {
            entry = copies[0];
            submission = approved.find(sub => sub.extractedMembers.includes(entry));
        }
    }

    if (!user && !roster && !entry) return null;
    const memberName = roster?.operatorName || (entry && submissionMemberName(entry));
    const owners = roster ? rosterOwners(roster) : [];
    if (!memberName || owners.length > 1) return null;

    if (user) {
        if (owners.length ? owners[0] !== String(user._id) : !sameRosterName(memberName, user.name)) return null;
    } else if (owners.length) {
        user = await User.findById(owners[0]).session(session ?? null);
        if (!user || !isRemovalOperator(user) || !association.test(user.todaAssociation) || rosterBodyKey(user.bodyNumber) !== key) return null;
    } else if (key) {
        const users = await User.find(userScope).session(session ?? null);
        const matches = users.filter(candidate => rosterBodyKey(candidate.bodyNumber) === key);
        if (matches.length > 1 || (matches[0] && !sameRosterName(memberName, matches[0].name))) return null;
        user = matches[0] || null;
    }

    return { user, roster, submission, entry, key, memberName };
}

// Submit member removal / kick request (TODA President / BPLO Staff)
router.post('/removal-requests', protect, authorize('bplo_staff', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const { memberId, reason, details, todaName: bodyTodaName, targetRosterId: bodyTargetRosterId } = req.body;
        if (!memberId || !reason || !details) {
            return res.status(400).json({ message: 'Member ID, reason, and detailed explanation are required.' });
        }

        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isStaff = userRole === 'bplo_staff';

        // Determine and strictly scope target TODA association
        let todaEntry;
        if (isStaff) {
            todaEntry = getOfficialToda(bodyTodaName || req.user.todaAssociation);
        } else {
            todaEntry = getOfficialToda(req.user.todaAssociation);
            if (!todaEntry) {
                return res.status(403).json({ message: 'ACCESS DENIED: Your TODA President account must be assigned to an official TODA association.' });
            }
            if (bodyTodaName && getOfficialToda(bodyTodaName)?.id !== todaEntry.id) {
                return res.status(403).json({ message: 'ACCESS DENIED: You can only file removal requests for your own assigned TODA association.' });
            }
        }

        if (!todaEntry) {
            return res.status(400).json({ message: 'You must have a registered TODA Association to submit removal requests.' });
        }

        const presidentToda = todaEntry.id;
        const rawIdStr = String(memberId).trim();
        let selector;
        if (rawIdStr.startsWith('roster-direct-')) {
            const rosterId = rawIdStr.slice('roster-direct-'.length);
            if (mongoose.isObjectIdOrHexString(rosterId)) selector = { rosterId };
        } else if (rawIdStr.startsWith('roster-')) {
            const entryId = rawIdStr.slice('roster-'.length);
            if (mongoose.isObjectIdOrHexString(entryId)) selector = { entryId };
        } else if (mongoose.isObjectIdOrHexString(rawIdStr)) {
            const accountExists = await User.exists({ _id: rawIdStr });
            selector = accountExists ? { userId: rawIdStr } : { rosterId: rawIdStr };
        }

        const target = selector && await resolveRemovalTarget(todaEntry, selector);
        if (!target) {
            return res.status(404).json({ message: `An exact operator roster entry could not be resolved within ${presidentToda}.` });
        }
        const { user: member, roster, submission, entry, memberName: resolvedName } = target;
        if (bodyTargetRosterId && String(bodyTargetRosterId) !== String(roster?._id)) {
            return res.status(409).json({ message: 'The selected roster entry does not belong to this member.' });
        }
        const targetRosterId = roster?._id || null;
        const targetSubmissionId = submission?._id || null;
        const targetSubmissionMemberId = entry?._id ? String(entry._id) : '';
        const resolvedContact = member?.contact || roster?.contact || '';
        const resolvedAddress = member?.address || roster?.remarks || 'TODA Masterlist Member';

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
        if (error.statusCode === 409) return res.status(409).json({ message: error.message });
        console.error('Error filing removal request:', error);
        res.status(500).json({ message: 'Failed to file removal request.' });
    }
});

// Get removal requests (BPLO Staff sees all; Toda President sees for their TODA)
router.get('/removal-requests', protect, authorize('bplo_staff', 'toda president', 'toda_president'), async (req, res) => {
    try {
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isStaff = userRole === 'bplo_staff';

        let query = {};
        if (!isStaff) {
            const todaEntry = getOfficialToda(req.user.todaAssociation);
            if (!todaEntry) {
                return res.status(200).json([]);
            }
            query.todaName = todaAssociationPattern(todaEntry);
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

        const todaEntry = getOfficialToda(existing.todaName);
        if (!todaEntry) {
            return res.status(400).json({ message: 'Removal request does not specify a valid TODA association.' });
        }

        const todaExactRegex = todaAssociationPattern(todaEntry);
        const targetRosterId = existing.get('targetRosterId') || null;
        const targetSubmissionId = existing.get('targetSubmissionId') || null;
        const targetSubmissionMemberId = String(existing.get('targetSubmissionMemberId') || '');

        const request = await withRosterMutation(TodaRemovalRequest.db, async writes => {
            const pending = { _id: existing._id, status: 'Pending', updatedAt: existing.updatedAt };
            if (!(await TodaRemovalRequest.exists(pending).session(writes.session ?? null))) {
                throw rosterConflict('Removal request was already processed concurrently.');
            }
            const target = await resolveRemovalTarget(todaEntry, {
                userId: existing.member,
                rosterId: targetRosterId,
                submissionId: targetSubmissionId,
                entryId: targetSubmissionMemberId
            }, writes.session);

            if (!target || String(target.user?._id || '') !== String(existing.member || '') ||
                !sameRosterName(target.memberName, existing.memberName)) {
                throw rosterConflict('The requested member or roster affiliation has changed. File a new removal request.');
            }

            if (target.user) {
                const disaffiliated = await writes.update(User,
                    { _id: target.user._id, todaAssociation: todaExactRegex },
                    { $set: { todaAssociation: 'NON-TODA', bodyNumber: '' } }
                );
                if (!disaffiliated) throw rosterConflict('The member affiliation changed concurrently.');
                await writes.updateMany(Franchise,
                    { operator: target.user._id, todaName: todaExactRegex },
                    { $set: { todaName: 'NON-TODA', bodyNumber: '' } }
                );
            }

            const submissions = await TodaSubmission.find({ todaAssociation: todaExactRegex }).session(writes.session ?? null);
            for (const sub of submissions) {
                const keep = sub.extractedMembers.filter(item => {
                    if (String(sub._id) === String(targetSubmissionId) && String(item._id) === targetSubmissionMemberId) return false;
                    return !target.key || rosterBodyKey(submissionMemberBody(item)) !== target.key ||
                        !sameRosterName(submissionMemberName(item), target.memberName);
                });
                if (keep.length !== sub.extractedMembers.length) {
                    const updated = await writes.update(TodaSubmission,
                        { _id: sub._id, updatedAt: sub.updatedAt },
                        { $set: { extractedMembers: keep.map(item => item.toObject()), extractedCount: keep.length } }
                    );
                    if (!updated) throw rosterConflict('A masterlist changed concurrently.');
                }
            }
            if (target.roster) {
                const { _id, operatorName, registeredUser, claimedBy } = target.roster;
                const removed = await writes.remove(TodaRoster, { _id, operatorName, registeredUser: registeredUser || null, claimedBy: claimedBy || null });
                if (!removed) throw rosterConflict('The roster entry changed concurrently.');
            }
            const decided = await writes.update(TodaRemovalRequest,
                pending,
                { $set: { status: 'Approved', adminRemarks: adminRemarks.trim(), reviewedBy: req.user._id, reviewedAt: new Date() } }
            );
            if (!decided) throw rosterConflict('Removal request was already processed concurrently.');
            return decided;
        });

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
        if (error.statusCode === 409) return res.status(409).json({ message: error.message });
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
router.get('/my-submissions', protect, authorize('bplo_staff', 'toda_president'), async (req, res) => {
    try {
        const mySubmissions = await TodaSubmission.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(mySubmissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your submissions' });
    }
});

// Get members, operators, and registered tricycle units for one TODA association.
router.get('/my-members', protect, authorize('toda_president', 'bplo_staff'), async (req, res) => {
    try {
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const assignedToda = getOfficialToda(req.user.todaAssociation);
        const requestedName = req.query.todaName;
        const todaEntry = requestedName ? getOfficialToda(requestedName) : assignedToda;

        if (userRole === 'toda_president' && requestedName && (!assignedToda || todaEntry?.id !== assignedToda.id)) {
            return res.status(403).json({ message: 'ACCESS DENIED: You can only view members of your own TODA association.' });
        }
        if (requestedName && !todaEntry) {
            return res.status(400).json({ message: 'Select an official TODA association.' });
        }

        if (!todaEntry) {
            return res.status(200).json({
                todaName: req.user.todaAssociation || 'NON-TODA',
                stats: { totalMembers: 0, totalUnits: 0, activeUnits: 0, pendingUnits: 0, expiredUnits: 0 },
                members: []
            });
        }

        const todaName = todaEntry.id;
        const todaRegex = todaAssociationPattern(todaEntry);

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
            todaAssociation: todaRegex
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
        const assignedToda = getOfficialToda(req.user.todaAssociation);
        if (isTodaPres) {
            if (!assignedToda) {
                return res.status(403).json({ message: 'Your TODA President account does not have an assigned TODA association.' });
            }
            if (todaAssociation && getOfficialToda(todaAssociation)?.id !== assignedToda.id) {
                return res.status(403).json({ message: 'You can only add members to your own assigned TODA association.' });
            }
        }
        const todaEntry = isTodaPres || !todaAssociation ? assignedToda : getOfficialToda(todaAssociation);

        if (!operatorName || !operatorName.trim()) {
            return res.status(400).json({ message: 'Operator full name is required' });
        }
        if (!bodyNumber || !bodyNumber.trim()) {
            return res.status(400).json({ message: 'Assigned body number is required' });
        }
        if (!todaEntry) {
            return res.status(400).json({ message: 'TODA association could not be determined' });
        }

        const cleanName = operatorName.trim().toUpperCase();
        const cleanBodyNumber = bodyNumber.trim().toUpperCase();
        const cleanPlateNo = (plateNo || '').trim().toUpperCase();
        const cleanContact = (contact || '').trim();

        // 1. Strict Duplicate Check on Compound Key (todaAssociation + bodyNumber)
        const targetToda = todaEntry.id;
        if (!rosterBodyKey(cleanBodyNumber)) {
            return res.status(400).json({ message: 'Assigned body number is required' });
        }
        const existingBodyInRoster = await findRosterSlot(targetToda, cleanBodyNumber);

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
            if (existingPlate && getOfficialToda(existingPlate.todaName)?.id !== targetToda) {
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
            claimKey: rosterClaimKey(targetToda, cleanBodyNumber),
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
        if (error.code === 11000 || error.statusCode === 409) {
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
