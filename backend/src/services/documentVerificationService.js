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
        if (docType === 'orCr' || docType === 'crFile' || docType === 'orFile') {
            prompt = `You are an expert OCR specialist for Philippine Land Transportation Office (LTO) Certificate of Registration (CR) and Official Receipt (OR) documents.
Extract all visible tricycle / motorcycle vehicle information from this document image.
EXCLUSION RULES (CRITICAL):
- DO NOT extract any payment amounts, registration fees, or total paid amounts (e.g. PHP 1,068.00).
- DO NOT extract any signatures, registrant's signatures, or authorized official signatories (e.g. Assistant Secretary, Cashier, Registrar names).

Extract and return ONLY a valid JSON object with these exact keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "LTO Certificate of Registration / Official Receipt",
  "plateNo": "extracted plate number (e.g. L154JX), or null",
  "engineNo": "extracted engine number / motor number (e.g. KF51E7041285), or null",
  "motorNo": "extracted engine number / motor number (same as engineNo), or null",
  "chassisNo": "extracted chassis number / VIN (e.g. MH1KF5172PK041058), or null",
  "fileNo": "extracted MV file number (e.g. 110123000632095), or null",
  "crNo": "extracted CR number at bottom next to barcode (e.g. 0016563887), or null",
  "crDate": "extracted Date on CR at top right (YYYY-MM-DD), or null",
  "make": "extracted vehicle make / brand (e.g. HONDA, KAWASAKI, YAMAHA), or null",
  "series": "extracted model series (e.g. ADV160AP, TMX 125), or null",
  "yearModel": "extracted year model (e.g. 2023), or null",
  "year": "extracted year model, or null",
  "color": "extracted vehicle color (e.g. RED/BLACK), or null",
  "vehicleType": "extracted vehicle type (e.g. MOTORCYCLE / MOPED / TRICYCLE), or null",
  "vehicleCategory": "extracted vehicle category (e.g. L3), or null",
  "classification": "extracted classification (e.g. PRIVATE - (PVT)), or null",
  "bodyType": "extracted body type (e.g. MOTORCYCLE WITHOUT SIDECAR), or null",
  "passengerCapacity": "extracted passenger capacity (e.g. 2), or null",
  "fuelType": "extracted type of fuel (e.g. GAS), or null",
  "grossWeight": "extracted gross weight (e.g. 265), or null",
  "pistonDisplacement": "extracted piston displacement / engine displacement (e.g. 157), or null",
  "ownerName": "extracted registered owner full name (e.g. RICHIE JULS BACALSO), or null",
  "ownerAddress": "extracted registered owner address, or null",
  "orNo": "extracted O.R. NO. from DETAILS OF FIRST REGISTRATION or latest registration (e.g. 1101-000000012124), or null",
  "orDate": "extracted O.R. DATE (YYYY-MM-DD), or null",
  "fieldOffice": "extracted field office (e.g. NEW MV REGISTRATION UNIT), or null",
  "officeCode": "extracted office code (e.g. 1101), or null",
  "expiryDate": "extracted registration expiration date if visible (YYYY-MM-DD), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'license' || docType === 'licenseBack') {
            prompt = `You are an expert OCR specialist for Philippine Land Transportation Office (LTO) driver's licenses (front and back).
Carefully inspect this driver's license document image and extract all visible details.
EXCLUSION RULES (CRITICAL):
- DO NOT extract blood type (Blood type must NOT be extracted).
- DO NOT extract any payment amounts or fees.
- DO NOT extract signatures or signing government officials.

Extract and return ONLY a valid JSON object with these exact keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Driver's License",
  "licenseNo": "extracted license number (format like D01-12-345678, N01-12-345678), or null",
  "driverName": "extracted driver full name (Last, First, Middle), or null",
  "dateOfBirth": "extracted date of birth in YYYY-MM-DD, or null",
  "dlCodes": "extracted restriction / DL driving codes (e.g. A, A1, B or 1, 2), or null",
  "conditions": "extracted conditions (e.g. None, 1, 2), or null",
  "expiryDate": "extracted expiration date / valid until in YYYY-MM-DD, or null",
  "address": "extracted residential address, or null",
  "nationality": "extracted nationality (e.g. Filipino), or null",
  "sex": "extracted sex / gender (M/F), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'cedula') {
            prompt = `You are an expert OCR specialist for Philippine Community Tax Certificates (Cedula / CTC).
Extract the CTC details from this document image.
EXCLUSION RULES (CRITICAL):
- DO NOT extract tax payment amounts, basic tax, or total fees paid.
- DO NOT extract municipal treasurer / collector signatures.

Return ONLY a valid JSON object with these exact keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Community Tax Certificate (Cedula)",
  "serialNo": "extracted CTC / Cedula serial number or receipt number, or null",
  "fullName": "extracted taxpayer full name, or null",
  "year": "extracted tax year (e.g. 2026), or null",
  "dateIssued": "extracted date issued (YYYY-MM-DD), or null",
  "placeIssued": "extracted place issued (e.g. Gasan, Marinduque), or null",
  "address": "extracted taxpayer address, or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'todaEndorsement') {
            prompt = `You are an expert OCR specialist for Tricycle Operators and Drivers Association (TODA) Endorsement Certificates.
Extract the TODA details from this document image.
EXCLUSION RULES (CRITICAL):
- DO NOT extract membership dues, fees, or payment amounts.
- DO NOT extract president or secretary signatures.

Return ONLY a valid JSON object with these exact keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "TODA Endorsement Certificate",
  "certNo": "extracted certificate or clearance number, or null",
  "memberName": "extracted member/driver/operator name, or null",
  "todaName": "extracted TODA association name (e.g. BATODA, GT TODA), or null",
  "dateIssued": "extracted issuance date (YYYY-MM-DD), or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        } else if (docType === 'brgyClearance') {
            prompt = `You are an expert OCR specialist for Philippine Barangay Clearances.
Extract the clearance details from this document image.
EXCLUSION RULES (CRITICAL):
- DO NOT extract clearance fees or payment amounts.
- DO NOT extract Punong Barangay / Secretary signatures.

Return ONLY a valid JSON object with these exact keys:
{
  "isExpectedDocumentType": true,
  "detectedDocumentType": "Barangay Clearance",
  "clearanceNo": "extracted clearance or control number, or null",
  "residentName": "extracted resident/applicant name, or null",
  "barangay": "extracted barangay name (e.g. Pinggan, Bacong-Bacong, Bahi, Bangbang), or null",
  "dateIssued": "extracted date issued (YYYY-MM-DD), or null",
  "purpose": "extracted stated purpose, or null"
}
Return raw JSON only, no markdown codeblocks, no explanations.`;
        }

        // Prioritize gemini-3.8-flash (user's active tier) followed by resilient fallbacks
        const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
        const modelsToTry = [
            preferredModel,
            'gemini-3.8-flash',
            'gemini-2.5-flash',
            'gemini-3.5-flash-lite',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ].filter((val, idx, self) => Boolean(val) && self.indexOf(val) === idx);

        let responseText = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`[DocVerify] Invoking model ${modelName} for ${docType}...`);
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
                    ],
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                responseText = interaction.text || (interaction.candidates?.[0]?.content?.parts?.[0]?.text);
                if (responseText) {
                    console.log(`[DocVerify] Model ${modelName} succeeded with structured JSON for ${docType}`);
                    break;
                }
            } catch (callErr) {
                console.warn(`[DocVerify] Model ${modelName} with json config failed:`, callErr.message);
                try {
                    // Fallback to standard request without responseMimeType in case older models reject it
                    const fallbackInteraction = await ai.models.generateContent({
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
                    responseText = fallbackInteraction.text || (fallbackInteraction.candidates?.[0]?.content?.parts?.[0]?.text);
                    if (responseText) {
                        console.log(`[DocVerify] Model ${modelName} fallback format succeeded for ${docType}`);
                        break;
                    }
                } catch (fallbackErr) {
                    console.warn(`[DocVerify] Model ${modelName} fallback format failed:`, fallbackErr.message);
                }
            }
        }

        if (!responseText) {
            console.warn(`[DocVerify] No text returned by any Gemini model for ${docType}`);
            return null;
        }

        // Clean any code fences or extra wrapping
        let cleaned = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        // Remove trailing commas before closing braces/brackets for JSON compatibility
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        const parsed = JSON.parse(cleaned);
        console.log(`[DocVerify] Parsed extraction data for ${docType}:`, parsed);
        return parsed;
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

                if (extracted.ownerName) {
                    comparisons.push(compareField(franchise.fullName, extracted.ownerName, 'Registered Owner (Operator Ownership Check)', 'ownerName'));
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
                extracted,
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

                if (extracted.dlCodes) {
                    const dlClean = String(extracted.dlCodes).toUpperCase();
                    const isTricycleAuthorized = dlClean.includes('A') || dlClean.includes('1') || dlClean.includes('2');
                    comparisons.push({
                        field: 'dlCodes',
                        label: 'DL Tricycle Authorization (Code A / A1)',
                        inputValue: 'Authorized for Motorcycle/Tricycle (Code A/A1)',
                        extractedValue: extracted.dlCodes,
                        status: isTricycleAuthorized ? 'match' : 'mismatch',
                        confidence: 0.95,
                        notes: isTricycleAuthorized ? 'Driver license authorizes motorcycle/tricycle operation.' : 'Warning: License may lack Code A/A1 tricycle authorization.'
                    });
                }

                if (franchise.driverDob && extracted.dateOfBirth) {
                    const dobStr = new Date(franchise.driverDob).toISOString().substring(0, 10);
                    comparisons.push(compareField(dobStr, extracted.dateOfBirth, 'Driver Date of Birth (LTO Birthday Rule)', 'driverDob'));
                }
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
                if (extracted.memberName) {
                    comparisons.push(compareField(franchise.fullName, extracted.memberName, 'TODA Member Name', 'fullName'));
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
            } else {
                if (franchise.brgyClearanceNo) {
                    comparisons.push(compareField(franchise.brgyClearanceNo, extracted.clearanceNo, 'Barangay Clearance No', 'brgyClearanceNo'));
                }
                if (franchise.address && extracted.barangay) {
                    comparisons.push(compareField(franchise.address, extracted.barangay, 'Resident Barangay vs Issuing Barangay', 'barangayJurisdiction'));
                }
                if (extracted.residentName) {
                    comparisons.push(compareField(franchise.fullName, extracted.residentName, 'Clearance Resident Applicant Name', 'residentName'));
                }
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
