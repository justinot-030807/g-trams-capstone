const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    operator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    franchise: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Franchise', 
        required: true, 
        index: true 
    },
    plateNo: { 
        type: String, 
        required: true, 
        index: true 
    },
    bodyNumber: { 
        type: String, 
        default: '' 
    },
    driverName: { 
        type: String, 
        default: '' 
    },
    violationType: { 
        type: String, 
        required: true 
    },
    violationCode: { 
        type: String, 
        default: 'OTHER' 
    },
    severity: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Grave'], 
        default: 'Medium' 
    },
    isGrave: { 
        type: Boolean, 
        default: false 
    },
    offenseNumber: { 
        type: Number, 
        required: true, 
        default: 1 
    },
    sanction: {
        type: { 
            type: String, 
            enum: ['Warning', 'Suspension', 'Revocation'], 
            required: true 
        },
        resultingStatus: { 
            type: String, 
            enum: ['Active - Under Warning', 'Suspended', 'Revoked'], 
            required: true 
        },
        fineAmount: { 
            type: Number, 
            default: 0 
        },
        suspensionDays: { 
            type: Number, 
            default: 0 
        },
        suspensionStartDate: { 
            type: Date 
        },
        suspensionEndDate: { 
            type: Date 
        }
    },
    remarks: { 
        type: String, 
        default: '' 
    },
    evidenceUrl: { 
        type: String, 
        default: '' 
    },
    recordedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    recordedByName: { 
        type: String, 
        default: 'BPLO Staff' 
    },
    status: { 
        type: String, 
        enum: ['Active', 'Settled', 'Lifted'], 
        default: 'Active',
        index: true 
    },
    settledAt: { 
        type: Date 
    },
    settledNotes: { 
        type: String, 
        default: '' 
    },
    settledBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { 
    timestamps: true 
});

violationSchema.index({ operator: 1, createdAt: -1 });
violationSchema.index({ franchise: 1, createdAt: -1 });

module.exports = mongoose.model('Violation', violationSchema);
