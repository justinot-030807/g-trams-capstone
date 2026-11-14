const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Standard CRC32 lookup table for ZIP format
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function escapeXml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/\bundefined\b/gi, '')
        .replace(/\bnull\b/gi, '')
        .replace(/\bNaN\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Pure Node.js ZIP modifier: reads a ZIP buffer, applies `transformFn(filename, contentBuffer)`
 * to matching entries, and outputs a valid new ZIP buffer.
 */
function modifyZipBuffer(zipBuf, transformMap) {
    // Locate End of Central Directory (EOCD) signature 0x06054b50 from the end
    let eocdOffset = -1;
    for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
        if (zipBuf.readUInt32LE(i) === 0x06054b50) {
            eocdOffset = i;
            break;
        }
    }
    if (eocdOffset === -1) {
        throw new Error('Invalid ZIP archive: EOCD not found');
    }

    const totalEntries = zipBuf.readUInt16LE(eocdOffset + 10);
    const cdSize = zipBuf.readUInt32LE(eocdOffset + 12);
    const cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);
    const eocdCommentLen = zipBuf.readUInt16LE(eocdOffset + 20);
    const eocdComment = zipBuf.subarray(eocdOffset + 22, eocdOffset + 22 + eocdCommentLen);

    const localChunks = [];
    const cdChunks = [];
    let currentLocalOffset = 0;
    let ptr = cdOffset;

    for (let idx = 0; idx < totalEntries; idx++) {
        if (zipBuf.readUInt32LE(ptr) !== 0x02014b50) {
            throw new Error(`Invalid Central Directory header at offset ${ptr}`);
        }
        const versionMadeBy = zipBuf.readUInt16LE(ptr + 4);
        const versionNeeded = zipBuf.readUInt16LE(ptr + 6);
        const flags = zipBuf.readUInt16LE(ptr + 8);
        const compressionMethod = zipBuf.readUInt16LE(ptr + 10);
        const dosTime = zipBuf.readUInt16LE(ptr + 12);
        const dosDate = zipBuf.readUInt16LE(ptr + 14);
        let entryCrc = zipBuf.readUInt32LE(ptr + 16);
        let compressedSize = zipBuf.readUInt32LE(ptr + 20);
        let uncompressedSize = zipBuf.readUInt32LE(ptr + 24);
        const fileNameLen = zipBuf.readUInt16LE(ptr + 28);
        const cdExtraLen = zipBuf.readUInt16LE(ptr + 30);
        const fileCommentLen = zipBuf.readUInt16LE(ptr + 32);
        const diskNumStart = zipBuf.readUInt16LE(ptr + 34);
        const internalAttrs = zipBuf.readUInt16LE(ptr + 36);
        const externalAttrs = zipBuf.readUInt32LE(ptr + 38);
        const localHeaderOffset = zipBuf.readUInt32LE(ptr + 42);

        const fileNameBuf = zipBuf.subarray(ptr + 46, ptr + 46 + fileNameLen);
        const fileName = fileNameBuf.toString('utf8');
        const cdExtraBuf = zipBuf.subarray(ptr + 46 + fileNameLen, ptr + 46 + fileNameLen + cdExtraLen);
        const fileCommentBuf = zipBuf.subarray(ptr + 46 + fileNameLen + cdExtraLen, ptr + 46 + fileNameLen + cdExtraLen + fileCommentLen);

        // Read local file header at localHeaderOffset
        if (zipBuf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
            throw new Error(`Invalid Local File Header at offset ${localHeaderOffset}`);
        }
        const lfhNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
        const lfhExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
        const lfhExtraBuf = zipBuf.subarray(localHeaderOffset + 30 + lfhNameLen, localHeaderOffset + 30 + lfhNameLen + lfhExtraLen);
        const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
        let compressedData = zipBuf.subarray(dataStart, dataStart + compressedSize);

        // Check if this entry needs transformation
        if (Object.prototype.hasOwnProperty.call(transformMap, fileName)) {
            let rawData;
            if (compressionMethod === 0) {
                rawData = compressedData;
            } else if (compressionMethod === 8) {
                rawData = zlib.inflateRawSync(compressedData);
            } else {
                throw new Error(`Unsupported compression method ${compressionMethod} for ${fileName}`);
            }

            const updatedRaw = transformMap[fileName](rawData);
            uncompressedSize = updatedRaw.length;
            entryCrc = crc32(updatedRaw);
            if (compressionMethod === 8) {
                compressedData = zlib.deflateRawSync(updatedRaw);
            } else {
                compressedData = updatedRaw;
            }
            compressedSize = compressedData.length;
        }

        // Build new Local File Header (strip bit 3 data descriptor flag if present since sizes are known)
        const cleanFlags = flags & ~0x0008;
        const lfh = Buffer.alloc(30);
        lfh.writeUInt32LE(0x04034b50, 0);
        lfh.writeUInt16LE(versionNeeded, 4);
        lfh.writeUInt16LE(cleanFlags, 6);
        lfh.writeUInt16LE(compressionMethod, 8);
        lfh.writeUInt16LE(dosTime, 10);
        lfh.writeUInt16LE(dosDate, 12);
        lfh.writeUInt32LE(entryCrc, 14);
        lfh.writeUInt32LE(compressedSize, 18);
        lfh.writeUInt32LE(uncompressedSize, 22);
        lfh.writeUInt16LE(fileNameBuf.length, 26);
        lfh.writeUInt16LE(lfhExtraBuf.length, 28);

        const entryLocalOffset = currentLocalOffset;
        localChunks.push(lfh, fileNameBuf, lfhExtraBuf, compressedData);
        currentLocalOffset += lfh.length + fileNameBuf.length + lfhExtraBuf.length + compressedData.length;

        // Build new Central Directory Header
        const cdh = Buffer.alloc(46);
        cdh.writeUInt32LE(0x02014b50, 0);
        cdh.writeUInt16LE(versionMadeBy, 4);
        cdh.writeUInt16LE(versionNeeded, 6);
        cdh.writeUInt16LE(cleanFlags, 8);
        cdh.writeUInt16LE(compressionMethod, 10);
        cdh.writeUInt16LE(dosTime, 12);
        cdh.writeUInt16LE(dosDate, 14);
        cdh.writeUInt32LE(entryCrc, 16);
        cdh.writeUInt32LE(compressedSize, 20);
        cdh.writeUInt32LE(uncompressedSize, 24);
        cdh.writeUInt16LE(fileNameBuf.length, 28);
        cdh.writeUInt16LE(cdExtraBuf.length, 30);
        cdh.writeUInt16LE(fileCommentBuf.length, 32);
        cdh.writeUInt16LE(diskNumStart, 34);
        cdh.writeUInt16LE(internalAttrs, 36);
        cdh.writeUInt32LE(externalAttrs, 38);
        cdh.writeUInt32LE(entryLocalOffset, 42);

        cdChunks.push(cdh, fileNameBuf, cdExtraBuf, fileCommentBuf);

        ptr += 46 + fileNameLen + cdExtraLen + fileCommentLen;
    }

    const cdBuffer = Buffer.concat(cdChunks);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(totalEntries, 8);
    eocd.writeUInt16LE(totalEntries, 10);
    eocd.writeUInt32LE(cdBuffer.length, 12);
    eocd.writeUInt32LE(currentLocalOffset, 16);
    eocd.writeUInt16LE(eocdComment.length, 20);

    return Buffer.concat([...localChunks, cdBuffer, eocd, eocdComment]);
}

