const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: { 
        type: String, 
        required: true,
        uppercase: true,
        trim: true
    },
    actorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false
    },
    actorName: { 
        type: String, 
        default: 'System Administrator' 
    },
    actorRole: { 
        type: String, 
        default: 'admin' 
    },
    targetType: { 
        type: String, 
        enum: ['Franchise', 'User', 'SystemSettings', 'TODA', 'Auth', 'General'],
        default: 'General'
    },
    targetId: { 
        type: String,
        default: ''
    },
    details: { 
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: { 
        type: String, 
        default: '127.0.0.1' 
    }
}, { timestamps: true });

// Index for high-performance log querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actorId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
