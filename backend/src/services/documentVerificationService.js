const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

/**
 * Normalizes text for lenient comparison (removes whitespace, hyphens, punctuation, upper-cased)
 */
function normalizeString(val) {
    if (!val) return '';
    return String(val)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/**
 * Compares entered value with AI extracted value
 */
function compareField(inputVal, extractedVal, fieldLabel, fieldKey) {
    const inputClean = normalizeString(inputVal);
    const extractedClean = normalizeString(extractedVal);

    if (!extractedVal || extractedClean === '' || extractedClean === 'NOTFOUND' || extractedClean === 'UNCLEAR') {
        return {
            field: fieldKey,
            label: fieldLabel,
            inputValue: inputVal || 'N/A',
            extractedValue: 'Hindi mabasa / Malabo',
            status: 'unclear',
            confidence: 0.5,
            notes: 'Hindi malinaw o hindi makita sa larawan ng dokumento'
        };
    }

    if (!inputVal || inputClean === '') {
        return {
            field: fieldKey,
            label: fieldLabel,
            inputValue: 'Walang in-enter',
            extractedValue: String(extractedVal),
            status: 'unclear',
            confidence: 0.6,
            notes: 'Nasa dokumento ngunit walang in-enter na halaga ang operator'
        };
    }

    if (inputClean === extractedClean) {
        return {
            field: fieldKey,
            label: fieldLabel,
            inputValue: String(inputVal),
            extractedValue: String(extractedVal),
            status: 'match',
            confidence: 0.98,
            notes: 'Perpektong tugma ang in-enter na impormasyon sa dokumento'
        };
    }

    // Check partial containment (e.g. "ABC12345" vs "12345" or extra serial codes)
    if (inputClean.length >= 4 && (extractedClean.includes(inputClean) || inputClean.includes(extractedClean))) {
        return {
            field: fieldKey,
            label: fieldLabel,
            inputValue: String(inputVal),
            extractedValue: String(extractedVal),
            status: 'match',
            confidence: 0.88,
            notes: 'Tugma (may kaunting pagkakaiba sa prefix o format)'
        };
    }

    return {
        field: fieldKey,
        label: fieldLabel,
        inputValue: String(inputVal),
        extractedValue: String(extractedVal),
        status: 'mismatch',
        confidence: 0.95,
        notes: `Hindi tugma: In-enter [${inputVal}], ngunit nakita sa dokumento [${extractedVal}]`
    };
}

/**
 * Downloads image from URL and converts to base64
 */
async function fetchImageAsBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'Accept': 'image/*,application/pdf'
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64Data = Buffer.from(response.data).toString('base64');
        return { base64Data, mimeType: contentType.split(';')[0] };
    } catch (err) {
        console.warn(`[DocVerify] Could not fetch image from ${url}:`, err.message);
        return null;
    }
}

/**
 * Extracts structured JSON from document image using Gemini Vision (multimodal)
 */
