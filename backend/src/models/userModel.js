const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    // Contact and credentials
    contact: { type: String, required: true, unique: true },
    backupContact: { type: String, default: '' },
    email: { type: String, default: '' },
    googleId: { type: String, default: '' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: [
            'system_admin',
            'bplo_staff',
            'cashier',
            'toda_president',
            'operator',
            'driver',
            'admin',
            'administrator',
            'toda president'
        ], 
        default: 'operator' 
    },
    
    // TODA association & Body Number
    todaAssociation: { type: String, default: 'NON-TODA' },
    bodyNumber: { type: String, default: '', trim: true },

    isVerified: { type: Boolean, default: false },
    profilePic: { type: String, default: '' },
    otp: { type: String },
    otpExpire: { type: Date },
    isActive: { type: Boolean, default: true },
    deactivationReason: { type: String, default: '' },
    appealMessage: { type: String, default: '' },
    appealStatus: { type: String, enum: ['none', 'pending', 'reviewed'], default: 'none' },
    lastActive: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const saltRounds = process.env.NODE_ENV === 'test' ? 10 : 12;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);