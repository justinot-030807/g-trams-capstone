const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    contactNumber: { type: String, required: true },
    message: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
        default: 'Open' 
    },
    adminResponse: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
