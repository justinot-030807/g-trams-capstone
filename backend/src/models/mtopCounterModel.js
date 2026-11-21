const mongoose = require('mongoose');

const mtopCounterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Asia/Manila year
    sequence: { type: Number, required: true, min: 0 }
}, { versionKey: false, writeConcern: { w: 'majority', j: true } });

module.exports = mongoose.models.MtopCounter || mongoose.model('MtopCounter', mtopCounterSchema);
