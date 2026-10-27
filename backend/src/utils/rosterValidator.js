const { isNameMatch } = require('./nameMatcher');
const TodaSubmission = require('../models/todaSubmission');
const TodaRoster = require('../models/todaModel');

/**
 * Normalizes body number for flexible comparison
 * Handles formats: "GAS-001", "GAS 001", "001", "1", "POB-042", "042"
 */
function normalizeBodyNumber(raw) {
    if (!raw) return '';
    return String(raw)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .trim();
}

/**
 * Checks if two body numbers match under Gasan LGU standards
 * @param {string} inputNo 
 * @param {string} rosterNo 
 * @returns {boolean}
 */
function isBodyNumberMatch(inputNo, rosterNo) {
    if (!inputNo || !rosterNo) return false;
    const cleanA = normalizeBodyNumber(inputNo);
    const cleanB = normalizeBodyNumber(rosterNo);

    if (!cleanA || !cleanB) return false;
    if (cleanA === cleanB) return true;

    // Extract digits and optional letters
    const lettersA = cleanA.replace(/[0-9]/g, '');
    const lettersB = cleanB.replace(/[0-9]/g, '');
    const digitsA = cleanA.replace(/[^0-9]/g, '');
    const digitsB = cleanB.replace(/[^0-9]/g, '');

    // If both have letters and they contradict (e.g. "GAS" vs "BAT"), not a match
    if (lettersA && lettersB && lettersA !== lettersB) {
        return false;
    }

    // If both have numbers:
    if (digitsA && digitsB) {
        if (digitsA === digitsB) return true;
        const intA = parseInt(digitsA, 10);
        const intB = parseInt(digitsB, 10);
        if (!isNaN(intA) && !isNaN(intB) && intA === intB) return true;
    }

    return false;
}

/**
 * Builds resilient search condition for matching TODA names
 */