function replacePlaceholders(xmlStr, replacements) {
    let result = xmlStr;
    for (const [key, val] of Object.entries(replacements)) {
        const token = `{{${key}}}`;
        const safeVal = escapeXml(val);
        result = result.split(token).join(safeVal);
    }
    return result;
}

function getOrdinalParts(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const day = validDate.getDate();
    let ordinal = 'th';
    if (day % 10 === 1 && day !== 11) ordinal = 'st';
    else if (day % 10 === 2 && day !== 12) ordinal = 'nd';
    else if (day % 10 === 3 && day !== 13) ordinal = 'rd';
    const month = validDate.toLocaleDateString('en-US', { month: 'long' });
    const year = String(validDate.getFullYear());
    const shortDate = `${validDate.getMonth() + 1}/${validDate.getDate()}/${validDate.getFullYear()}`;
    const longDate = validDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return { day: String(day), ordinal, month, year, shortDate, longDate };
}

function splitMtopNo(mtopNumber, fallbackYear) {
    const raw = String(mtopNumber || '').trim();
    // Matches "2026-186" or "MTOP-GASAN-2026-0186" or "0186"
    const m = raw.match(/(20\d{2})\D+(\d+)/);
    if (m) {
        return { yearPrefix: `${m[1]} - `, seqNo: m[2] };
    }
    const digits = raw.match(/(\d+)$/);
    return {
        yearPrefix: `${fallbackYear || new Date().getFullYear()} - `,
        seqNo: digits ? digits[1] : (raw || '001')
    };
}

