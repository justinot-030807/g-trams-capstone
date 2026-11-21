const { 
    validateOperatorAgainstRoster,
    isBodyNumberTaken,
    generateNextBodyNumber
} = require('../utils/rosterValidator');
const TodaSubmission = require('../models/todaSubmission');
const TodaRoster = require('../models/todaModel');
const { findRosterSlot, rosterAssociation, rosterBodyKey, rosterClaimKey, rosterConflict, sameRosterName } = require('../utils/rosterClaims');

const rosterIneligible = {
    success: false,
    verified: false,
    status: 'not_in_roster',
    message: 'The supplied details could not be verified against the official TODA roster.',
    advisory: { action: 'Verify the submitted details or contact your TODA President or BPLO for assistance.' }
};
exports.rosterIneligible = rosterIneligible;
/**
 * Controller to fetch the next sequential unique body number for a TODA association.
 * Route: GET /api/v1/toda/next-body-number
 */
exports.getNextBodyNumber = async (req, res) => {
    try {
        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isTodaPresident = userRole === 'toda_president';

        let todaAssociation = (req.query.todaAssociation || req.user?.todaAssociation || '').trim();
        if (isTodaPresident) {
            const assignedToda = String(req.user?.todaAssociation || '').trim();
            if (!assignedToda || assignedToda.toUpperCase() === 'NON-TODA') {
                return res.status(403).json({
                    success: false,
                    message: 'ACCESS DENIED: Your TODA President account does not have an assigned TODA association.'
                });
            }
            if (req.query.todaAssociation && String(req.query.todaAssociation).trim().toUpperCase() !== assignedToda.toUpperCase()) {
                return res.status(403).json({
                    success: false,
                    message: 'ACCESS DENIED: You can only query body numbers for your own assigned TODA association.'
                });
            }
            todaAssociation = assignedToda;
        }

        if (!todaAssociation || todaAssociation === 'NON-TODA') {
            return res.status(400).json({
                success: false,
                message: 'Kailangang tukuyin ang TODA Association upang makabuo ng Body Number.'
            });
        }

        const nextBodyNumber = await generateNextBodyNumber(todaAssociation);
        return res.status(200).json({
            success: true,
            todaAssociation,
            nextBodyNumber
        });
    } catch (error) {
        console.error('Error in getNextBodyNumber:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error generating next body number.'
        });
    }
};

/**
 * Controller to register an individual member to a TODA roster (when a single operator joins).
 * Strictly guarantees NO duplicate body numbers.
 * Route: POST /api/v1/toda/members/individual
 */