function buildTodaSearchRegex(todaName) {
    const clean = String(todaName || '').trim();
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Validates an operator registration applicant against the official approved TODA roster.
 * 
 * Enforces Municipal Ordinance No. 2020-04:
 * 1. Both Full Legal Name AND Assigned Body Number must exist in the certified masterlist.
 * 2. If name exists with a different body number, flags mismatch.
 * 3. If body number is assigned to a different operator, flags conflict.
 * 4. If combination does not exist, triggers official LGU advisory rejection.
 * 
 * @param {object} params
 * @param {string} params.fullName Full legal name of operator applicant
 * @param {string} params.todaAssociation TODA association selected
 * @param {string} params.bodyNumber Body number entered by applicant
 * @returns {Promise<object>} Validation report with advisory notice
 */
async function validateOperatorAgainstRoster({ fullName, todaAssociation, bodyNumber }) {
    const cleanName = String(fullName || '').trim();
    const cleanToda = String(todaAssociation || '').trim();
    const cleanBodyNo = String(bodyNumber || '').trim();

    // 1. Check for required parameters
    if (!cleanName || cleanName.length < 2) {
        return {
            isValid: false,
            status: 'missing_name',
            message: 'Kumpletong legal na pangalan ay kinakailangan.',
            advisory: null
        };
    }

    if (!cleanToda || cleanToda.toUpperCase() === 'NON-TODA' || cleanToda === '') {
        return {
            isValid: false,
            status: 'non_toda_blocked',
            message: 'Alinsunod sa Municipal Ordinance No. 2020-04, kailangang pumili ng accredited TODA Association ang operator.',
            advisory: {
                title: 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN',
                department: 'Business Permits and Licensing Office (BPLO) / Tanggapan ng Sangguniang Bayan',
                ordinance: 'Municipal Ordinance No. 2020-04 (Tricycle Franchising & Regulatory Code)',
                reason: 'Hindi pinapahintulutan ang self-registration bilang NON-TODA nang walang paunang municipal legislative authorization.',
                details: {
                    fullName: cleanName,
                    todaAssociation: 'NON-TODA',
                    bodyNumber: cleanBodyNo || 'N/A'
                },
                action: 'Pumili ng opisyal na TODA na sumasakop sa inyong barangay o makipag-ugnayan sa BPLO.'
            }
        };
    }

    if (!cleanBodyNo) {
        return {
            isValid: false,
            status: 'missing_body_number',
            message: 'Ang Assigned Body Number (mula sa TODA Masterlist) ay kinakailangan.',
            advisory: null
        };
    }

    const todaRegex = buildTodaSearchRegex(cleanToda);

    // 2. Fetch official members from:
    //    A. Approved TodaSubmission records (from TODA President uploads)
    //    B. TodaRoster records (direct masterlist collection)
    const approvedSubmissions = await TodaSubmission.find({
        status: 'Approved',
        $or: [{ todaAssociation: todaRegex }, { fileName: todaRegex }]
    }).select('extractedMembers todaAssociation fileName createdAt').lean();

    const directRosterMembers = await TodaRoster.find({
        todaAssociation: todaRegex,
        status: 'Active'
    }).lean();

    // Aggregate all official members into normalized list
    const combinedMembers = [];

    for (const sub of approvedSubmissions) {
        if (Array.isArray(sub.extractedMembers)) {
            for (const m of sub.extractedMembers) {
                const name = (m.operatorName || m.name || '').trim();
                const bNo = (m.bodyNumber || m.unitNo || '').trim();
                if (name) {
                    combinedMembers.push({
                        operatorName: name,
                        bodyNumber: bNo,
                        plateNo: m.plateNo || '',
                        source: 'submission',
                        submissionId: sub._id
                    });
                }
            }
        }
    }

    for (const rm of directRosterMembers) {
        combinedMembers.push({
            operatorName: rm.operatorName,
            bodyNumber: rm.bodyNumber,
            plateNo: rm.plateNo || '',
            source: 'roster',
            rosterId: rm._id
        });
    }

    // If no approved roster exists at all for this TODA
    if (combinedMembers.length === 0) {
        return {
            isValid: false,
            status: 'no_roster_on_file',
            message: `Wala pang opisyal na aprubadong masterlist na nakalagak sa BPLO para sa ${cleanToda}.`,
            advisory: {
                title: 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN',
                department: 'Business Permits and Licensing Office (BPLO) / OVM Franchising Unit',
                ordinance: 'Municipal Ordinance No. 2020-04, Serye ng 2020 (Section 4 - Mandatory Roster Certification)',
                reason: `Kasalukuyang wala pang sertipikadong digital masterlist na naisusumite at naaprubahan para sa ${cleanToda}.`,
                details: {
                    fullName: cleanName,
                    todaAssociation: cleanToda,
                    bodyNumber: cleanBodyNo,
                    status: 'PENDING TODA PRESIDENT SUBMISSION'
                },
                action: `Mangyaring abisuhan ang Pangulo ng ${cleanToda} na isumite ang opisyal na Masterlist ng mga miyembro sa portal para sa pagsusuri ng BPLO bago magrehistro.`
            }
        };
    }

    // 3. Evaluate exact and partial matches
    let exactMatch = null;
    let nameMatchWithOtherBodyNo = null;
    let bodyNoMatchWithOtherName = null;

    for (const record of combinedMembers) {
        const isName = isNameMatch(cleanName, record.operatorName);
        const isBody = isBodyNumberMatch(cleanBodyNo, record.bodyNumber);

        if (isName && isBody) {
            exactMatch = record;
            break;
        }

        if (isName && !isBody && record.bodyNumber) {
            nameMatchWithOtherBodyNo = record;
        }

        if (!isName && isBody) {
            bodyNoMatchWithOtherName = record;
        }
    }

    // Scenario 1: Exact Match (VALID)
    if (exactMatch) {
        return {
            isValid: true,
            status: 'verified',
            matchedMember: exactMatch.operatorName,
            matchedBodyNumber: exactMatch.bodyNumber,
            plateNo: exactMatch.plateNo,
            message: `Napatunayan: Si "${exactMatch.operatorName}" ay opisyal na nakatala sa ${cleanToda} bilang may-ari ng Body No. ${exactMatch.bodyNumber}.`,
            advisory: null
        };
    }

    // Scenario 2: Name found, but Body Number doesn't match
    if (nameMatchWithOtherBodyNo) {
        return {
            isValid: false,
            status: 'wrong_body_number',
            matchedMember: nameMatchWithOtherBodyNo.operatorName,
            expectedBodyNumber: nameMatchWithOtherBodyNo.bodyNumber,
            message: `Ang inyong pangalan ay nakatala sa ${cleanToda}, ngunit ang nakatalagang Body Number sa opisyal na masterlist ay "${nameMatchWithOtherBodyNo.bodyNumber}" (inilagay: "${cleanBodyNo}").`,
            advisory: {
                title: 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN',
                department: 'Business Permits and Licensing Office (BPLO) / Tricycle Franchising Division',
                ordinance: 'Municipal Ordinance No. 2020-04 (Body Number Allocation & Integrity)',
                reason: `Hindi tumutugma ang inilagay na Body Number (${cleanBodyNo}) sa opisyal na talaan ng ${cleanToda}.`,
                details: {
                    fullName: cleanName,
                    todaAssociation: cleanToda,
                    enteredBodyNumber: cleanBodyNo,
                    officialBodyNumber: nameMatchWithOtherBodyNo.bodyNumber || 'Hindi Naitakda'
                },
                action: `Pakiwasto ang inyong inilagay na Body Number ayon sa inyong opisyal na prangkisa/endorsement, o makipag-ugnayan sa inyong TODA President kung may pagbabago sa unit.`
            }
        };
    }

    // Scenario 3: Body Number is registered to a different operator
    if (bodyNoMatchWithOtherName) {
        return {
            isValid: false,
            status: 'body_number_taken',
            conflictMember: bodyNoMatchWithOtherName.operatorName,
            message: `Ang Body No. "${cleanBodyNo}" ay nakatalaga na sa ibang operator ("${bodyNoMatchWithOtherName.operatorName}") sa opisyal na masterlist ng ${cleanToda}.`,
            advisory: {
                title: 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN',
                department: 'Business Permits and Licensing Office (BPLO) / Office of the Municipal Mayor',
                ordinance: 'Municipal Ordinance No. 2020-04 (Anti-Duplication of Tricycle Body Numbers)',
                reason: `Ang Body Number ${cleanBodyNo} ay may umiiral nang lehitimong operator sa ${cleanToda}.`,
                details: {
                    fullName: cleanName,
                    todaAssociation: cleanToda,
                    enteredBodyNumber: cleanBodyNo,
                    registeredTo: bodyNoMatchWithOtherName.operatorName
                },
                action: 'Ipinagbabawal ang duplicate registration ng iisang Body Number. Kung may transaksyon ng bentahan o transfer of unit, mangyaring dalhin ang opisyal na Deed of Sale at TODA Board Resolution sa BPLO.'
            }
        };
    }

    // Scenario 4: Neither Name nor Body Number matches (HARANG)
    return {
        isValid: false,
        status: 'not_in_roster',
        message: `Ang kombinasyon ng pangalan "${cleanName}" at Body Number "${cleanBodyNo}" ay HINDI nakatala sa opisyal na masterlist ng ${cleanToda}.`,
        advisory: {
            title: 'OPISYAL NA ADVISORY NG PAMAHALAANG BAYAN NG GASAN',
            department: 'Business Permits and Licensing Office (BPLO) / Tanggapan ng Sangguniang Bayan',
            ordinance: 'Municipal Ordinance No. 2020-04 (Mandatory Roster Endorsement)',
            reason: `Walang natagpuang aprubadong rekord sa opisyal na masterlist ng ${cleanToda} para sa pangalang "${cleanName}" at Body No. "${cleanBodyNo}".`,
            details: {
                fullName: cleanName,
                todaAssociation: cleanToda,
                bodyNumber: cleanBodyNo,
                status: 'UNAUTHORIZED / UNLISTED OPERATOR APPLICANT'
            },
            action: `Alinsunod sa umiiral na regulasyon ng Munisipalidad ng Gasan, tanging ang mga operator na nasa sertipikadong masterlist ng TODA ang maaaring magbukas ng account. Mangyaring makipag-ugnayan agad sa inyong TODA President upang maisama ang inyong pangalan at unit sa susunod na opisyal na pagsusumite sa BPLO.`
        }
    };
}

module.exports = {
    normalizeBodyNumber,
    isBodyNumberMatch,
    validateOperatorAgainstRoster
};