/**
 * Generates the populated original MTOP Certificate Excel (.xlsx) buffer
 */
function generateMtopFranchiseXlsx(franchise = {}) {
    const templatePath = path.join(TEMPLATES_DIR, 'MTOP_FRANCHISE_TEMPLATE.xlsx');
    const zipBuf = fs.readFileSync(templatePath);

    const op = franchise.operator || franchise.operatorId || {};
    const applicantName = (
        franchise.fullName ||
        franchise.ownerName ||
        franchise.operatorName ||
        (op.firstName ? `${op.firstName} ${op.middleName ? op.middleName.charAt(0) + '. ' : ''}${op.lastName || ''}` : op.name) ||
        'APPLICANT NAME'
    ).toUpperCase().trim();

    const rawBrgy = (franchise.barangay || op.barangay || franchise.address || op.address || 'POBLACION').toUpperCase().trim();
    const address = rawBrgy.includes('GASAN') ? rawBrgy : `${rawBrgy}, GASAN, MARINDUQUE`;

    const issuedParts = getOrdinalParts(franchise.issuedAt || franchise.approvedAt || franchise.updatedAt || new Date());
    let validUntilParts;
    if (franchise.validUntil || franchise.expiryDate) {
        validUntilParts = getOrdinalParts(franchise.validUntil || franchise.expiryDate);
    } else {
        const exp = new Date(franchise.issuedAt || Date.now());
        exp.setFullYear(exp.getFullYear() + 3);
        validUntilParts = getOrdinalParts(exp);
    }

    const { yearPrefix, seqNo } = splitMtopNo(franchise.mtopNumber || franchise.franchiseNumber || franchise.bodyNumber, issuedParts.year);
    const isRenewal = String(franchise.applicationType || '').toLowerCase() === 'renewal';

    let zone = (franchise.zone || franchise.todaZone || 'NORTH').toUpperCase().replace(/\s*ZONE\s*/i, '').trim();
    if (!zone) zone = 'NORTH';

    const replacements = {
        APPLICANT_NAME: applicantName,
        MTOP_YEAR_PREFIX: yearPrefix,
        MTOP_SEQ_NO: seqNo,
        ADDRESS: address,
        IS_NEW: isRenewal ? '' : '/',
        IS_RENEWAL: isRenewal ? '/' : '',
        ZONE: zone,
        UNITS_TEXT: 'ONE (1) UNIT',
        MAKE: (franchise.make || franchise.made || franchise.vehicleMake || 'KAWASAKI').toUpperCase(),
        MODEL: String(franchise.yearModel || franchise.model || '2024').toUpperCase(),
        MOTOR_NO: (franchise.motorNo || franchise.motorNumber || franchise.engineNumber || 'N/A').toUpperCase(),
        CHASSIS_NO: (franchise.chassisNo || franchise.chassisNumber || 'N/A').toUpperCase(),
        PLATE_NO: (franchise.plateNo || franchise.plateNumber || 'FOR REG').toUpperCase(),
        SC_NO: (franchise.sidecarNumber || franchise.bodyNumber || franchise.todaBodyNumber || '').toUpperCase(),
        VALID_FROM: issuedParts.shortDate,
        VALID_UNTIL: validUntilParts.shortDate,
    };

    return modifyZipBuffer(zipBuf, {
        'xl/worksheets/sheet1.xml': (rawBuf) => {
            const xml = rawBuf.toString('utf8');
            return Buffer.from(replacePlaceholders(xml, replacements), 'utf8');
        }
    });
}