async function extractWithGemini(base64Data, mimeType, docType) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        let prompt = '';
        if (docType === 'orCr') {
            prompt = `You are a Philippine Land Transportation Office (LTO) document specialist.
Carefully inspect this image. First determine if this image is genuinely an Official Receipt (OR) or Certificate of Registration (CR) from LTO.
Extract the following vehicle details and return ONLY a valid JSON object with these keys:
{
  "isExpectedDocumentType": true/false (false if this is NOT an LTO OR or CR, e.g. selfie, wrong doc, receipt, blurred non-document),
  "detectedDocumentType": "LTO Official Receipt / Certificate of Registration" or description of what the image actually is,
  "plateNo": "extracted plate number or MV file number, or null if unreadable",
  "chassisNo": "extracted chassis or frame number, or null if unreadable",
  "motorNo": "extracted engine or motor number, or null if unreadable",
  "orCrNo": "extracted OR number or CR number, or null if unreadable",
  "ownerName": "extracted registered owner full name, or null if unreadable",
  "expiryDate": "extracted expiration or registration date (YYYY-MM-DD), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'license') {
            prompt = `You are a Philippine Land Transportation Office (LTO) driver's license specialist.
Carefully inspect this image. First determine if this image is genuinely a Philippine Driver's License card.
Extract the following details and return ONLY a valid JSON object with these keys:
{
  "isExpectedDocumentType": true/false (false if this is NOT a Driver's License),
  "detectedDocumentType": "Driver's License" or description of what the image actually is,
  "licenseNo": "extracted driver license number, or null if unreadable",
  "driverName": "extracted full name of driver/licensee, or null if unreadable",
  "expiryDate": "extracted expiration date (YYYY-MM-DD), or null if unreadable"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'cedula') {
            prompt = `You are a Philippine Municipal Treasury specialist.
Carefully inspect this image. First determine if this image is genuinely a Community Tax Certificate (Cedula / CTC).
Extract the following details and return ONLY a valid JSON object with these keys:
{
  "isExpectedDocumentType": true/false (false if this is NOT a Community Tax Certificate / Cedula),
  "detectedDocumentType": "Community Tax Certificate (Cedula)" or description of what the image actually is,
  "serialNo": "extracted CTC / Cedula serial or receipt number, or null if unreadable",
  "fullName": "extracted taxpayer full name, or null if unreadable",
  "year": "extracted tax year (e.g. 2026), or null if unreadable",
  "dateIssued": "extracted date issued (YYYY-MM-DD), or null if unreadable"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'todaEndorsement') {
            prompt = `You are a Tricycle Operators and Drivers Association (TODA) endorsement inspector.
Carefully inspect this image. First determine if this image is genuinely a TODA Endorsement or Certificate of Membership.
Extract the following details and return ONLY a valid JSON object with these keys:
{
  "isExpectedDocumentType": true/false (false if this is NOT a TODA Endorsement),
  "detectedDocumentType": "TODA Endorsement Certificate" or description of what the image actually is,
  "certNo": "extracted certificate or clearance number, or null",
  "memberName": "extracted member/driver/operator name, or null",
  "todaName": "extracted TODA association name (e.g. BATODA, GT TODA), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'brgyClearance') {
            prompt = `You are a Philippine Barangay clearance inspector.
Carefully inspect this image. First determine if this image is genuinely a Barangay Clearance.
Extract the following details and return ONLY a valid JSON object with these keys:
{
  "isExpectedDocumentType": true/false (false if this is NOT a Barangay Clearance),
  "detectedDocumentType": "Barangay Clearance" or description of what the image actually is,
  "clearanceNo": "extracted clearance or control number, or null",
  "residentName": "extracted resident/applicant name, or null",
  "barangay": "extracted barangay name, or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        }

        // Try primary model gemini-3.8-flash (or gemini-2.5-flash fallback)
        let responseText = null;
        try {
            const interaction = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType || 'image/jpeg',
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ]
            });
            responseText = interaction.text || (interaction.candidates?.[0]?.content?.parts?.[0]?.text);
        } catch (callErr) {
            console.warn('[DocVerify] gemini-3.8-flash call failed, trying gemini-2.5-flash:', callErr.message);
            const fallbackInteraction = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType || 'image/jpeg',
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ]
            });
            responseText = fallbackInteraction.text || (fallbackInteraction.candidates?.[0]?.content?.parts?.[0]?.text);
        }

        if (!responseText) return null;

        // Clean any code fences
        const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error(`[DocVerify] Gemini OCR error for ${docType}:`, err.message);
        return null;
    }
}

/**
 * Main verification engine: Cross-references franchise inputs with attached document images
 */
async function verifyFranchiseDocuments(franchise) {
    const results = {
        status: 'verified',
        verifiedAt: new Date(),
        summary: {
            totalFields: 0,
            matchedFields: 0,
            mismatchedFields: 0,
            unclearFields: 0
        },
        documents: {},
        overallNotes: ''
    };

    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

    // 1. VERIFY LTO OR/CR
    if (franchise.orCrUrl) {
        const imageInfo = await fetchImageAsBase64(franchise.orCrUrl);
        let extracted = null;
        if (imageInfo && hasApiKey) {
            extracted = await extractWithGemini(imageInfo.base64Data, imageInfo.mimeType, 'orCr');
        }

        if (!extracted) {
            results.documents.orCr = {
                hasDocument: true,
                extracted: null,
                comparisons: [],
                status: 'unverified',
                ocrNotes: 'OCR scan unavailable or rate-limited. Manual verification required.'
            };
        } else {
            const comparisons = [];

            if (extracted.isExpectedDocumentType === false) {
                comparisons.push({
                    field: 'docType',
                    label: 'Document Authenticity & Type',
                    inputValue: 'LTO OR / CR',
                    extractedValue: extracted.detectedDocumentType || 'Unrecognized / Wrong Document',
                    status: 'mismatch',
                    confidence: 0.95,
                    notes: 'Ang larawang na-upload ay hindi lehitimong LTO OR/CR.'
                });
            } else {
                comparisons.push(
                    compareField(franchise.chassisNo, extracted.chassisNo, 'Chassis Serial Number', 'chassisNo'),
                    compareField(franchise.motorNo, extracted.motorNo, 'Motor / Engine Number', 'motorNo'),
                    compareField(franchise.plateNo, extracted.plateNo, 'Plate Number', 'plateNo')
                );

                if (franchise.orCrNo) {
                    comparisons.push(compareField(franchise.orCrNo, extracted.orCrNo, 'LTO OR/CR Number', 'orCrNo'));
                }
            }

            const hasMismatch = comparisons.some(c => c.status === 'mismatch');
            const allMatch = comparisons.length > 0 && comparisons.every(c => c.status === 'match');

            results.documents.orCr = {
                hasDocument: true,
                extracted,
                comparisons,
                status: extracted.isExpectedDocumentType === false ? 'wrong_document_type' : (hasMismatch ? 'mismatch' : (allMatch ? 'match' : 'unclear'))
            };
        }
    } else {
        results.documents.orCr = { hasDocument: false, status: 'missing', comparisons: [] };
    }

    // 2. VERIFY DRIVER'S LICENSE
    if (franchise.licenseUrl) {
        const imageInfo = await fetchImageAsBase64(franchise.licenseUrl);
        let extracted = null;
        if (imageInfo && hasApiKey) {
            extracted = await extractWithGemini(imageInfo.base64Data, imageInfo.mimeType, 'license');
        }

        if (!extracted) {
            results.documents.license = {
                hasDocument: true,
                extracted: null,
                comparisons: [],
                status: 'unverified',
                ocrNotes: 'OCR scan unavailable or rate-limited. Manual verification required.'
            };
        } else {
            const comparisons = [];
            const targetDriverName = (!franchise.isOperatorDriver && franchise.driverName) ? franchise.driverName : franchise.fullName;

            if (extracted.isExpectedDocumentType === false) {
                comparisons.push({
                    field: 'docType',
                    label: 'Document Authenticity & Type',
                    inputValue: "Driver's License",
                    extractedValue: extracted.detectedDocumentType || 'Unrecognized / Wrong Document',
                    status: 'mismatch',
                    confidence: 0.95,
                    notes: "Ang larawang na-upload ay hindi lehitimong Driver's License."
                });
            } else {
                comparisons.push(
                    compareField(franchise.driverLicenseNo, extracted.licenseNo, "Driver's License Number", 'driverLicenseNo'),
                    compareField(targetDriverName, extracted.driverName, 'Authorized Driver Name', 'driverName')
                );
            }

            const hasMismatch = comparisons.some(c => c.status === 'mismatch');
            const allMatch = comparisons.length > 0 && comparisons.every(c => c.status === 'match');

            results.documents.license = {
                hasDocument: true,
                extracted,
                comparisons,
                status: extracted.isExpectedDocumentType === false ? 'wrong_document_type' : (hasMismatch ? 'mismatch' : (allMatch ? 'match' : 'unclear'))
            };
        }
    } else {
        results.documents.license = { hasDocument: false, status: 'missing', comparisons: [] };
    }

    // 3. VERIFY CEDULA (CTC)
    if (franchise.cedulaUrl) {
        const imageInfo = await fetchImageAsBase64(franchise.cedulaUrl);
        let extracted = null;
        if (imageInfo && hasApiKey) {
            extracted = await extractWithGemini(imageInfo.base64Data, imageInfo.mimeType, 'cedula');
        }

        if (!extracted) {
            results.documents.cedula = {
                hasDocument: true,
                extracted: null,
                comparisons: [],
                status: 'unverified',
                ocrNotes: 'OCR scan unavailable or rate-limited. Manual verification required.'
            };
        } else {
            const comparisons = [];

            if (extracted.isExpectedDocumentType === false) {
                comparisons.push({
                    field: 'docType',
                    label: 'Document Authenticity & Type',
                    inputValue: 'Community Tax Certificate (Cedula)',
                    extractedValue: extracted.detectedDocumentType || 'Unrecognized / Wrong Document',
                    status: 'mismatch',
                    confidence: 0.95,
                    notes: 'Ang larawang na-upload ay hindi lehitimong Cedula (CTC).'
                });
            } else {
                comparisons.push(compareField(franchise.cedulaSerialNo, extracted.serialNo, 'Cedula / CTC Serial No', 'cedulaSerialNo'));
            }

            const hasMismatch = comparisons.some(c => c.status === 'mismatch');
            const allMatch = comparisons.length > 0 && comparisons.every(c => c.status === 'match');

            results.documents.cedula = {
                hasDocument: true,
                extracted,
                comparisons,
                status: extracted.isExpectedDocumentType === false ? 'wrong_document_type' : (hasMismatch ? 'mismatch' : (allMatch ? 'match' : 'unclear'))
            };
        }
    } else {
        results.documents.cedula = { hasDocument: false, status: 'missing', comparisons: [] };
    }

    // 4. VERIFY TODA ENDORSEMENT
    if (franchise.todaEndorsementUrl) {
        const imageInfo = await fetchImageAsBase64(franchise.todaEndorsementUrl);
        let extracted = null;
        if (imageInfo && hasApiKey) {
            extracted = await extractWithGemini(imageInfo.base64Data, imageInfo.mimeType, 'todaEndorsement');
        }

        if (!extracted) {
            results.documents.todaEndorsement = {
                hasDocument: true,
                extracted: null,
                comparisons: [],
                status: 'unverified',
                ocrNotes: 'OCR scan unavailable or rate-limited. Manual verification required.'
            };
        } else {
            const comparisons = [];

            if (extracted.isExpectedDocumentType === false) {
                comparisons.push({
                    field: 'docType',
                    label: 'Document Authenticity & Type',
                    inputValue: 'TODA Endorsement Certificate',
                    extractedValue: extracted.detectedDocumentType || 'Unrecognized / Wrong Document',
                    status: 'mismatch',
                    confidence: 0.95,
                    notes: 'Ang larawang na-upload ay hindi lehitimong TODA Endorsement.'
                });
            } else {
                comparisons.push(compareField(franchise.todaName, extracted.todaName, 'Accredited TODA Association', 'todaName'));
                if (franchise.todaCertNo) {
                    comparisons.push(compareField(franchise.todaCertNo, extracted.certNo, 'TODA Certificate No', 'todaCertNo'));
                }
            }

            const hasMismatch = comparisons.some(c => c.status === 'mismatch');
            const allMatch = comparisons.length > 0 && comparisons.every(c => c.status === 'match');

            results.documents.todaEndorsement = {
                hasDocument: true,
                extracted,
                comparisons,
                status: extracted.isExpectedDocumentType === false ? 'wrong_document_type' : (hasMismatch ? 'mismatch' : (allMatch ? 'match' : 'unclear'))
            };
        }
    } else {
        results.documents.todaEndorsement = { hasDocument: false, status: 'missing', comparisons: [] };
    }

    // 5. VERIFY BARANGAY CLEARANCE
    if (franchise.brgyClearanceUrl) {
        const imageInfo = await fetchImageAsBase64(franchise.brgyClearanceUrl);
        let extracted = null;
        if (imageInfo && hasApiKey) {
            extracted = await extractWithGemini(imageInfo.base64Data, imageInfo.mimeType, 'brgyClearance');
        }

        if (!extracted) {
            results.documents.brgyClearance = {
                hasDocument: true,
                extracted: null,
                comparisons: [],
                status: 'unverified',
                ocrNotes: 'OCR scan unavailable or rate-limited. Manual verification required.'
            };
        } else {
            const comparisons = [];

            if (extracted.isExpectedDocumentType === false) {
                comparisons.push({
                    field: 'docType',
                    label: 'Document Authenticity & Type',
                    inputValue: 'Barangay Clearance',
                    extractedValue: extracted.detectedDocumentType || 'Unrecognized / Wrong Document',
                    status: 'mismatch',
                    confidence: 0.95,
                    notes: 'Ang larawang na-upload ay hindi lehitimong Barangay Clearance.'
                });
            } else if (franchise.brgyClearanceNo) {
                comparisons.push(compareField(franchise.brgyClearanceNo, extracted.clearanceNo, 'Barangay Clearance No', 'brgyClearanceNo'));
            }

            const hasMismatch = comparisons.some(c => c.status === 'mismatch');
            const allMatch = comparisons.length > 0 && comparisons.every(c => c.status === 'match');

            results.documents.brgyClearance = {
                hasDocument: true,
                extracted,
                comparisons,
                status: extracted.isExpectedDocumentType === false ? 'wrong_document_type' : (hasMismatch ? 'mismatch' : (allMatch ? 'match' : 'unclear'))
            };
        }
    } else {
        results.documents.brgyClearance = { hasDocument: false, status: 'missing', comparisons: [] };
    }

    // Aggregate summary statistics
    let total = 0;
    let matched = 0;
    let mismatched = 0;
    let unclear = 0;
    let wrongTypeCount = 0;
    let unverifiedCount = 0;

    Object.values(results.documents).forEach(doc => {
        if (!doc) return;
        if (doc.status === 'wrong_document_type') wrongTypeCount++;
        if (doc.status === 'unverified') unverifiedCount++;

        if (Array.isArray(doc.comparisons)) {
            doc.comparisons.forEach(c => {
                total++;
                if (c.status === 'match') matched++;
                else if (c.status === 'mismatch') mismatched++;
                else unclear++;
            });
        }
    });

    results.summary = {
        totalFields: total,
        matchedFields: matched,
        mismatchedFields: mismatched,
        unclearFields: unclear
    };

    if (wrongTypeCount > 0 || mismatched > 0) {
        results.status = 'flagged';
        results.overallNotes = wrongTypeCount > 0 
            ? `May ${wrongTypeCount} dokumento na hindi tumutugma sa inaasahang opisyal na uri (wrong document type) o may ${mismatched} mismatch.`
            : `Mayroong ${mismatched} field na hindi tugma sa dokumentong litrato. Kinakailangan ang masusing pagsusuri ng Municipal Admin.`;
    } else if (total === 0 || unverifiedCount === Object.keys(results.documents).length) {
        results.status = 'unverified';
        results.overallNotes = 'Hindi naging available ang automated OCR scan. Maaaring manu-manong i-verify ng Admin ang mga dokumento.';
    } else if (unclear > 0) {
        results.status = 'flagged';
        results.overallNotes = `May ilang field (${unclear}) na malabo o hindi sigurado. Kinakailangan ang manu-manong kumpirmasyon ng Admin.`;
    } else if (matched > 0 && mismatched === 0) {
        results.status = 'verified';
        results.overallNotes = `Tugma ang lahat ng ${matched} impormasyon sa mga kalakip na opisyal na dokumento.`;
    } else {
        results.status = 'unverified';
        results.overallNotes = 'Manual review required.';
    }

    return results;
}

module.exports = {
    normalizeString,
    compareField,
    extractWithGemini,
    verifyFranchiseDocuments
};
