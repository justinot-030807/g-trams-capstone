const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true }, 
    address: { type: String, required: true },
    zone: { type: String, required: true },
    made: { type: String, required: true },
    make: { type: String, required: true },
    motorNo: { type: String, required: true },
    chassisNo: { type: String, required: true },
    plateNo: { type: String, required: true },
    todaName: { type: String, required: true },
    
    orCrUrl: { type: String },
    crUrl: { type: String, default: '' },
    orUrl: { type: String, default: '' },
    licenseUrl: { type: String },
    licenseBackUrl: { type: String, default: '' },
    todaEndorsementUrl: { type: String },
    brgyClearanceUrl: { type: String },
    cedulaUrl: { type: String, default: '' },
    
    // Structured document metadata fields
    orCrNo: { type: String, default: '' },
    orCrExpiryDate: { type: Date },
    crNo: { type: String, default: '' },
    orDate: { type: Date },
    crDate: { type: Date },
    color: { type: String, default: '' },
    series: { type: String, default: '' },
    yearModel: { type: String, default: '' },
    fileNo: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    vehicleCategory: { type: String, default: '' },
    classification: { type: String, default: '' },
    bodyType: { type: String, default: '' },
    displacement: { type: String, default: '' },
    registeredOwner: { type: String, default: '' },
    ownerAddress: { type: String, default: '' },

    isOperatorDriver: { type: Boolean, default: true },
    numberOfUnits: { type: Number, default: 1 },
    driverName: { type: String, default: '' },
    driverContact: { type: String, default: '' },
    driverLicenseNo: { type: String, default: '' },
    driverLicenseExpiryDate: { type: Date },
    driverDob: { type: Date },
    driverDlCodes: { type: String, default: 'A, A1' },
    driverConditions: { type: String, default: 'None' },
    driverAddress: { type: String, default: '' },
    driverNationality: { type: String, default: 'Filipino' },
    driverSex: { type: String, default: '' },
    todaCertNo: { type: String, default: '' },
    todaCertDate: { type: Date },
    todaSignatory: { type: String, default: '' },
    brgyClearanceNo: { type: String, default: '' },
    brgyClearanceDate: { type: Date },
    brgyIssuer: { type: String, default: '' },

    deficiencies: {
        hasOrcr: { type: Boolean, default: false },
        hasLicense: { type: Boolean, default: false },
        hasTodaEndorsement: { type: Boolean, default: false },
        hasBrgyClearance: { type: Boolean, default: false }
    },
    
    dateApplied: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    cedulaDate: { type: Date, required: true },
    cedulaAddress: { type: String, required: true },
    cedulaSerialNo: { type: String, required: true },
    
    status: { type: String, enum: ['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup', 'Active', 'Expired', 'Cancelled', 'Revoked'], default: 'Pending' },
    applicationType: { type: String, default: 'New' },
    
    // Resubmitted / Corrected tracking
    isResubmitted: { type: Boolean, default: false },
    resubmittedAt: { type: Date },

    // Cancellation or rejection field tracking and evidence
    cancelReason: { type: String, default: '' },
    rejectedField: { type: String, default: '' },
    evidenceUrl: { type: String, default: '' }, 
    
    // Official Treasury Cashier & Payment Receipt fields
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    officialReceiptNo: { type: String, default: '' },
    payerName: { type: String, default: '' },
    amountPaid: { type: Number, default: 500 },
    paymentMethod: { type: String, enum: ['Cash', 'GCash', 'Landbank'], default: 'Cash' },
    paymentDate: { type: Date },
    paidByCashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cashierName: { type: String, default: '' },
    paymentRemarks: { type: String, default: '' },

    eSigned: { type: Boolean, default: false },
    releaseDate: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },

    // AI-Powered Document Verification (Gemini Vision OCR & Field Cross-Check)
    aiVerification: {
        status: { type: String, enum: ['unverified', 'pending', 'verified', 'flagged', 'error'], default: 'unverified' },
        verifiedAt: { type: Date },
        summary: {
            totalFields: { type: Number, default: 0 },
            matchedFields: { type: Number, default: 0 },
            mismatchedFields: { type: Number, default: 0 },
            unclearFields: { type: Number, default: 0 }
        },
        documents: {
            orCr: { type: mongoose.Schema.Types.Mixed, default: null },
            license: { type: mongoose.Schema.Types.Mixed, default: null },
            todaEndorsement: { type: mongoose.Schema.Types.Mixed, default: null },
            brgyClearance: { type: mongoose.Schema.Types.Mixed, default: null },
            cedula: { type: mongoose.Schema.Types.Mixed, default: null }
        },
        overallNotes: { type: String, default: '' }
    },

    // Tracks raw AI OCR extractions and applicant overrides
    aiScannedData: { type: mongoose.Schema.Types.Mixed, default: null },
    aiDiscrepancies: { type: mongoose.Schema.Types.Mixed, default: [] }

}, { timestamps: true });

// Unique indexes to prevent duplicates (Race condition fix)
franchiseSchema.index(
    { plateNo: 1 }, 
    { unique: true, partialFilterExpression: { isArchived: false } }
);
franchiseSchema.index(
    { motorNo: 1 }, 
    { unique: true, partialFilterExpression: { isArchived: false } }
);
franchiseSchema.index(
    { chassisNo: 1 }, 
    { unique: true, partialFilterExpression: { isArchived: false } }
);

// Create text index for search optimization
franchiseSchema.index({ 
    fullName: 'text', 
    plateNo: 'text', 
    motorNo: 'text', 
    chassisNo: 'text',
    todaName: 'text'
});

// Index for operator to speed up population and queries
franchiseSchema.index({ operator: 1 });

module.exports = mongoose.model('Franchise', franchiseSchema);