/**
 * Generates the populated original MTOP Application Form Excel (.xlsx) buffer
 */
function generateMtopApplicationXlsx(franchise = {}) {
    const templatePath = path.join(TEMPLATES_DIR, 'MTOP_APPLICATION_TEMPLATE.xlsx');
    const zipBuf = fs.readFileSync(templatePath);

    const op = franchise.operator || franchise.operatorId || {};
    let familyName = (op.lastName || franchise.lastName || '').toUpperCase().trim();
    let givenName = (op.firstName || franchise.firstName || '').toUpperCase().trim();
    let middleName = (op.middleName || franchise.middleName || '').toUpperCase().trim();

    if (!familyName && !givenName) {
        const full = (franchise.fullName || franchise.ownerName || franchise.operatorName || op.name || 'DELA CRUZ JUAN SANTOS').toUpperCase().trim();
        const parts = full.split(/\s+/);
        if (parts.length === 1) {
            familyName = parts[0];
        } else if (parts.length === 2) {
            givenName = parts[0];
            familyName = parts[1];
        } else {
            givenName = parts.slice(0, -2).join(' ');
            middleName = parts[parts.length - 2].replace('.', '');
            familyName = parts[parts.length - 1];
        }
    }

    const fullName = (
        franchise.fullName ||
        franchise.ownerName ||
        franchise.operatorName ||
        `${givenName} ${middleName ? middleName.charAt(0) + '. ' : ''}${familyName}`
    ).toUpperCase().trim();

    let zone = (franchise.zone || franchise.todaZone || 'CENTRAL').toUpperCase().replace(/\s*ZONE\s*/i, '').trim();
    if (!zone) zone = 'CENTRAL';

    const isRenewal = String(franchise.applicationType || '').toLowerCase() === 'renewal';
    const rawBrgy = (franchise.barangay || op.barangay || franchise.address || op.address || 'POBLACION')
        .toUpperCase()
        .replace(/,?\s*GASAN.*$/i, '')
        .trim();

    const filedParts = getOrdinalParts(franchise.createdAt || franchise.submittedAt || new Date());
    const ctcDateParts = getOrdinalParts(franchise.ctcDateIssued || franchise.createdAt || new Date());

    const replacements = {
        FAMILY_NAME: familyName || 'N/A',
        GIVEN_NAME: givenName || 'N/A',
        MIDDLE_NAME: middleName || '',
        ZONE: zone,
        IS_NEW: isRenewal ? '' : '/',
        IS_RENEWAL: isRenewal ? '/' : '',
        BARANGAY: rawBrgy || 'POBLACION',
        MUNICIPALITY: 'GASAN',
        PROVINCE: 'MARINDUQUE',
        OCCUPATION: (franchise.occupation || op.occupation || 'TRICYCLE OPERATOR').toUpperCase(),
        IS_SINGLE_PROP: '/',
        IS_PARTNERSHIP: '',
        IS_COOPERATIVE: '',
        UNITS_APPLIED: 'One (1) unit',
        MAKE: (franchise.make || franchise.made || franchise.vehicleMake || 'KAWASAKI').toUpperCase(),
        MODEL: String(franchise.yearModel || franchise.model || '2024').toUpperCase(),
        MOTOR_NO: (franchise.motorNo || franchise.motorNumber || franchise.engineNumber || 'N/A').toUpperCase(),
        CHASSIS_NO: (franchise.chassisNo || franchise.chassisNumber || 'N/A').toUpperCase(),
        PLATE_NO: (franchise.plateNo || franchise.plateNumber || 'FOR REG').toUpperCase(),
        SC_NO: (franchise.sidecarNumber || franchise.bodyNumber || franchise.todaBodyNumber || '').toUpperCase(),
        DATE_FILED: filedParts.shortDate,
        APPLICANT_FULL_NAME: fullName,
        SWORN_DAY: `${filedParts.day}${filedParts.ordinal}`,
        SWORN_MONTH: filedParts.month.toUpperCase(),
        SWORN_YEAR: filedParts.year,
        CTC_NO: (franchise.ctcNumber || franchise.cedulaNo || franchise.cedulaNumber || '27664282').toUpperCase(),
        CTC_DATE: ctcDateParts.shortDate,
    };

    return modifyZipBuffer(zipBuf, {
        'xl/worksheets/sheet1.xml': (rawBuf) => {
            const xml = rawBuf.toString('utf8');
            return Buffer.from(replacePlaceholders(xml, replacements), 'utf8');
        }
    });
}