exports.addIndividualMember = async (req, res) => {
    try {
        const { operatorName, name, todaAssociation, bodyNumber, plateNo, contact, remarks } = req.body;
        const applicantName = String(operatorName || name || '').trim().replace(/\s+/g, ' ');

        if (!applicantName || applicantName.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Kumpletong legal na pangalan ng operator ay kinakailangan (minimum 2 characters).'
            });
        }

        const userRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isBploStaff = userRole === 'bplo_staff';
        const isTodaPresident = userRole === 'toda_president';

        if (!isBploStaff && !isTodaPresident) {
            return res.status(403).json({
                success: false,
                message: 'ACCESS DENIED: Only BPLO Staff or a verified TODA President can add roster members.'
            });
        }

        let targetToda = String(todaAssociation || req.user?.todaAssociation || '').trim();
        if (isTodaPresident) {
            if (req.user?.isVerified === false) {
                return res.status(403).json({
                    success: false,
                    message: 'ACCESS DENIED: Your TODA President account must be verified.'
                });
            }
            const assignedToda = String(req.user?.todaAssociation || '').trim();
            if (!assignedToda || assignedToda.toUpperCase() === 'NON-TODA') {
                return res.status(403).json({
                    success: false,
                    message: 'ACCESS DENIED: Your TODA President account does not have an assigned TODA association.'
                });
            }
            if (todaAssociation && String(todaAssociation).trim().toUpperCase() !== assignedToda.toUpperCase()) {
                return res.status(403).json({
                    success: false,
                    message: 'ACCESS DENIED: You can only add members to your own assigned TODA association.'
                });
            }
            // TODA President can only add to their own TODA
            targetToda = assignedToda;
        }

        if (!targetToda || targetToda.toUpperCase() === 'NON-TODA') {
            return res.status(400).json({
                success: false,
                message: 'Kailangang tukuyin ang opisyal na TODA Association kung saan idaragdag ang miyembro.'
            });
        }

        // Determine / Auto-generate Body Number
        let assignedBodyNumber = String(bodyNumber || '').trim().toUpperCase();
        const isAutoGenerated = !assignedBodyNumber;

        // Check if operator with same name already exists in this TODA
        const existingMember = await TodaRoster.findOne({
            todaAssociation: targetToda,
            operatorName: { $regex: new RegExp(`^${applicantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: `Si "${applicantName}" ay nakatala na bilang miyembro ng ${targetToda} na may Body Number "${existingMember.bodyNumber}".`
            });
        }

        let attempts = 0;
        const MAX_RETRIES = 5;
        let newRosterMember = null;

        while (attempts <= MAX_RETRIES) {
            try {
                if (isAutoGenerated) {
                    assignedBodyNumber = await generateNextBodyNumber(targetToda);
                } else if (attempts === 0) {
                    const slot = await findRosterSlot(targetToda, assignedBodyNumber);
                    const takenCheck = slot
                        ? { isTaken: true, matchedBodyNumber: slot.bodyNumber, ownerName: slot.operatorName }
                        : await isBodyNumberTaken(assignedBodyNumber, targetToda);
                    if (takenCheck.isTaken) {
                        const suggestedBodyNumber = await generateNextBodyNumber(targetToda).catch(() => null);
                        return res.status(409).json({
                            success: false,
                            message: `DUPLICATE BODY NUMBER HARANG: ${takenCheck.reason || `Ang Body Number "${assignedBodyNumber}" ay nakatalaga na sa ${targetToda}.`}`,
                            matchedBodyNumber: takenCheck.matchedBodyNumber,
                            ownerName: takenCheck.ownerName,
                            suggestedBodyNumber
                        });
                    }
                }

                newRosterMember = await TodaRoster.create({
                    todaAssociation: targetToda,
                    operatorName: applicantName,
                    bodyNumber: assignedBodyNumber,
                    claimKey: rosterClaimKey(targetToda, assignedBodyNumber),
                    plateNo: String(plateNo || '').trim().toUpperCase(),
                    contact: String(contact || '').trim(),
                    status: 'Active',
                    remarks: remarks || `Individually registered by ${req.user.name} (${req.user.role}) on ${new Date().toLocaleDateString('en-PH')}`
                });
                break; // Creation succeeded
            } catch (createErr) {
                if (createErr.code === 11000 && isAutoGenerated && attempts < MAX_RETRIES) {
                    attempts++;
                    const jitterMs = (attempts * 25) + Math.floor(Math.random() * 40);
                    await new Promise(r => setTimeout(r, jitterMs));
                    continue;
                }
                throw createErr;
            }
        }

        // Also add or append to an approved TodaSubmission for this TODA atomically ($push, $inc)
        let activeSubmission = await TodaSubmission.findOneAndUpdate(
            { todaAssociation: targetToda, status: 'Approved' },
            {
                $push: {
                    extractedMembers: {
                        name: applicantName,
                        operatorName: applicantName,
                        bodyNumber: assignedBodyNumber,
                        unitNo: assignedBodyNumber,
                        plateNo: String(plateNo || '').trim().toUpperCase(),
                        confidence: 1.0
                    }
                },
                $inc: { extractedCount: 1 }
            },
            { sort: { createdAt: -1 }, returnDocument: 'after' }
        );

        if (!activeSubmission) {
            // Create a dedicated individual addition masterlist submission if none currently exists
            await TodaSubmission.create({
                submittedBy: req.user._id,
                presidentName: req.user.name || 'TODA Administration',
                fileName: `Individual_Addition_${targetToda}_${Date.now()}.json`,
                filePath: 'individual_entry',
                status: 'Approved',
                todaAssociation: targetToda,
                extractedCount: 1,
                extractedMembers: [{
                    name: applicantName,
                    operatorName: applicantName,
                    bodyNumber: assignedBodyNumber,
                    unitNo: assignedBodyNumber,
                    plateNo: String(plateNo || '').trim().toUpperCase(),
                    confidence: 1.0
                }],
                ocrNotes: `Individual member joined: ${applicantName} (Body No. ${assignedBodyNumber})`
            });
        }

        return res.status(201).json({
            success: true,
            message: `Matagumpay na naidagdag si "${applicantName}" sa ${targetToda} na may natatanging Body Number: ${assignedBodyNumber}.`,
            member: newRosterMember
        });
    } catch (error) {
        console.error('Error in addIndividualMember:', error);
        if (error.code === 11000 || error.statusCode === 409) {
            const suggested = await generateNextBodyNumber(req.body.todaAssociation || req.user?.todaAssociation || '').catch(() => null);
            return res.status(409).json({
                success: false,
                message: 'DUPLICATE BODY NUMBER HARANG: Ang Body Number ay nakatalaga na sa asosasyong ito.',
                suggestedBodyNumber: suggested
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error while adding individual TODA member.'
        });
    }
};

/**
 * Controller for pre-registration TODA roster verification.
 * Enforces strict pre-registration validation against official TODA masterlist records.
 * Route: POST /api/v1/auth/verify-roster
 */
exports.verifyTodaRoster = async (req, res) => {
    try {
        const { fullName, name, todaAssociation, bodyNumber } = req.body;
        const applicantName = fullName || name;

        if (!applicantName || !todaAssociation || !bodyNumber) {
            return res.status(400).json({
                success: false,
                verified: false,
                message: 'Full Name, TODA Association, at Assigned Body Number ay kailangang punan.'
            });
        }

        const report = await validateOperatorAgainstRoster({
            fullName: applicantName,
            todaAssociation,
            bodyNumber
        });

        if (report.isValid) {
            return res.status(200).json({
                success: true,
                verified: true,
                status: 'verified',
                message: 'TODA roster eligibility verified.'
            });
        }

        return res.status(403).json(rosterIneligible);
    } catch (error) {
        console.error('Error in verifyTodaRoster:', error);
        return res.status(500).json({
            success: false,
            verified: false,
            message: 'Server error while verifying TODA roster.'
        });
    }
};

/**
 * Publishes approved members through the same mutation boundary as the decision.
 */
exports.syncSubmissionToRoster = async (submission, writes) => {
    if (!submission) return { syncedCount: 0 };
    if (submission.status !== 'Approved') return { syncedCount: 0 };

    const todaAssociation = rosterAssociation(submission.todaAssociation).id;
    if (!todaAssociation || !Array.isArray(submission.extractedMembers)) return { syncedCount: 0 };

    let syncedCount = 0;
    for (const m of submission.extractedMembers) {
        const operatorName = (m.operatorName || m.name || '').trim();
        const bodyNumber = (m.bodyNumber || m.unitNo || '').trim().toUpperCase();

        if (operatorName && rosterBodyKey(bodyNumber)) {
            const existing = await findRosterSlot(todaAssociation, bodyNumber, writes.session);
            if (existing && !sameRosterName(existing.operatorName, operatorName)) {
                throw rosterConflict('This Body Number is assigned to a different member. Reconcile the roster before approval.');
            }
            const fields = { claimKey: rosterClaimKey(todaAssociation, bodyNumber), submissionRef: submission._id };
            if (m.plateNo) fields.plateNo = m.plateNo;
            if (existing) {
                const updated = await writes.update(TodaRoster, { _id: existing._id, operatorName: existing.operatorName }, { $set: fields });
                if (!updated) throw rosterConflict('The roster entry changed concurrently. Please refresh and try again.');
            } else {
                await writes.create(TodaRoster, { todaAssociation, operatorName, bodyNumber, ...fields });
            }
            syncedCount += 1;
        }
    }

    return { syncedCount };
};

// Backward-compatible alias
exports.syncApprovedRoster = exports.syncSubmissionToRoster;
