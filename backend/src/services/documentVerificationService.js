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
            extractedValue: 'Illegible / Unclear',
            status: 'unclear',
            confidence: 0.5,
            notes: 'Unclear or not visible in document image'
        };
    }

    if (!inputVal || inputClean === '') {
        return {
            field: fieldKey,
            label: fieldLabel,
            inputValue: 'No entry provided',
            extractedValue: String(extractedVal),
            status: 'unclear',
            confidence: 0.6,
            notes: 'Found in document but no corresponding value was entered'
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
            notes: 'Entered data perfectly matches official document'
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
            notes: 'Matches (minor prefix or formatting variation)'
        };
    }

    return {
        field: fieldKey,
        label: fieldLabel,
        inputValue: String(inputVal),
        extractedValue: String(extractedVal),
        status: 'mismatch',
        confidence: 0.95,
        notes: `Mismatch: Entered [${inputVal}], but document shows [${extractedVal}]`
    };
}

/**
 * Downloads image from URL and converts to base64
 */
async function fetchImageAsBase64(url) {
    try {
        if (!url || typeof url !== 'string') return null;
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'Accept': 'image/*,application/pdf'
            }
        });

        if (!response || !response.data) return null;
        const contentType = (response.headers && response.headers['content-type']) || 'image/jpeg';
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
            prompt = `You are an expert OCR specialist for Philippine vehicle registration documents (LTO OR / CR, Certificate of Registration, Official Receipt).
Extract all visible tricycle / motorcycle vehicle information from this document image.
Even if the document is a photocopy, laminated, captured from an angle, or partially faded, extract as much text as possible.
Return ONLY valid JSON with these keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "LTO Official Receipt / Certificate of Registration",
  "plateNo": "extracted plate number or MV file number, or null if unreadable",
  "chassisNo": "extracted chassis or frame number (VIN), or null if unreadable",
  "motorNo": "extracted engine or motor number, or null if unreadable",
  "orCrNo": "extracted OR number or CR number, or null if unreadable",
  "make": "extracted vehicle make / brand (e.g. Honda, Kawasaki, Yamaha, Bajaj), or null",
  "year": "extracted model year (e.g. 2024), or null",
  "ownerName": "extracted registered owner full name, or null if unreadable",
  "expiryDate": "extracted expiration or registration date (YYYY-MM-DD), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'license') {
            prompt = `You are an expert OCR specialist for Philippine Land Transportation Office (LTO) driver's licenses.
Extract the driver and license details from this image. Even if the license is plastic, paper, photocopy, or slightly blurry, extract all visible text.
Return ONLY valid JSON with these keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Driver's License",
  "licenseNo": "extracted driver license number (e.g. D01-23-456789), or null",
  "driverName": "extracted full name of driver/licensee, or null",
  "expiryDate": "extracted expiration date (YYYY-MM-DD), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'cedula') {
            prompt = `You are an expert OCR specialist for Philippine Community Tax Certificates (Cedula / CTC).
Extract the CTC details from this document image.
Return ONLY valid JSON with these keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Community Tax Certificate (Cedula)",
  "serialNo": "extracted CTC / Cedula serial number or receipt number, or null",
  "fullName": "extracted taxpayer full name, or null",
  "year": "extracted tax year (e.g. 2026), or null",
  "dateIssued": "extracted date issued (YYYY-MM-DD), or null",
  "placeIssued": "extracted place issued (e.g. Gasan, Marinduque), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'todaEndorsement') {
            prompt = `You are an expert OCR specialist for Tricycle Operators and Drivers Association (TODA) Endorsement Certificates.
Extract the TODA details from this document image.
Return ONLY valid JSON with these keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "TODA Endorsement Certificate",
  "certNo": "extracted certificate or clearance number, or null",
  "memberName": "extracted member/driver/operator name, or null",
  "todaName": "extracted TODA association name (e.g. BATODA, GT TODA), or null",
  "dateIssued": "extracted issuance date (YYYY-MM-DD), or null",
  "signatory": "extracted president or signatory name, or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'brgyClearance') {
            prompt = `You are an expert OCR specialist for Philippine Barangay Clearances.
Extract the clearance details from this document image.
Return ONLY valid JSON with these keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Barangay Clearance",
  "clearanceNo": "extracted clearance or control number, or null",
  "residentName": "extracted resident/applicant name, or null",
  "barangay": "extracted barangay name (e.g. Pinggan, Bacong-Bacong, Bahi, Bangbang), or null",
  "dateIssued": "extracted date issued (YYYY-MM-DD), or null",
  "issuer": "extracted punong barangay / secretary name, or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        }

        // Try fast multimodal models in order: gemini-2.0-flash -> gemini-2.0-flash-lite -> gemini-1.5-flash
        const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
        let responseText = null;

        for (const modelName of modelsToTry) {
            try {
                // Official @google/genai standard multimodal contents format
                const interaction = await ai.models.generateContent({
                    model: modelName,
                    contents: [
                        {
                            inlineData: {
                                mimeType: mimeType || 'image/jpeg',
                                data: base64Data
                            }
                        },
                        prompt
                    ]
                });
                responseText = interaction.text || (interaction.candidates?.[0]?.content?.parts?.[0]?.text);
                if (responseText) break;
            } catch (callErr) {
                console.warn(`[DocVerify] Model ${modelName} standard format failed:`, callErr.message);
                try {
                    // Fallback to nested parts format
                    const fallbackInteraction = await ai.models.generateContent({
                        model: modelName,
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
                    if (responseText) break;
                } catch (fallbackErr) {
                    console.warn(`[DocVerify] Model ${modelName} fallback format failed:`, fallbackErr.message);
                }
            }
        }

        if (!responseText) return null;

        // Clean any code fences or extra wrapping
        let cleaned = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        // Remove trailing commas before closing braces/brackets for JSON compatibility
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
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
                    notes: 'Uploaded image does not appear to be a valid LTO OR/CR document.'
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
                    notes: "Uploaded image does not appear to be a valid Driver's License."
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
                    notes: 'Uploaded image does not appear to be a valid Community Tax Certificate (Cedula).'
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
                    notes: 'Uploaded image does not appear to be a valid TODA Endorsement certificate.'
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
                    notes: 'Uploaded image does not appear to be a valid Barangay Clearance document.'
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
            ? `${wrongTypeCount} document(s) did not match the expected official document type or contain ${mismatched} data mismatch(es).`
            : `${mismatched} field(s) do not match official document images. Manual review by Municipal Admin is required.`;
    } else if (total === 0 || unverifiedCount === Object.keys(results.documents).length) {
        results.status = 'unverified';
        results.overallNotes = 'Automated OCR scan unavailable. Admin manual document review required.';
    } else if (unclear > 0) {
        results.status = 'flagged';
        results.overallNotes = `Some fields (${unclear}) are unclear or unconfirmed. Admin manual verification required.`;
    } else if (matched > 0 && mismatched === 0) {
        results.status = 'verified';
        results.overallNotes = `All ${matched} submitted fields match the attached official documents.`;
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
    verifyFranchiseDocuments,
    fetchImageAsBase64
};