/**
 * Generates the populated original Franchise Cancellation Letter Word (.docx) buffer
 */
function generateCancellationDocx(franchise = {}) {
    const templatePath = path.join(TEMPLATES_DIR, 'FRANCHISE_CANCELLATION_TEMPLATE.docx');
    const zipBuf = fs.readFileSync(templatePath);

    const op = franchise.operator || franchise.operatorId || {};
    const fullName = (
        franchise.fullName ||
        franchise.ownerName ||
        franchise.operatorName ||
        (op.firstName ? `${op.firstName} ${op.middleName ? op.middleName.charAt(0) + '. ' : ''}${op.lastName || ''}` : op.name) ||
        'JUAN DELA CRUZ'
    ).toUpperCase().trim();

    const lastName = op.lastName || fullName.split(/\s+/).slice(-1)[0] || 'Operator';
    const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    const rawBrgy = (franchise.barangay || op.barangay || franchise.address || op.address || 'Poblacion')
        .replace(/^Brgy\.?\s*/i, '')
        .replace(/,?\s*Gasan.*$/i, '')
        .trim();

    const cancelDate = franchise.cancelledAt || franchise.cancellationRequestedAt || franchise.updatedAt || new Date();
    const cancelParts = getOrdinalParts(cancelDate);
    const reqParts = getOrdinalParts(franchise.cancellationRequestedAt || cancelDate);
    const orDateParts = getOrdinalParts(franchise.cancellationOrDate || cancelDate);

    const rawMtop = String(franchise.mtopNumber || franchise.franchiseNumber || `${cancelParts.year}-001`)
        .replace(/^MTOP-GASAN-/i, '');

    const replacements = {
        RECIPIENT_NAME: `MR./MS. ${fullName}`,
        BARANGAY: rawBrgy || 'Poblacion',
        SALUTATION: `Mr./Ms. ${formattedLastName}`,
        REQUEST_DATE: reqParts.longDate,
        PLATE_NO: (franchise.plateNo || franchise.plateNumber || 'N/A').toUpperCase(),
        FRANCHISE_NO: rawMtop,
        CANCEL_DAY: cancelParts.day,
        CANCEL_ORDINAL: cancelParts.ordinal,
        CANCEL_MONTH: cancelParts.month,
        CANCEL_YEAR: cancelParts.year,
        MAKE: (franchise.make || franchise.made || franchise.vehicleMake || 'N/A').toUpperCase(),
        CHASSIS_NO: (franchise.chassisNo || franchise.chassisNumber || 'N/A').toUpperCase(),
        MOTOR_NO: (franchise.motorNo || franchise.motorNumber || franchise.engineNumber || 'N/A').toUpperCase(),
        MODEL: String(franchise.yearModel || franchise.model || 'N/A').toUpperCase(),
        ISSUED_DAY: cancelParts.day,
        ISSUED_ORDINAL: cancelParts.ordinal,
        ISSUED_MONTH: cancelParts.month,
        ISSUED_YEAR: cancelParts.year,
        OR_AMOUNT: 'P50.00',
        OR_NO: franchise.cancellationOrNumber || franchise.officialReceiptNo || franchise.orNumber || '7366968',
        OR_DATE: orDateParts.longDate,
    };

    return modifyZipBuffer(zipBuf, {
        'word/document.xml': (rawBuf) => {
            const xml = rawBuf.toString('utf8');
            return Buffer.from(replacePlaceholders(xml, replacements), 'utf8');
        }
    });
}

module.exports = {
    generateMtopFranchiseXlsx,
    generateMtopApplicationXlsx,
    generateCancellationDocx,
};
