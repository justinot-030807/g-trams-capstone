const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['operator', 'admin', 'toda_president'], default: 'operator' },
    
    // BAGONG IDINAGDAG: TODA Association
    todaAssociation: { type: String, default: 'NON-TODA' },

    isVerified: { type: Boolean, default: false },
    profilePic: { type: String, default: '' },
    otp: { type: String },
    otpExpire: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);