const mongoose = require('mongoose');
const { computeManilaExpiryDate, calculateDaysRemaining, isExpired } = require('../utils/phTime');
const { getIssuedPermit, hasIssuedPermitSnapshot, OPERATING_STATUSES } = require('../utils/issuedPermit');

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
    mtopNo: { type: String, trim: true, default: '' },
    bodyNumber: { type: String, trim: true, default: '' },
    
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
    orNo: { type: String, default: '' },
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
    grossWeight: { type: String, default: '' },
    fuelType: { type: String, default: '' },
    passengerCapacity: { type: String, default: '' },
    registeredOwner: { type: String, default: '' },
    ownerAddress: { type: String, default: '' },

    isOperatorDriver: { type: Boolean, default: true },
    numberOfUnits: { type: Number, default: 1 },
    driverName: { type: String, default: '' },
    driverContact: { type: String, default: '' },
    driverLicenseNo: { type: String, default: '' },
    driverLicenseSerialNo: { type: String, default: '' },
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

    
    dateApplied: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    expiryDate: { type: Date, index: true },
    // Write the alert event atomically with expiry, including on standalone MongoDB.
    pendingExpiryNotifications: {
        type: [{
            recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            message: { type: String, required: true }
        }],
        default: undefined,
        select: false
    },
    lastRenewalReminderSentAt: { type: Date, default: null },
    previousStatus: { type: String, default: '' },
    previousExpiryDate: { type: Date, default: null },
    isRenewalPending: { type: Boolean, default: false },
    cedulaDate: { type: Date, required: true },
    cedulaAddress: { type: String, required: true },
    cedulaSerialNo: { type: String, required: true },
    cedulaAmount: { type: Number, default: 0 },
    cedulaYear: { type: String, default: '' },
    cedulaPlaceIssued: { type: String, default: '' },
    cedulaFullName: { type: String, default: '' },
    cedulaCitizenship: { type: String, default: '' },
    cedulaCivilStatus: { type: String, default: '' },
    cedulaProfession: { type: String, default: '' },
    cedulaDob: { type: Date },
    cedulaPlaceOfBirth: { type: String, default: '' },
    cedulaSex: { type: String, default: '' },
    cedulaHeight: { type: String, default: '' },
    cedulaWeight: { type: String, default: '' },
    cedulaTin: { type: String, default: '' },
    cedulaDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    
    status: { 
        type: String, 
        enum: ['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup', 'Active', 'Active - Under Warning', 'Suspended', 'Expired', 'Cancelled', 'Revoked', 'Cancellation Requested'], 
        default: 'Pending',
        get: function(val) {
            if (val === 'Active' || val === 'Active - Under Warning') {
                const years = this.applicationType === 'Renewal' ? 1 : 3;
                const effectiveExpiry = this.expiryDate || (this.approvalDate ? computeManilaExpiryDate(this.approvalDate, years) : null);
                if (effectiveExpiry && isExpired(effectiveExpiry)) {
                    return 'Expired';
                }
            }
            return val;
        }
    },
    applicationType: { type: String, default: 'New' },
    
    // Resubmitted / Corrected tracking
    isResubmitted: { type: Boolean, default: false },
    resubmittedAt: { type: Date },

    // Voluntary cancellation structured tracking
    cancellationDetails: {
        reason: { type: String, default: '' },
        customReason: { type: String, default: '' },
        remarks: { type: String, default: '' },
        letterUrl: { type: String, default: '' },
        requestedAt: { type: Date, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        staffNotes: { type: String, default: '' },
        rejectionReason: { type: String, default: '' }
    },

    // Cancellation or rejection field tracking and evidence
    cancelReason: { type: String, default: '' },
    rejectedField: { type: String, default: '' },
    evidenceUrl: { type: String, default: '' }, 

    // Progressive discipline & suspension tracking
    suspensionEndDate: { type: Date },
    suspensionReason: { type: String, default: '' },
    currentSanction: { type: String, default: '' },
    activeViolationCount: { type: Number, default: 0 },
    
    // Official Treasury Cashier & Payment Receipt fields
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    officialReceiptNo: { type: String, trim: true, default: '' },
    payerName: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'GCash', 'Landbank', ''], default: '' },
    paymentDate: { type: Date },
    paidByCashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cashierName: { type: String, default: '' },
    paymentRemarks: { type: String, default: '' },
    // An in-flight treasury settlement stays private and blocks competing workflow writes.
    paymentSettlement: {
        type: new mongoose.Schema({
            ledgerId: mongoose.Schema.Types.ObjectId,
            officialReceiptNo: String,
            payerName: String,
            amountPaid: Number,
            paymentMethod: String,
            paymentDate: Date,
            paidByCashier: mongoose.Schema.Types.ObjectId,
            cashierName: String,
            paymentRemarks: String,
            allocatedMtop: Boolean
        }, { _id: false }),
        select: false
    },
    paymentHistory: [{
        officialReceiptNo: { type: String, default: '' },
        amountPaid: { type: Number, default: 0 },
        paymentDate: { type: Date },
        payerName: { type: String, default: '' },
        paymentMethod: { type: String, default: '' },
        paidByCashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        cashierName: { type: String, default: '' },
        paymentRemarks: { type: String, default: '' },
        approvalDate: { type: Date },
        expiryDate: { type: Date },
        mtopNo: { type: String, default: '' },
        archivedAt: { type: Date, default: Date.now }
    }],

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

}, { 
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Helper function to evaluate dynamic status on document instances or hydration
function evaluateFranchiseDocument(doc) {
    if (!doc) return;
    const years = doc.applicationType === 'Renewal' ? 1 : 3;
    const effectiveExpiry = doc.expiryDate || (doc.approvalDate ? computeManilaExpiryDate(doc.approvalDate, years) : null);
    if ((doc.status === 'Active' || doc.status === 'Active - Under Warning') && effectiveExpiry && isExpired(effectiveExpiry)) {
        doc.status = 'Expired';
    }
    if (!doc.expiryDate && effectiveExpiry) {
        doc.expiryDate = effectiveExpiry;
    }
}

// Virtual properties for server-authoritative countdown and expiration state
franchiseSchema.virtual('issuedPermit').get(function() {
    if (!hasIssuedPermitSnapshot(this)) return undefined;
    const permit = getIssuedPermit(this);
    return {
        ...permit,
        status: OPERATING_STATUSES.includes(permit.status) && isExpired(permit.expiryDate) ? 'Expired' : permit.status
    };
});

franchiseSchema.virtual('daysRemaining').get(function() {
    const years = this.applicationType === 'Renewal' ? 1 : 3;
    const effectiveExpiry = this.expiryDate || (this.approvalDate ? computeManilaExpiryDate(this.approvalDate, years) : null);
    return effectiveExpiry ? calculateDaysRemaining(effectiveExpiry) : null;
});

franchiseSchema.virtual('isExpired').get(function() {
    const years = this.applicationType === 'Renewal' ? 1 : 3;
    const effectiveExpiry = this.expiryDate || (this.approvalDate ? computeManilaExpiryDate(this.approvalDate, years) : null);
    return effectiveExpiry ? isExpired(effectiveExpiry) : false;
});

franchiseSchema.virtual('isExpiringSoon').get(function() {
    const days = this.daysRemaining;
    return days !== null && days <= 30 && days > 0;
});

// Pre-save lifecycle hook to ensure expiryDate is set and status accurately reflects validity
franchiseSchema.pre('save', function() {
    if (this.approvalDate && !this.expiryDate) {
        const years = this.applicationType === 'Renewal' ? 1 : 3;
        this.expiryDate = computeManilaExpiryDate(this.approvalDate, years);
    }
    if ((this.status === 'Active' || this.status === 'Active - Under Warning') && this.expiryDate && isExpired(this.expiryDate)) {
        this.status = 'Expired';
    }
});

// Post-init hook for Mongoose document hydration
franchiseSchema.post('init', function(doc) {
    evaluateFranchiseDocument(doc);
});

// Post-query middleware for find, findOne, findOneAndUpdate
franchiseSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(res) {
    if (!res) return;
    if (Array.isArray(res)) {
        res.forEach(evaluateFranchiseDocument);
    } else {
        evaluateFranchiseDocument(res);
    }
});

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
franchiseSchema.index(
    { officialReceiptNo: 1 },
    { unique: true, partialFilterExpression: { officialReceiptNo: { $type: 'string', $gt: '' } } }
);
franchiseSchema.index({ 'paymentHistory.officialReceiptNo': 1 });
franchiseSchema.index(
    { mtopNo: 1 },
    { unique: true, partialFilterExpression: { mtopNo: { $type: 'string', $gt: '' } } }
);

// Expiry and status indexes for optimized cron and query performance
franchiseSchema.index({ status: 1, expiryDate: 1 });

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
