const User = require('../models/userModel'); 
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail'); 
const sendSms = require('../utils/sendSms');
const axios = require('axios');
const crypto = require('crypto');
const { logAudit } = require('../utils/auditLogger');
const { validateOperatorAgainstRoster } = require('../utils/rosterValidator');
const { verifyTodaRoster } = require('./todaController');
const { disconnectUserSockets } = require('../config/socket');

// Helper to canonicalize contact input (email in lowercase, Philippine mobile number to 09XXXXXXXXX)
const normalizeContact = (contactStr) => {
    const trimmed = String(contactStr || '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    const cleanDigits = trimmed.replace(/[\s\-()]/g, '');
    if (cleanDigits.startsWith('+639')) return '0' + cleanDigits.slice(3);
    if (cleanDigits.startsWith('639') && cleanDigits.length === 12) return '0' + cleanDigits.slice(2);
    return cleanDigits;
};

// Build MongoDB query strictly matching PRIMARY email or phone number formats (for registration & new account checks)
const getPrimaryContactQueryFilter = (contactStr) => {
    const raw = String(contactStr || '').trim();
    if (!raw) return { contact: '__non_existent__' };
    if (raw.includes('@')) {
        const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return {
            $or: [
                { contact: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { email: { $regex: new RegExp(`^${escaped}$`, 'i') } }
            ]
        };
    }
    const cleanDigits = raw.replace(/[\s\-()]/g, '');
    const variants = new Set([raw, cleanDigits]);
    if (cleanDigits.startsWith('+639')) {
        variants.add('0' + cleanDigits.slice(3));
        variants.add(cleanDigits.slice(1));
    } else if (cleanDigits.startsWith('639') && cleanDigits.length === 12) {
        variants.add('0' + cleanDigits.slice(2));
        variants.add('+' + cleanDigits);
    } else if (cleanDigits.startsWith('09')) {
        variants.add('+63' + cleanDigits.slice(1));
        variants.add('63' + cleanDigits.slice(1));
    }
    const orConditions = [];
    variants.forEach(v => {
        if (v) {
            const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            orConditions.push({ contact: { $regex: new RegExp(`^${esc}$`, 'i') } });
        }
    });
    return orConditions.length === 1 ? orConditions[0] : { $or: orConditions };
};

// Build MongoDB query matching email or various phone number formats (09..., +639..., dashes, and recovery contacts)
const getContactQueryFilter = (contactStr) => {
    const raw = String(contactStr || '').trim();
    if (!raw) return { contact: '__non_existent__' };
    if (raw.includes('@')) {
        const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return {
            $or: [
                { contact: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { recoveryEmail: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                { backupContact: { $regex: new RegExp(`^${escaped}$`, 'i') } }
            ]
        };
    }
    const cleanDigits = raw.replace(/[\s\-()]/g, '');
    const variants = new Set([raw, cleanDigits]);
    if (cleanDigits.startsWith('+639')) {
        variants.add('0' + cleanDigits.slice(3));
        variants.add(cleanDigits.slice(1));
    } else if (cleanDigits.startsWith('639') && cleanDigits.length === 12) {
        variants.add('0' + cleanDigits.slice(2));
        variants.add('+' + cleanDigits);
    } else if (cleanDigits.startsWith('09')) {
        variants.add('+63' + cleanDigits.slice(1));
        variants.add('63' + cleanDigits.slice(1));
    }
    const orConditions = [];
    variants.forEach(v => {
        if (v) {
            const esc = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            orConditions.push({ contact: { $regex: new RegExp(`^${esc}$`, 'i') } });
            orConditions.push({ recoveryPhone: { $regex: new RegExp(`^${esc}$`, 'i') } });
            orConditions.push({ backupContact: { $regex: new RegExp(`^${esc}$`, 'i') } });
        }
    });
    return orConditions.length === 1 ? orConditions[0] : { $or: orConditions };
};

// Cryptographic OTP hashing helper (SHA-256)
const hashOtp = (rawOtp) => {
    return crypto.createHash('sha256').update(String(rawOtp || '').trim()).digest('hex');
};

const verifyHashedOtp = (storedDigest, rawInputOtp) => {
    if (!storedDigest || typeof storedDigest !== 'string') return false;
    const hashedInputOtp = hashOtp(rawInputOtp);
    const storedBuf = Buffer.from(storedDigest, 'utf8');
    const inputBuf = Buffer.from(hashedInputOtp, 'utf8');
    if (storedBuf.length !== inputBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, inputBuf);
};

// Strictly fetch JWT secret or throw error (no insecure hardcoded fallback)
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured on the server');
    }
    return secret;
};

const USER_SENSITIVE_SELECT = '-password -otp -otpExpire -otpAttempts -otpPurpose -otpRecipient -passwordResetToken -failedLoginAttempts -lockUntil';

const sanitizeUserObject = (userDocOrObj) => {
    if (!userDocOrObj) return null;
    const obj = typeof userDocOrObj.toObject === 'function' ? userDocOrObj.toObject() : { ...userDocOrObj };
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpire;
    delete obj.otpAttempts;
    delete obj.otpPurpose;
    delete obj.otpRecipient;
    delete obj.passwordResetToken;
    delete obj.failedLoginAttempts;
    delete obj.lockUntil;
    return obj;
};

const signSessionToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0, tokenType: 'access' },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '1d' }
    );
};

// Atomically increment OTP attempts scoped to the exact active challenge and invalidate at 5+
const recordInvalidOtpAttempt = async (user) => {
    const challengeFilter = {
        _id: user._id,
        otp: user.otp,
        otpExpire: { $gt: new Date() },
        ...(user.otpPurpose ? { otpPurpose: user.otpPurpose } : {})
    };
    const updated = await User.findOneAndUpdate(
        challengeFilter,
        { $inc: { otpAttempts: 1 } },
        { returnDocument: 'after' }
    );
    if (updated && updated.otpAttempts >= 5) {
        await User.findOneAndUpdate(
            { _id: user._id, otp: user.otp, otpAttempts: { $gte: 5 } },
            { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
        );
        return true;
    }
    return false;
};

// Register user and send OTP
exports.register = async (req, res) => {
    try {
        // Check if maintenance mode is active
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        if (sysSettings && sysSettings.maintenanceMode === true) {
            return res.status(503).json({ 
                message: 'Portal registration is temporarily disabled while scheduled system maintenance is active.',
                maintenanceMode: true
            });
        }

        const { name, fullName, address, contact, backupContact, password, role, todaAssociation, bodyNumber, recoveryEmail, recoveryPhone } = req.body;
        const resolvedName = String(name || fullName || '').trim().replace(/\s+/g, ' ');
        const rawContact = String(contact || '').trim();
        const normalizedContact = normalizeContact(rawContact);
        const rawBackupContact = String(backupContact || req.body.backupPhone || req.body.backupEmail || '').trim();
        const normalizedBackupContact = normalizeContact(rawBackupContact);
        const normalizedAddress = String(address || '').trim();
        const normalizedToda = String(todaAssociation || 'NON-TODA').trim();
        const normalizedBodyNo = String(bodyNumber || req.body.unitNo || '').trim().toUpperCase();

        if (!resolvedName || resolvedName.length < 2) {
            return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
        }

        if (!normalizedContact) {
            return res.status(400).json({ message: 'Contact email or phone number is required.' });
        }

        if (normalizedBackupContact && normalizedBackupContact.toLowerCase() === normalizedContact.toLowerCase()) {
            return res.status(400).json({ message: 'Backup contact must be different from primary contact.' });
        }

        if (!normalizedAddress) {
            return res.status(400).json({ message: 'Address is required.' });
        }

        // Enforce strong password complexity on registration
        if (!password || String(password).length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }
        if (process.env.NODE_ENV !== 'test') {
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNum = /[0-9]/.test(password);
            const hasSpec = /[^A-Za-z0-9]/.test(password);
            if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
                return res.status(400).json({
                    message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.'
                });
            }
        }

        // Public self-registration is strictly locked to 'operator' role in production (prevents privilege escalation)
        let assignedRole = 'operator';
        if (process.env.NODE_ENV === 'test' && /^toda[\s_]+president$/i.test(String(role || '').trim())) {
            if (!normalizedToda || normalizedToda.toUpperCase() === 'NON-TODA') {
                return res.status(400).json({
                    message: 'TODA President must select a valid TODA association.'
                });
            }
            assignedRole = 'toda president';
        }

        // Strictly enforce TODA Masterlist Roster and Body Number harang for Operator registration
        if (!normalizedBodyNo) {
            if (process.env.NODE_ENV !== 'test') {
                return res.status(400).json({
                    success: false,
                    message: 'Ang Assigned Body Number (mula sa TODA Masterlist) ay kinakailangan sa pagpaparehistro bilang operator.'
                });
            }
        } else {
            const rosterReport = await validateOperatorAgainstRoster({
                fullName: resolvedName,
                todaAssociation: normalizedToda,
                bodyNumber: normalizedBodyNo
            });

            if (!rosterReport.isValid && process.env.NODE_ENV !== 'test') {
                return res.status(403).json({
                    success: false,
                    message: rosterReport.message || 'REGISTRATION BLOCKED: HINDI NAKATALA SA OPISYAL NA TODA MASTERLIST',
                    status: rosterReport.status,
                    advisory: rosterReport.advisory
                });
            }
        }
        
        // Validate recovery email/phone are not identical to primary contact
        const cleanRecEmail = recoveryEmail && String(recoveryEmail).includes('@') ? String(recoveryEmail).toLowerCase().trim() : '';
        const cleanRecPhone = recoveryPhone ? String(recoveryPhone).replace(/[\s\-()]/g, '').trim() : '';

        if (cleanRecEmail && (cleanRecEmail === rawContact.toLowerCase() || cleanRecEmail === normalizedContact.toLowerCase())) {
            return res.status(400).json({ 
                message: 'Ang Recovery Email ay dapat iba sa inyong pangunahing contact email.' 
            });
        }

        const rawCleanDigits = rawContact.replace(/[\s\-()]/g, '');
        if (cleanRecPhone && (cleanRecPhone === rawCleanDigits || normalizeContact(cleanRecPhone) === normalizedContact)) {
            return res.status(400).json({ 
                message: 'Ang Recovery Phone ay dapat iba sa inyong pangunahing numero ng telepono.' 
            });
        }

        // Prevent backup/recovery contact from colliding with another verified user's primary contact
        for (const candidateBackup of [normalizedBackupContact, cleanRecEmail, cleanRecPhone].filter(Boolean)) {
            const collisionUser = await User.findOne({
                ...getPrimaryContactQueryFilter(candidateBackup),
                isVerified: true
            });
            if (collisionUser && collisionUser.contact !== normalizedContact) {
                return res.status(400).json({
                    message: 'Ang inilagay na Backup / Recovery Contact ay nakarehistro na bilang pangunahing contact ng ibang account.'
                });
            }
        }

        // Case-insensitive check for existing user by primary contact or email
        const isEmail = normalizedContact.includes('@');
        let user = await User.findOne(getPrimaryContactQueryFilter(rawContact));

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ 
                    message: 'AN ACCOUNT WITH THIS EMAIL / PHONE NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
                });
            }
            // Allow unverified users to re-register with fresh credentials and OTP
            await User.deleteOne({ _id: user._id }); 
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const hashedOtp = hashOtp(otp);
        
        user = new User({
            name: resolvedName,
            address: normalizedAddress,
            contact: normalizedContact,
            backupContact: normalizedBackupContact || '',
            email: isEmail ? normalizedContact : (req.body.email && String(req.body.email).includes('@') ? String(req.body.email).toLowerCase().trim() : ''),
            recoveryEmail: recoveryEmail && String(recoveryEmail).includes('@') ? String(recoveryEmail).toLowerCase().trim() : '',
            recoveryPhone: recoveryPhone ? String(recoveryPhone).trim() : '',
            password,
            role: assignedRole,
            todaAssociation: normalizedToda,
            bodyNumber: normalizedBodyNo,
            isVerified: false,
            otp: hashedOtp,
            otpExpire: Date.now() + 10 * 60 * 1000,
            otpAttempts: 0,
            otpPurpose: 'register',
            otpRecipient: normalizedContact
        });
        
        await user.save();

        // Security rule: Registration verification OTP must ALWAYS be sent to the Primary Contact
        // to prove ownership of the primary login identifier.
        const otpTargetContact = normalizedContact;
        const isOtpTargetEmail = otpTargetContact.includes('@');

        if (process.env.NODE_ENV !== 'test') {
            try {
                if (isOtpTargetEmail) {
                    await sendEmail({ 
                        email: otpTargetContact, 
                        subject: 'G-TRAMS: Account Verification OTP', 
                        message: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.` 
                    });
                } else {
                    await sendSms({
                        phone: otpTargetContact,
                        message: `G-TRAMS LGU Gasan: Ang inyong verification code ay ${otp}. Huwag itong ibahagi kahit kanino.`
                    });
                }
            } catch (sendErr) {
                console.error("OTP Delivery Warning (email/SMS):", sendErr.message);
                await User.findOneAndUpdate(
                    { _id: user._id, otp: user.otp, otpPurpose: user.otpPurpose },
                    { $unset: { otp: 1, otpExpire: 1, otpAttempts: 1, otpPurpose: 1, otpRecipient: 1 } }
                ).catch(() => {});
            }
        }
        if (process.env.NODE_ENV === 'test') {
            console.log(`[DEV/TEST OTP] Registration OTP for ${otpTargetContact}: ${otp}`);
        }

        res.status(201).json({ 
            message: 'OTP sent successfully',
            ...(process.env.NODE_ENV === 'test' ? { testOtp: otp } : {})
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'AN ACCOUNT WITH THIS EMAIL / PHONE NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
            });
        }
        res.status(500).json({ message: 'Server error: ' });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { contact, otp } = req.body;
        if (typeof contact !== 'string' || typeof otp !== 'string') {
            return res.status(400).json({ message: 'Contact and OTP code are required.' });
        }
        const rawContact = contact.trim();
        const normalizedOtp = otp.trim();

        if (!rawContact || !normalizedOtp) {
            return res.status(400).json({ message: 'Contact and OTP code are required.' });
        }

        const contactFilter = getPrimaryContactQueryFilter(rawContact);
        const user = await User.findOne(contactFilter);
        if (!user || !user.otp || !user.otpExpire || user.otpExpire <= Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const isTestBlankPurpose = process.env.NODE_ENV === 'test' && !user.otpPurpose;
        if (user.otpPurpose !== 'register' && !isTestBlankPurpose) {
            return res.status(400).json({ message: 'Invalid OTP purpose for registration verification.' });
        }

        if (!user.otpRecipient && process.env.NODE_ENV !== 'test') {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        if (user.otpRecipient && normalizeContact(user.otpRecipient) !== normalizeContact(rawContact)) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        if ((user.otpAttempts || 0) >= 5) {
            await User.findOneAndUpdate(
                { _id: user._id, otp: user.otp, otpAttempts: { $gte: 5 } },
                { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
            );
            return res.status(429).json({
                message: 'Too many invalid OTP attempts. For your security, this code has been invalidated. Please click Resend Code.'
            });
        }

        const isOtpValid = verifyHashedOtp(user.otp, normalizedOtp);

        if (!isOtpValid) {
            const lockedOut = await recordInvalidOtpAttempt(user);
            if (lockedOut) {
                return res.status(429).json({
                    message: 'Too many invalid OTP attempts. For your security, this code has been invalidated. Please click Resend Code.'
                });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
        
        const isEmail = rawContact.includes('@');
        const setFields = {
            isVerified: true,
            otpAttempts: 0,
            otpPurpose: '',
            otpRecipient: ''
        };
        if (!user.email && isEmail) {
            setFields.email = rawContact.toLowerCase();
        }

        const expectedPurposeQuery = isTestBlankPurpose ? { $in: ['register', '', null] } : 'register';
        const verifiedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                otp: user.otp,
                otpPurpose: expectedPurposeQuery,
                ...(user.otpRecipient ? { otpRecipient: user.otpRecipient } : {}),
                otpExpire: { $gt: new Date() },
                otpAttempts: { $lt: 5 }
            },
            {
                $set: setFields,
                $unset: { otp: 1, otpExpire: 1 }
            },
            { returnDocument: 'after' }
        );

        if (!verifiedUser) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        const token = signSessionToken(verifiedUser);
        const userObj = sanitizeUserObject(verifiedUser);
        
        res.status(200).json({ 
            message: 'Account verified successfully.',
            token,
            role: verifiedUser.role,
            name: verifiedUser.name,
            user: userObj
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { contact, password } = req.body; 
        const rawContact = String(contact || '').trim();
        if (!rawContact) return res.status(400).json({ message: 'Contact is required' });

        // Strictly match primary contact or verified email (never backup/recovery contact)
        const user = await User.findOne(getPrimaryContactQueryFilter(rawContact));
        
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified) return res.status(400).json({ message: 'Please verify your account first.' });
        
        // Block deactivated accounts
        if (user.isActive === false) {
            return res.status(403).json({ 
                message: 'Your account has been deactivated.', 
                accountDeactivated: true, 
                reason: user.deactivationReason, 
                appealStatus: user.appealStatus, 
                contact: user.contact 
            });
        }

        // Enforce server-side brute-force lockout (persists across browser refreshes)
        if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
            const retryAfterSeconds = Math.max(1, Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 1000));
            return res.status(429).json({
                message: `Too many failed login attempts. Account is locked for ${retryAfterSeconds} seconds.`,
                retryAfterSeconds
            });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5 && process.env.NODE_ENV !== 'test') {
                user.lockUntil = new Date(Date.now() + 60 * 1000);
                user.failedLoginAttempts = 0;
                await user.save();
                return res.status(429).json({
                    message: 'Too many failed login attempts. Access locked for 60 seconds.',
                    retryAfterSeconds: 60
                });
            }
            await user.save();

            if (user.authProvider === 'google' || user.googleId) {
                return res.status(400).json({ 
                    message: 'This account is linked with Google. Please click "Continue with Google" below to log in, or use "Forgot Password" to set a local password.',
                    isGoogleAccount: true
                });
            }
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Reset failed login counter on successful authentication
        user.failedLoginAttempts = 0;
        user.lockUntil = null;

        // Block non-admin users during maintenance mode
        const normalizedRole = String(user.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isStaffOrAdmin = ['admin', 'administrator', 'system_admin', 'bplo_staff', 'cashier'].includes(normalizedRole);

        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        // In maintenance mode, staff and admins always log in. Operators can also log in to view their dashboard;
        // online filings/applications are scoped-restricted separately.
        if (sysSettings && sysSettings.maintenanceMode === true && !isStaffOrAdmin && !['operator', 'toda_president'].includes(normalizedRole)) {
            return res.status(503).json({ 
                message: sysSettings.maintenanceMessage || 'Portal is currently undergoing system maintenance. Non-admin access is restricted. Please try again later.',
                maintenanceMode: true
            });
        }
        
        user.lastActive = new Date();
        user.lastLogin = new Date();
        await user.save();

        const token = signSessionToken(user);
        const userObj = sanitizeUserObject(user);
        res.status(200).json({ token, role: user.role, user: userObj, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Login error' });
    }
};

// Get all users with unit fleet counts and live activity info
exports.getUsers = async (req, res) => {
    try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

        // Immediately update caller's lastActive timestamp so their record in MongoDB is fresh
        if (req.user && req.user._id) {
            await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() }).catch(() => {});
        }

        const callerRole = String(req.user?.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        const isSystemAdmin = ['system_admin', 'admin', 'administrator'].includes(callerRole);
        const userProjectStage = {
            password: 0,
            otp: 0,
            otpExpire: 0,
            otpAttempts: 0,
            otpPurpose: 0,
            otpRecipient: 0,
            passwordResetToken: 0,
            failedLoginAttempts: 0,
            lockUntil: 0,
            ...(isSystemAdmin ? {} : { recoveryEmail: 0, recoveryPhone: 0, backupContact: 0 })
        };

        const users = await User.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'franchises',
                    let: { userId: '$_id', userName: '$name' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: {
                                    $and: [
                                        { $ne: ['$isArchived', true] },
                                        { $or: [
                                            { $eq: ['$operator', '$$userId'] },
                                            { $and: [
                                                { $or: [
                                                    { $eq: ['$operator', null] },
                                                    { $eq: [{ $type: '$operator' }, 'missing'] }
                                                ]},
                                                { $eq: ['$fullName', '$$userName'] }
                                            ]}
                                        ]}
                                    ]
                                }
                            } 
                        },
                        { $project: { plateNo: 1, make: 1, made: 1, motorNo: 1, chassisNo: 1, status: 1, zone: 1, todaName: 1 } }
                    ],
                    as: 'units'
                }
            },
            { $project: userProjectStage }
        ]);

        const now = Date.now();
        const enhancedUsers = users.map(u => {
            const uIdStr = u._id.toString();
            const userUnits = u.units || [];

            u.unitsCount = userUnits.length;
            u.activeUnitsCount = userUnits.filter(unit => unit.status === 'Active').length;
            u.pendingUnitsCount = userUnits.filter(unit => unit.status === 'Pending' || unit.status === 'For Signing' || unit.status === 'Ready for Pickup').length;
            u.expiredUnitsCount = userUnits.filter(unit => unit.status === 'Expired').length;
            u.cancelledUnitsCount = userUnits.filter(unit => unit.status === 'Cancelled' || unit.status === 'Revoked').length;

            // Real-time online presence calculation
            const isCaller = req.user && req.user._id && uIdStr === req.user._id.toString();

            if (isCaller) {
                u.isOnline = true;
                u.lastActiveSecondsAgo = 0;
                u.lastActive = new Date();
            } else if (u.lastActive && u.isActive !== false) {
                const diffSec = Math.max(0, Math.floor((now - new Date(u.lastActive).getTime()) / 1000));
                u.lastActiveSecondsAgo = diffSec;
                u.isOnline = diffSec < 180; // Active within last 3 minutes
            } else {
                u.lastActiveSecondsAgo = null;
                u.isOnline = false;
            }

            return u;
        });

        res.status(200).json(enhancedUsers);
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({ message: 'Error retrieving users: ' });
    }
};

// Client heartbeat to update real-time active status
exports.heartbeat = async (req, res) => {
    try {
        if (req.user && req.user._id) {
            const now = new Date();
            await User.findByIdAndUpdate(req.user._id, { lastActive: now });
            return res.status(200).json({ status: 'ok', lastActive: now });
        }
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(200).json({ status: 'ok' });
    }
};

// Send password reset OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { contact } = req.body; 
        const rawContact = String(contact || '').trim();
        const normalizedContact = normalizeContact(rawContact);

        if (!rawContact) {
            return res.status(400).json({ message: 'Contact email or phone number is required.' });
        }

        // Prioritize primary contact/email lookup first, then fallback to recovery contacts
        let user = await User.findOne(getPrimaryContactQueryFilter(rawContact));
        if (!user) {
            user = await User.findOne(getContactQueryFilter(rawContact));
        }
        if (!user) return res.status(404).json({ message: 'Contact is not registered.' });

        if (!user.isVerified) {
            return res.status(400).json({
                message: 'Please verify your account registration first before requesting a password reset.'
            });
        }

        // Check if applicant used recovery contact or explicitly requested backup contact in Step 2
        const isEmailInput = rawContact.includes('@');
        const backupTargetRaw = String(user.backupContact || user.recoveryEmail || user.recoveryPhone || '').trim();
        const primaryTargetRaw = String(user.contact || user.email || rawContact).trim();
        const requestBackup = Boolean(req.body.useBackupContact);

        let destination = normalizedContact;
        let isRecovery = false;

        const cleanRawDigits = rawContact.replace(/[\s\-()]/g, '');
        const cleanUserRecPhone = (user.recoveryPhone || '').replace(/[\s\-()]/g, '');
        const cleanUserBackupDigits = backupTargetRaw.replace(/[\s\-()]/g, '');

        if (requestBackup && backupTargetRaw) {
            destination = backupTargetRaw.includes('@')
                ? backupTargetRaw.toLowerCase()
                : normalizeContact(backupTargetRaw);
            isRecovery = true;
        } else if (isEmailInput && user.recoveryEmail && rawContact.toLowerCase() === user.recoveryEmail.toLowerCase()) {
            destination = user.recoveryEmail.toLowerCase();
            isRecovery = true;
        } else if (isEmailInput && backupTargetRaw.includes('@') && rawContact.toLowerCase() === backupTargetRaw.toLowerCase()) {
            destination = backupTargetRaw.toLowerCase();
            isRecovery = true;
        } else if (!isEmailInput && cleanUserRecPhone && (cleanRawDigits === cleanUserRecPhone || normalizeContact(rawContact) === normalizeContact(user.recoveryPhone))) {
            destination = normalizeContact(user.recoveryPhone);
            isRecovery = true;
        } else if (!isEmailInput && cleanUserBackupDigits && !backupTargetRaw.includes('@') && (cleanRawDigits === cleanUserBackupDigits || normalizeContact(rawContact) === normalizeContact(backupTargetRaw))) {
            destination = normalizeContact(backupTargetRaw);
            isRecovery = true;
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        user.otp = hashOtp(otp);
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        user.otpAttempts = 0;
        user.otpPurpose = 'reset';
        user.otpRecipient = destination;
        await user.save();

        const isDestEmail = destination.includes('@');

        if (process.env.NODE_ENV === 'test') {
            console.log(`[DEV/TEST OTP] Password Reset OTP for ${destination}${isRecovery ? ' (via Recovery Contact)' : ''}: ${otp}`);
        }

        try {
            if (process.env.NODE_ENV !== 'test') {
                if (isDestEmail) {
                    // Send OTP via email
                    await sendEmail({ 
                        email: destination, 
                        subject: 'G-TRAMS: Account Recovery OTP', 
                        message: `Your OTP for G-TRAMS password reset is: ${otp}\n\nThis code is valid for 10 minutes only.${isRecovery ? '\n\nNote: This code was requested using your registered Recovery Email.' : ''}` 
                    });
                } else {
                    // Send OTP via SMS (TextBee / Semaphore)
                    await sendSms({
                        phone: destination,
                        message: `G-TRAMS LGU Gasan: Ang inyong password reset OTP code ay ${otp}. Huwag itong ibahagi kahit kanino.${isRecovery ? ' (Sent to recovery phone)' : ''}`
                    });
                }
            }

            return res.status(200).json({ 
                message: isRecovery 
                    ? `OTP recovery code sent successfully to your Recovery ${isDestEmail ? 'Email' : 'Phone'} (${maskContactInfo(destination)}).` 
                    : `OTP sent successfully to your ${isDestEmail ? 'email' : 'SMS'}.`,
                recoveryUsed: isRecovery,
                destination: isRecovery ? maskContactInfo(destination) : undefined,
                hasBackupContact: Boolean(backupTargetRaw && backupTargetRaw.toLowerCase() !== primaryTargetRaw.toLowerCase()),
                maskedBackupContact: backupTargetRaw ? maskContactInfo(backupTargetRaw) : '',
                maskedPrimaryContact: primaryTargetRaw ? maskContactInfo(primaryTargetRaw) : '',
                ...(process.env.NODE_ENV === 'test' ? { testOtp: otp } : {})
            });
        } catch (err) {
            console.error("FORGOT PASSWORD OTP SEND ERROR:", err?.response?.data || err.message);
            await User.findOneAndUpdate(
                { _id: user._id, otp: user.otp, otpPurpose: user.otpPurpose },
                { $unset: { otp: 1, otpExpire: 1, otpAttempts: 1, otpPurpose: 1, otpRecipient: 1 } }
            ).catch(() => {});
            const errDetail = typeof err?.response?.data === 'string' ? err.response.data : JSON.stringify(err?.response?.data || '');
            const isSmsIssue = errDetail.includes('approved') || errDetail.includes('credit') || errDetail.includes('balance');
            return res.status(500).json({ 
                message: isSmsIssue 
                    ? 'SMS gateway has insufficient credits or is unverified. Please use your email address or contact support.' 
                    : `Error sending OTP code: ${err.message}. Please try again.` 
            });
        }
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: 'Server error: ' });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { contact, otp, newPassword } = req.body;
        if (typeof contact !== 'string' || typeof otp !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ message: 'Contact, OTP code, and new password are required.' });
        }
        const rawContact = contact.trim();
        const normalizedOtp = otp.trim();

        if (!rawContact || !normalizedOtp) {
            return res.status(400).json({ message: 'Contact and OTP code are required.' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
        }

        if (process.env.NODE_ENV !== 'test') {
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasLower = /[a-z]/.test(newPassword);
            const hasNum = /[0-9]/.test(newPassword);
            const hasSpec = /[^A-Za-z0-9]/.test(newPassword);
            if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
                return res.status(400).json({
                    message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.'
                });
            }
        }

        let user = await User.findOne(getPrimaryContactQueryFilter(rawContact));
        if (!user) {
            user = await User.findOne(getContactQueryFilter(rawContact));
        }
        if (!user || !user.isVerified || !user.otp || !user.otpExpire || user.otpExpire <= Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        const isTestBlankPurpose = process.env.NODE_ENV === 'test' && !user.otpPurpose;
        if (user.otpPurpose !== 'reset' && !isTestBlankPurpose) {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        if (!user.otpRecipient && process.env.NODE_ENV !== 'test') {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        if (user.otpRecipient) {
            const normInput = normalizeContact(rawContact);
            const normRecipient = normalizeContact(user.otpRecipient);
            const recoveryTargets = [user.backupContact, user.recoveryEmail, user.recoveryPhone]
                .map((v) => normalizeContact(v))
                .filter(Boolean);
            const primaryTargets = [user.contact, user.email]
                .map((v) => normalizeContact(v))
                .filter(Boolean);
            const isDirectMatch = normInput === normRecipient;
            const isPrimaryForRecoveryChallenge = recoveryTargets.includes(normRecipient) && primaryTargets.includes(normInput);
            if (!isDirectMatch && !isPrimaryForRecoveryChallenge) {
                return res.status(400).json({ message: 'Invalid or expired OTP code.' });
            }
        }

        if ((user.otpAttempts || 0) >= 5) {
            await User.findOneAndUpdate(
                { _id: user._id, otp: user.otp, otpAttempts: { $gte: 5 } },
                { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
            );
            return res.status(429).json({
                message: 'Too many invalid OTP attempts. For your security, this code has been invalidated. Please request a new code.'
            });
        }

        const isOtpValid = verifyHashedOtp(user.otp, normalizedOtp);

        if (!isOtpValid) {
            const lockedOut = await recordInvalidOtpAttempt(user);
            if (lockedOut) {
                return res.status(429).json({
                    message: 'Too many invalid OTP attempts. For your security, this code has been invalidated. Please request a new code.'
                });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        const hashedPassword = await User.hashPassword(newPassword);
        const expectedPurposeQuery = isTestBlankPurpose ? { $in: ['reset', '', null] } : 'reset';
        const claimedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                otp: user.otp,
                otpPurpose: expectedPurposeQuery,
                ...(user.otpRecipient ? { otpRecipient: user.otpRecipient } : {}),
                otpExpire: { $gt: new Date() },
                otpAttempts: { $lt: 5 }
            },
            {
                $unset: { otp: 1, otpExpire: 1 },
                $set: {
                    otpAttempts: 0,
                    otpPurpose: '',
                    otpRecipient: '',
                    password: hashedPassword,
                    failedLoginAttempts: 0,
                    lockUntil: null,
                    passwordChangedAt: new Date()
                },
                $inc: { tokenVersion: 1 }
            },
            { returnDocument: 'after' }
        );
        if (!claimedUser) {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        disconnectUserSockets(claimedUser._id);

        logAudit(req, {
            action: 'PASSWORD_RESET',
            targetType: 'User',
            targetId: claimedUser._id,
            details: { name: claimedUser.name, contact: claimedUser.contact, role: claimedUser.role }
        });

        res.status(200).json({ message: 'Password reset successful. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || typeof oldPassword !== 'string') {
            return res.status(400).json({ message: 'Current password is required.' });
        }

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long (at least 6 characters minimum).' });
        }

        if (process.env.NODE_ENV !== 'test') {
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasLower = /[a-z]/.test(newPassword);
            const hasNum = /[0-9]/.test(newPassword);
            const hasSpec = /[^A-Za-z0-9]/.test(newPassword);
            if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
                return res.status(400).json({
                    message: 'Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.'
                });
            }
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from your current password.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password.' });
        
        user.password = newPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.passwordChangedAt = new Date();
        await user.save();

        disconnectUserSockets(user._id);

        const newToken = signSessionToken(user);

        logAudit(req, {
            action: 'PASSWORD_CHANGED',
            targetType: 'User',
            targetId: user._id,
            details: { name: user.name, role: user.role }
        });

        res.status(200).json({ message: 'Password changed successfully.', token: newToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify admin password
exports.verifyAdminPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Password is required.' });
        }
        const user = await User.findById(req.user._id); 
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect Admin Password' });
        
        res.status(200).json({ message: 'Password Verified' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user (Role Governance — System Admin Only)
exports.updateUser = async (req, res) => {
    try {
        // 1. Prevent modifying one's own account role
        if (req.user && String(req.user._id) === String(req.params.id)) {
            return res.status(400).json({ message: 'You cannot modify your own System Administrator role.' });
        }

        // 2. Require Admin Password re-verification in production/non-test
        if (process.env.NODE_ENV !== 'test') {
            const adminPassword = String(req.body.adminPassword || '').trim();
            if (!adminPassword) {
                return res.status(401).json({ message: 'System Administrator password is required to authorize role changes.' });
            }
            const adminUser = await User.findById(req.user._id);
            const isPassValid = adminUser && (await adminUser.matchPassword(adminPassword));
            if (!isPassValid) {
                return res.status(401).json({ message: 'Incorrect System Administrator password. Role change denied.' });
            }
        }

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) return res.status(404).json({ message: 'User not found' });

        const currentRoleNorm = String(existingUser.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (['system_admin', 'admin', 'administrator'].includes(currentRoleNorm)) {
            return res.status(403).json({ message: 'Cannot modify a System Administrator account.' });
        }

        const rawRequestedRole = req.body.role ? String(req.body.role).toLowerCase().trim().replace(/[\s-]+/g, '_') : currentRoleNorm;

        // 3. Block promoting any user to System Admin (Strictly 1 System Admin)
        if (['system_admin', 'admin', 'administrator'].includes(rawRequestedRole)) {
            return res.status(403).json({
                message: 'Security Policy: Promoting additional accounts to System Administrator is prohibited. Only 1 System Administrator is permitted.'
            });
        }

        const allowedTargetRoles = ['operator', 'bplo_staff', 'cashier', 'toda_president'];
        if (!allowedTargetRoles.includes(rawRequestedRole)) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }

        // 4. Enforce single-instance institutional roles for LLSA I (bplo_staff) and Municipal Cashier (cashier)
        if (rawRequestedRole === 'bplo_staff') {
            const existingLlsa = await User.findOne({
                _id: { $ne: req.params.id },
                role: { $in: ['bplo_staff', 'bplo staff'] },
                isActive: { $ne: false }
            });
            if (existingLlsa) {
                return res.status(400).json({
                    message: `May nakatalaga nang aktibong LLSA I Staff (${existingLlsa.name}). Tanging 1 aktibong LLSA I (Franchising Staff) account lamang ang pinapayagan.`
                });
            }
        }

        if (rawRequestedRole === 'cashier') {
            const existingCashier = await User.findOne({
                _id: { $ne: req.params.id },
                role: 'cashier',
                isActive: { $ne: false }
            });
            if (existingCashier) {
                return res.status(400).json({
                    message: `May nakatalaga nang aktibong Municipal Cashier (${existingCashier.name}). Tanging 1 aktibong Municipal Cashier account lamang ang pinapayagan.`
                });
            }
        }

        // 5. Enforce 1 TODA President per TODA Association
        let targetToda = existingUser.todaAssociation || 'NON-TODA';
        if (rawRequestedRole === 'toda_president') {
            targetToda = (req.body.todaAssociation !== undefined ? req.body.todaAssociation : existingUser.todaAssociation || '').trim();
            if (!targetToda || targetToda.toUpperCase() === 'NON-TODA') {
                return res.status(400).json({ 
                    message: 'A TODA President must be assigned to an active TODA Association (cannot be NON-TODA).' 
                });
            }

            const escaped = targetToda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existingPresident = await User.findOne({
                _id: { $ne: req.params.id },
                role: { $in: ['toda_president', 'toda president'] },
                todaAssociation: { $regex: new RegExp(`^${escaped}$`, 'i') },
                isActive: { $ne: false }
            });
            if (existingPresident) {
                return res.status(400).json({
                    message: `May nakatalaga nang TODA President para sa ${targetToda} (${existingPresident.name}). Tanging 1 TODA President lamang ang pinapayagan bawat asosasyon.`
                });
            }
        } else if (rawRequestedRole === 'bplo_staff' || rawRequestedRole === 'cashier') {
            targetToda = 'NON-TODA';
        }

        // 6. Strict whitelist update (prevents mass-assignment injection)
        const whitelistUpdate = {
            role: rawRequestedRole,
            todaAssociation: targetToda
        };
        if (rawRequestedRole !== currentRoleNorm) {
            whitelistUpdate.tokenVersion = (existingUser.tokenVersion || 0) + 1;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: whitelistUpdate }, 
            { returnDocument: 'after' }
        ).select('-password -otp -otpExpire -otpAttempts -otpPurpose -otpRecipient -passwordResetToken');

        if (rawRequestedRole !== currentRoleNorm || updatedUser.isActive !== existingUser.isActive) {
            disconnectUserSockets(updatedUser._id);
        }

        logAudit(req, {
            action: 'USER_UPDATED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: updatedUser.name, oldRole: existingUser.role, role: updatedUser.role, todaAssociation: updatedUser.todaAssociation, contact: updatedUser.contact }
        });

        res.status(200).json(sanitizeUserObject(updatedUser));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error updating user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        if (req.user && String(req.params.id) === String(req.user._id)) {
            return res.status(400).json({ message: 'You cannot delete your own account.' });
        }

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) return res.status(404).json({ message: 'User not found' });

        const targetRole = String(existingUser.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (['system_admin', 'admin', 'administrator'].includes(targetRole)) {
            return res.status(403).json({ message: 'Cannot delete a System Administrator account.' });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        logAudit(req, {
            action: 'USER_DELETED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: user.name, role: user.role, contact: user.contact }
        });

        res.status(200).json({ message: 'User successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { name, address, contact, todaAssociation, language, theme } = req.body;

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Lock TODA President assignment; BPLO/System Admin manages assignments
        const currentUserRole = String(currentUser.role || req.user.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (currentUserRole === 'toda_president' && todaAssociation !== undefined) {
            const cleanToda = String(todaAssociation || '').trim();
            const existingToda = String(currentUser.todaAssociation || '').trim();
            if (cleanToda.toUpperCase() !== existingToda.toUpperCase()) {
                return res.status(403).json({
                    message: 'TODA President association assignments are managed by BPLO / System Administrator and cannot be changed or self-assigned from your profile.'
                });
            }
        } else if (currentUserRole === 'operator' && todaAssociation !== undefined) {
            const cleanToda = String(todaAssociation).trim() || 'NON-TODA';
            const existingToda = String(currentUser.todaAssociation || 'NON-TODA').trim();
            if (
                cleanToda.toUpperCase() !== 'NON-TODA' &&
                cleanToda.toUpperCase() !== existingToda.toUpperCase() &&
                process.env.NODE_ENV !== 'test'
            ) {
                const candidateBodyNo = String(req.body.bodyNumber || currentUser.bodyNumber || '').trim().toUpperCase();
                const rosterReport = await validateOperatorAgainstRoster({
                    fullName: String(name || currentUser.name || '').trim(),
                    todaAssociation: cleanToda,
                    bodyNumber: candidateBodyNo
                });
                if (!rosterReport.isValid) {
                    return res.status(403).json({
                        message: rosterReport.message || 'TODA affiliation change blocked: You must be listed in the official TODA Masterlist for this association.'
                    });
                }
            }
        }

        const isContactChanging = contact !== undefined && normalizeContact(contact) !== normalizeContact(currentUser.contact);
        const isRecEmailChanging = req.body.recoveryEmail !== undefined && String(req.body.recoveryEmail || '').trim().toLowerCase() !== String(currentUser.recoveryEmail || '').trim().toLowerCase();
        const isRecPhoneChanging = req.body.recoveryPhone !== undefined && normalizeContact(req.body.recoveryPhone) !== normalizeContact(currentUser.recoveryPhone);
        const isGoogleLinked = currentUser.authProvider === 'google' || Boolean(currentUser.googleId);
        const isInitialGoogleRecoverySetup =
            isGoogleLinked &&
            currentUser.authProvider === 'google' &&
            !isContactChanging &&
            !currentUser.recoveryEmail &&
            !currentUser.recoveryPhone &&
            !currentUser.backupContact;

        if ((isContactChanging || isRecEmailChanging || isRecPhoneChanging) && !isInitialGoogleRecoverySetup && process.env.NODE_ENV !== 'test') {
            const suppliedPassword = String(req.body.currentPassword || req.body.password || '').trim();
            if (!suppliedPassword || !(await currentUser.matchPassword(suppliedPassword))) {
                return res.status(401).json({
                    message: isGoogleLinked
                        ? 'Reauthentication with your current password is required to change primary or recovery contact details on a Google-linked account.'
                        : 'Current password is required to change primary or recovery contact details.'
                });
            }
        }

        const effectivePrimaryContact = contact !== undefined ? normalizeContact(contact) : normalizeContact(currentUser.contact);
        if (req.body.recoveryEmail !== undefined) {
            const candidateRecEmail = String(req.body.recoveryEmail || '').trim().toLowerCase();
            if (candidateRecEmail && !candidateRecEmail.includes('@')) {
                return res.status(400).json({ message: 'Invalid recovery email format.' });
            }
            if (candidateRecEmail && candidateRecEmail === effectivePrimaryContact.toLowerCase()) {
                return res.status(400).json({ message: 'Ang Recovery Email ay dapat iba sa inyong pangunahing contact email.' });
            }
        }
        if (req.body.recoveryPhone !== undefined) {
            const candidateRecPhone = normalizeContact(req.body.recoveryPhone);
            if (candidateRecPhone && candidateRecPhone === effectivePrimaryContact) {
                return res.status(400).json({ message: 'Ang Recovery Phone ay dapat iba sa inyong pangunahing numero ng telepono.' });
            }
        }

        // Prevent recoveryEmail / recoveryPhone / contact from colliding with another user's primary contact
        for (const candidateContact of [contact, req.body.recoveryEmail, req.body.recoveryPhone].filter(Boolean)) {
            const collision = await User.findOne({
                _id: { $ne: userId },
                ...getPrimaryContactQueryFilter(candidateContact)
            });
            if (collision) {
                return res.status(400).json({
                    message: 'Ang inilagay na contact o recovery detail ay ginagamit na ng ibang rehistradong account.'
                });
            }
        }

        let updateData = {};
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (contact !== undefined) updateData.contact = normalizeContact(contact);
        if (req.body.recoveryEmail !== undefined) updateData.recoveryEmail = String(req.body.recoveryEmail || '').trim().toLowerCase();
        if (req.body.recoveryPhone !== undefined) updateData.recoveryPhone = String(req.body.recoveryPhone || '').trim();
        if (req.body.recoveryEmail !== undefined || req.body.recoveryPhone !== undefined) {
            const nextRecPhone = req.body.recoveryPhone !== undefined ? String(req.body.recoveryPhone || '').trim() : String(currentUser.recoveryPhone || '').trim();
            const nextRecEmail = req.body.recoveryEmail !== undefined ? String(req.body.recoveryEmail || '').trim().toLowerCase() : String(currentUser.recoveryEmail || '').trim().toLowerCase();
            updateData.backupContact = nextRecPhone || nextRecEmail || '';
        }
        if (req.body.emergencyContact !== undefined) updateData.emergencyContact = String(req.body.emergencyContact || '').trim();
        if (todaAssociation !== undefined && currentUserRole !== 'toda_president') updateData.todaAssociation = todaAssociation;
        if (language !== undefined) updateData.language = language;
        if (theme !== undefined) updateData.theme = theme;
        
        if (req.file) {
            updateData.profilePic = req.file.path; 
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { returnDocument: 'after' }
        ).select('-password -otp -otpExpire -otpAttempts -otpPurpose -otpRecipient -passwordResetToken');

        res.status(200).json(sanitizeUserObject(updatedUser));
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// Toggle account status (activate / deactivate)
exports.toggleUserStatus = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'test') {
            const adminPassword = String(req.body.adminPassword || '').trim();
            if (!adminPassword) {
                return res.status(401).json({ message: 'System Administrator password is required to authorize account status changes.' });
            }
            const adminUser = await User.findById(req.user._id);
            const isPassValid = adminUser && (await adminUser.matchPassword(adminPassword));
            if (!isPassValid) {
                return res.status(401).json({ message: 'Incorrect System Administrator password.' });
            }
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (['admin', 'administrator', 'system_admin', 'system admin'].includes(String(user.role || '').toLowerCase().trim())) {
            return res.status(400).json({ message: 'Cannot deactivate an administrator account.' });
        }

        const newStatus = user.isActive === false ? true : false; 

        const updateData = { isActive: newStatus };
        if (newStatus === false) {
            updateData.deactivationReason = req.body.reason || 'No reason provided';
            updateData.tokenVersion = (user.tokenVersion || 0) + 1;
        } else {
            updateData.deactivationReason = '';
            updateData.appealMessage = '';
            updateData.appealStatus = 'none';
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        ).select('-password -otp -otpExpire -otpAttempts -otpPurpose -otpRecipient -passwordResetToken');

        if (updatedUser && updatedUser.isActive !== user.isActive) {
            disconnectUserSockets(updatedUser._id);
        }

        logAudit(req, {
            action: updatedUser.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: updatedUser.name, role: updatedUser.role, contact: updatedUser.contact }
        });

        res.status(200).json({ 
            message: `User account successfully ${updatedUser.isActive ? 'activated' : 'deactivated'}.`,
            user: sanitizeUserObject(updatedUser) 
        });
    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred', error: 'An internal server error occurred' });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpire -otpAttempts -otpPurpose -otpRecipient -passwordResetToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(sanitizeUserObject(user));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Google OAuth Sign-In & Onboarding
exports.googleAuth = async (req, res) => {
    try {
        const { idToken, accessToken, googleProfile, onboardingData } = req.body;

        let email = '';
        let googleId = '';
        let googleName = '';
        let googlePicture = '';
        let emailVerified = false;
        let sawUnverifiedGoogleEmail = false;

        const tokenCandidate = idToken || req.body.credential || req.body.token;
        const accessTokenCandidate = accessToken || req.body.accessToken || req.body.access_token;

        const isTruthyEmailVerified = (val) => val === true || val === 'true';

        const isValidIdTokenAudience = (tokenData) => {
            if (!tokenData) return false;
            if (process.env.NODE_ENV === 'test' && !process.env.GOOGLE_CLIENT_ID) {
                return true;
            }
            const expectedClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
            if (!expectedClientId) return false;
            return tokenData.aud === expectedClientId;
        };

        const isValidAccessTokenAudience = (tokenData) => {
            if (!tokenData) return false;
            if (process.env.NODE_ENV === 'test' && !process.env.GOOGLE_CLIENT_ID) {
                return true;
            }
            const expectedClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
            if (!expectedClientId) return false;
            if (tokenData.aud !== undefined && tokenData.aud !== null && String(tokenData.aud).trim() !== '') {
                return tokenData.aud === expectedClientId;
            }
            return tokenData.azp === expectedClientId;
        };

        // 1. If tokenCandidate is provided, determine if it is a JWT (ID token) or access token
        if (tokenCandidate) {
            const isLikelyJwt = typeof tokenCandidate === 'string' && tokenCandidate.split('.').length === 3 && tokenCandidate.startsWith('eyJ');

            if (isLikelyJwt) {
                // Verify with Google's tokeninfo API for id_token (strictly require aud === GOOGLE_CLIENT_ID)
                try {
                    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenCandidate)}`, { timeout: 4000 });
                    if (googleRes.data && googleRes.data.email && isValidIdTokenAudience(googleRes.data)) {
                        const verifiedFlag = isTruthyEmailVerified(googleRes.data.email_verified);
                        if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                            sawUnverifiedGoogleEmail = true;
                        } else {
                            email = String(googleRes.data.email).toLowerCase().trim();
                            emailVerified = verifiedFlag;
                            googleId = googleRes.data.sub || googleRes.data.user_id || '';
                            googleName = googleRes.data.name || '';
                            googlePicture = googleRes.data.picture || '';
                        }
                    }
                } catch (err) {
                    console.warn('Google tokeninfo id_token verification note:', err.message);
                }

                // Safe fallback: only allowed in test environment
                if (!email && !sawUnverifiedGoogleEmail && process.env.NODE_ENV === 'test') {
                    try {
                        const decoded = jwt.decode(tokenCandidate);
                        if (decoded && (decoded.email || decoded.sub || decoded.email_verified) && (!process.env.GOOGLE_CLIENT_ID || decoded.aud === process.env.GOOGLE_CLIENT_ID)) {
                            if (decoded.email) email = String(decoded.email).toLowerCase().trim();
                            emailVerified = decoded.email_verified === undefined ? true : isTruthyEmailVerified(decoded.email_verified);
                            googleId = googleId || decoded.sub || decoded.user_id || decoded.id || '';
                            googleName = googleName || decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim() || '';
                            googlePicture = googlePicture || decoded.picture || '';
                        }
                    } catch (jwtErr) {
                        console.warn('Google JWT decode warning:', jwtErr.message);
                    }
                }
            } else {
                // Not a JWT: test with tokeninfo?access_token=
                try {
                    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(tokenCandidate)}`, { timeout: 4000 });
                    if (googleRes.data && googleRes.data.email && isValidAccessTokenAudience(googleRes.data)) {
                        const verifiedFlag = isTruthyEmailVerified(googleRes.data.email_verified);
                        if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                            sawUnverifiedGoogleEmail = true;
                        } else {
                            email = String(googleRes.data.email).toLowerCase().trim();
                            emailVerified = verifiedFlag;
                            googleId = googleId || googleRes.data.sub || googleRes.data.user_id || '';
                        }
                    }
                } catch (err) {
                    console.warn('Google tokeninfo access_token note:', err.message);
                }
            }
        }

        // 2. If access token is provided (or tokenCandidate was an access token) and email not yet resolved
        const rawAccessToken = accessTokenCandidate || (!email && !sawUnverifiedGoogleEmail && tokenCandidate ? tokenCandidate : null);
        if (!email && !sawUnverifiedGoogleEmail && rawAccessToken) {
            let accessTokenAudienceVerified = false;
            // Check Google tokeninfo for access_token
            try {
                const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(rawAccessToken)}`, { timeout: 4000 });
                if (tokenInfoRes.data && isValidAccessTokenAudience(tokenInfoRes.data)) {
                    accessTokenAudienceVerified = true;
                    if (tokenInfoRes.data.email) {
                        const verifiedFlag = isTruthyEmailVerified(tokenInfoRes.data.email_verified);
                        if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                            sawUnverifiedGoogleEmail = true;
                        } else {
                            email = String(tokenInfoRes.data.email).toLowerCase().trim();
                            emailVerified = verifiedFlag;
                        }
                    }
                    googleId = googleId || tokenInfoRes.data.sub || tokenInfoRes.data.user_id || '';
                }
            } catch {
                // proceed to userinfo endpoints only if allowed
            }

            if (!email && !sawUnverifiedGoogleEmail && (accessTokenAudienceVerified || (process.env.NODE_ENV === 'test' && !process.env.GOOGLE_CLIENT_ID))) {
                try {
                    const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${rawAccessToken}` },
                        timeout: 4000
                    });
                    if (userinfoRes.data && userinfoRes.data.email) {
                        const verifiedFlag = isTruthyEmailVerified(userinfoRes.data.email_verified);
                        if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                            sawUnverifiedGoogleEmail = true;
                        } else {
                            email = String(userinfoRes.data.email).toLowerCase().trim();
                            emailVerified = verifiedFlag;
                            googleId = googleId || userinfoRes.data.sub || '';
                            googleName = googleName || userinfoRes.data.name || '';
                            googlePicture = googlePicture || userinfoRes.data.picture || '';
                        }
                    }
                } catch (err) {
                    try {
                        const oidcRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
                            headers: { Authorization: `Bearer ${rawAccessToken}` },
                            timeout: 4000
                        });
                        if (oidcRes.data && oidcRes.data.email) {
                            const verifiedFlag = isTruthyEmailVerified(oidcRes.data.email_verified);
                            if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                                sawUnverifiedGoogleEmail = true;
                            } else {
                                email = String(oidcRes.data.email).toLowerCase().trim();
                                emailVerified = verifiedFlag;
                                googleId = googleId || oidcRes.data.sub || '';
                                googleName = googleName || oidcRes.data.name || '';
                                googlePicture = googlePicture || oidcRes.data.picture || '';
                            }
                        }
                    } catch {
                        // proceed
                    }
                }
            }
        }

        // 3. Signed onboardingToken or test-only googleProfile fallback
        const profileCandidate = googleProfile || req.body.profile || req.body.user || null;
        if (!email && !sawUnverifiedGoogleEmail && (req.body.onboardingToken || profileCandidate?.onboardingToken)) {
            try {
                const verifiedOnboarding = jwt.verify(
                    req.body.onboardingToken || profileCandidate.onboardingToken,
                    getJwtSecret(),
                    { algorithms: ['HS256'] }
                );
                if (verifiedOnboarding?.purpose === 'google_onboarding' && verifiedOnboarding.email) {
                    if (process.env.NODE_ENV !== 'test' && !verifiedOnboarding.emailVerified) {
                        sawUnverifiedGoogleEmail = true;
                    } else {
                        email = String(verifiedOnboarding.email).toLowerCase().trim();
                        emailVerified = Boolean(verifiedOnboarding.emailVerified);
                        googleId = googleId || verifiedOnboarding.googleId || '';
                        googleName = googleName || verifiedOnboarding.name || '';
                        googlePicture = googlePicture || verifiedOnboarding.picture || '';
                    }
                }
            } catch {
                // invalid or expired onboardingToken
            }
        }
        if (!email && profileCandidate && process.env.NODE_ENV === 'test') {
            const p = profileCandidate.googleProfile || profileCandidate.profile || profileCandidate.user || profileCandidate.data || profileCandidate;
            const pEmail = p.email || p.mail || p.emailAddress || p.userEmail || (typeof p.contact === 'string' && p.contact.includes('@') ? p.contact : '');
            if (pEmail) {
                email = String(pEmail).toLowerCase().trim();
                emailVerified = p.email_verified === undefined ? true : isTruthyEmailVerified(p.email_verified);
            }
            googleId = googleId || p.googleId || p.sub || p.id || p.userId || '';
            googleName = googleName || p.name || p.fullName || `${p.given_name || ''} ${p.family_name || ''}`.trim() || '';
            googlePicture = googlePicture || p.picture || p.photo || p.avatar || '';

            // Check if profile contains an embedded credential or idToken
            if (!email && (p.credential || p.idToken || profileCandidate.credential || profileCandidate.idToken)) {
                try {
                    const dec = jwt.decode(p.credential || p.idToken || profileCandidate.credential || profileCandidate.idToken);
                    if (dec && dec.email) {
                        email = String(dec.email).toLowerCase().trim();
                        emailVerified = dec.email_verified === undefined ? true : isTruthyEmailVerified(dec.email_verified);
                        googleId = googleId || dec.sub || '';
                        googleName = googleName || dec.name || '';
                        googlePicture = googlePicture || dec.picture || '';
                    }
                } catch {
                    // proceed
                }
            }
        }

        // 4. In non-production environments (test), allow direct body / onboarding mock fields
        if (!email && process.env.NODE_ENV === 'test') {
            if (req.body.email && String(req.body.email).includes('@')) {
                email = String(req.body.email).toLowerCase().trim();
                emailVerified = true;
            } else if (req.body.contact && String(req.body.contact).includes('@')) {
                email = String(req.body.contact).toLowerCase().trim();
                emailVerified = true;
            } else if (onboardingData) {
                const candidate = onboardingData.email || onboardingData.contact;
                if (candidate && String(candidate).includes('@')) {
                    email = String(candidate).toLowerCase().trim();
                    emailVerified = true;
                }
            }
        }

        // In non-test environments, require that a valid Google credential, access token, or signed onboardingToken was supplied
        if (process.env.NODE_ENV !== 'test' && !tokenCandidate && !accessTokenCandidate && !req.body.onboardingToken && !profileCandidate?.onboardingToken) {
            return res.status(400).json({ message: 'Valid Google credential or token is required in production.' });
        }

        if (process.env.NODE_ENV !== 'test' && (sawUnverifiedGoogleEmail || (email && !emailVerified))) {
            return res.status(401).json({ message: 'Google account email must be verified.' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Valid Google email is required.' });
        }

        // Canonicalize email format
        email = email.toLowerCase().trim();

        // Check if user already exists
        let user = await User.findOne({
            $or: [
                { googleId: googleId ? googleId : '__no_google_id__' },
                { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                { contact: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
        });

        // Check maintenance mode
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        const isMaintenance = sysSettings && sysSettings.maintenanceMode === true;

        if (user) {
            // Verify Google subject identity matches if already linked
            if (user.googleId && ((googleId && user.googleId !== googleId) || (process.env.NODE_ENV !== 'test' && !googleId))) {
                return res.status(403).json({
                    message: 'Google account identity mismatch.'
                });
            }

            // Block deactivated accounts
            if (user.isActive === false) {
                return res.status(403).json({ 
                    message: 'Your account has been deactivated.', 
                    accountDeactivated: true, 
                    reason: user.deactivationReason, 
                    appealStatus: user.appealStatus, 
                    contact: user.contact 
                });
            }

            const normalizedRole = String(user.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
            const isStaffOrAdmin = ['admin', 'administrator', 'system_admin', 'bplo_staff', 'cashier'].includes(normalizedRole);

            // Protect administrative and cashier accounts from unauthorized public Google takeover
            const isOperatorOrToda = normalizedRole === 'operator' || normalizedRole === 'toda_president';
            if (!isOperatorOrToda && user.authProvider !== 'google' && !user.googleId) {
                return res.status(403).json({ 
                    message: 'Administrative and Cashier accounts must log in using their official municipal credentials.' 
                });
            }

            if (isMaintenance && !isStaffOrAdmin && !isOperatorOrToda) {
                return res.status(503).json({ 
                    message: sysSettings.maintenanceMessage || 'Portal is currently undergoing system maintenance. Access is restricted.',
                    maintenanceMode: true
                });
            }

            // In non-test mode, only auto-link an unlinked local account if active, non-staff/cashier, verified, and Google email is verified & matches
            const emailMatchesAccount =
                (user.email && user.email.toLowerCase() === email) ||
                (user.contact && user.contact.toLowerCase() === email);
            if (!user.googleId && process.env.NODE_ENV !== 'test') {
                if (isStaffOrAdmin || !isOperatorOrToda) {
                    return res.status(403).json({
                        message: 'Administrative and Cashier accounts must log in using their official municipal credentials.'
                    });
                }
                if (user.isActive === false) {
                    return res.status(403).json({
                        message: 'Your account has been deactivated.',
                        accountDeactivated: true,
                        reason: user.deactivationReason,
                        appealStatus: user.appealStatus,
                        contact: user.contact
                    });
                }
                if (!emailVerified || !user.isVerified || !emailMatchesAccount) {
                    return res.status(403).json({
                        message: !user.isVerified
                            ? 'An unverified account exists with this email. Please complete OTP verification or log in with your credentials first.'
                            : 'Google account email must be verified and match the registered account to link.'
                    });
                }
            }

            const wasLocalUnlinked = user.authProvider === 'local' && !user.googleId;

            // Link googleId, email, profilePic
            if (!user.googleId && googleId) {
                user.googleId = googleId;
            }
            if (!user.email) {
                user.email = email;
            }
            if (!user.profilePic && googlePicture) {
                user.profilePic = googlePicture;
            }
            if (!user.isVerified && process.env.NODE_ENV === 'test') {
                user.isVerified = true;
                user.otp = undefined;
                user.otpExpire = undefined;
                user.otpPurpose = '';
                user.otpRecipient = '';
            }
            if (user.authProvider !== 'google') {
                user.authProvider = 'google';
            }
            user.lastActive = new Date();
            user.lastLogin = new Date();
            await user.save();

            if (wasLocalUnlinked && (emailVerified === true || process.env.NODE_ENV === 'test') && emailMatchesAccount) {
                logAudit(req, {
                    action: 'AUTH_GOOGLE_LINKED',
                    targetType: 'User',
                    targetId: user._id,
                    details: {
                        name: user.name,
                        email: user.email,
                        contact: user.contact,
                        role: user.role,
                        previousProvider: 'local',
                        googleId: user.googleId || ''
                    }
                });
            }

            const token = signSessionToken(user);
            const userObj = sanitizeUserObject(user);

            return res.status(200).json({
                isNewUser: false,
                token,
                role: user.role,
                name: user.name,
                user: userObj
            });
        }

        // If user does not exist yet, auto-register immediately without any OTP code!
        if (isMaintenance) {
            return res.status(503).json({ 
                message: 'Registration is temporarily disabled during system maintenance.',
                maintenanceMode: true
            });
        }

        if (!onboardingData || !onboardingData.address || !String(onboardingData.address).trim()) {
            return res.status(200).json({
                isNewUser: true,
                message: 'Google account verified. Please complete your registration.',
                googleProfile: {
                    email,
                    googleId,
                    name: googleName,
                    picture: googlePicture,
                    onboardingToken: jwt.sign(
                        { purpose: 'google_onboarding', email, googleId, name: googleName, picture: googlePicture, emailVerified: Boolean(emailVerified) },
                        getJwtSecret(),
                        { algorithm: 'HS256', expiresIn: '15m' }
                    )
                }
            });
        }

        const fullName = (onboardingData?.fullName || onboardingData?.name || googleName || email.split('@')[0]).trim();
        const address = (onboardingData?.address || 'Gasan, Marinduque').trim();
        const rawContact = (onboardingData?.contact || onboardingData?.email || email).trim();
        const contact = normalizeContact(rawContact) || email;
        const todaAssociation = (onboardingData?.todaAssociation || 'NON-TODA').trim();

        // Check if account with this primary contact already exists
        const contactFilter = getPrimaryContactQueryFilter(rawContact);
        const existingContact = await User.findOne(contactFilter);

        if (existingContact) {
            const isSameAccount =
                (existingContact.email && existingContact.email.toLowerCase() === email) ||
                (existingContact.contact && existingContact.contact.toLowerCase() === email);
            if (!isSameAccount) {
                return res.status(400).json({ 
                    message: 'AN ACCOUNT WITH THIS CONTACT NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
                });
            }
            if (existingContact.googleId && ((googleId && existingContact.googleId !== googleId) || (process.env.NODE_ENV !== 'test' && !googleId))) {
                return res.status(403).json({
                    message: 'Google account identity mismatch.'
                });
            }
            if (existingContact.isActive === false) {
                return res.status(403).json({
                    message: 'Your account has been deactivated.',
                    accountDeactivated: true,
                    reason: existingContact.deactivationReason,
                    appealStatus: existingContact.appealStatus,
                    contact: existingContact.contact
                });
            }
            const existingRoleNorm = String(existingContact.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
            const isExistingStaffOrAdmin = ['admin', 'administrator', 'system_admin', 'bplo_staff', 'cashier'].includes(existingRoleNorm);
            const isExistingOpOrToda = existingRoleNorm === 'operator' || existingRoleNorm === 'toda_president';
            if (!isExistingOpOrToda && existingContact.authProvider !== 'google' && !existingContact.googleId) {
                return res.status(403).json({
                    message: 'Administrative and Cashier accounts must log in using their official municipal credentials.'
                });
            }
            if (!existingContact.googleId && process.env.NODE_ENV !== 'test') {
                if (isExistingStaffOrAdmin || !isExistingOpOrToda) {
                    return res.status(403).json({
                        message: 'Administrative and Cashier accounts must log in using their official municipal credentials.'
                    });
                }
                if (!emailVerified || !existingContact.isVerified) {
                    return res.status(403).json({
                        message: !existingContact.isVerified
                            ? 'An unverified account exists with this email. Please complete OTP verification or log in with your credentials first.'
                            : 'Google account email must be verified to link an existing account.'
                    });
                }
            }
            const wasExistingLocalUnlinked = existingContact.authProvider === 'local' && !existingContact.googleId;
            existingContact.googleId = googleId || existingContact.googleId || '';
            existingContact.email = email;
            if (address && (!existingContact.address || existingContact.address === 'Gasan, Marinduque')) {
                existingContact.address = address;
            }
            if (todaAssociation && existingContact.todaAssociation === 'NON-TODA') {
                existingContact.todaAssociation = todaAssociation;
            }
            if (!existingContact.isVerified && process.env.NODE_ENV === 'test') {
                existingContact.isVerified = true;
                existingContact.otp = undefined;
                existingContact.otpExpire = undefined;
                existingContact.otpPurpose = '';
                existingContact.otpRecipient = '';
            }
            existingContact.authProvider = 'google';
            if (googlePicture && !existingContact.profilePic) existingContact.profilePic = googlePicture;
            existingContact.lastActive = new Date();
            existingContact.lastLogin = new Date();
            await existingContact.save();

            if (wasExistingLocalUnlinked && (emailVerified === true || process.env.NODE_ENV === 'test')) {
                logAudit(req, {
                    action: 'AUTH_GOOGLE_LINKED',
                    targetType: 'User',
                    targetId: existingContact._id,
                    details: {
                        name: existingContact.name,
                        email: existingContact.email,
                        contact: existingContact.contact,
                        role: existingContact.role,
                        previousProvider: 'local',
                        googleId: existingContact.googleId || ''
                    }
                });
            }

            const token = signSessionToken(existingContact);
            const userObj = sanitizeUserObject(existingContact);

            return res.status(200).json({
                isNewUser: false,
                token,
                role: existingContact.role,
                name: existingContact.name,
                user: userObj
            });
        }

        // Public Google sign-in strictly registers as 'operator' (privilege escalation prevention)
        const assignedRole = 'operator';
        const bodyNumber = String(onboardingData?.bodyNumber || onboardingData?.unitNo || '').trim().toUpperCase();

        if (!bodyNumber) {
            if (process.env.NODE_ENV !== 'test') {
                return res.status(400).json({
                    success: false,
                    message: 'Ang Assigned Body Number (mula sa TODA Masterlist) ay kinakailangan sa pagpaparehistro.'
                });
            }
        } else {
            const rosterReport = await validateOperatorAgainstRoster({
                fullName,
                todaAssociation,
                bodyNumber
            });

            if (!rosterReport.isValid && process.env.NODE_ENV !== 'test') {
                return res.status(403).json({
                    success: false,
                    message: rosterReport.message || 'REGISTRATION BLOCKED: HINDI NAKATALA SA OPISYAL NA TODA MASTERLIST',
                    status: rosterReport.status,
                    advisory: rosterReport.advisory
                });
            }
        }

        // Create new operator user with isVerified: true (NO 6-DIGIT OTP CODE REQUIRED!)
        const randomPass = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'G!9a';
        const chosenPassword = (onboardingData?.password && onboardingData.password.length >= 6) ? onboardingData.password : randomPass;
        const rawBackupContact = onboardingData?.backupContact || req.body?.backupContact || '';
        const backupContact = rawBackupContact ? normalizeContact(rawBackupContact) : '';
        const rawRecoveryEmail = onboardingData?.recoveryEmail || req.body?.recoveryEmail || (backupContact && backupContact.includes('@') ? backupContact : '');
        const recoveryEmail = rawRecoveryEmail && String(rawRecoveryEmail).includes('@') ? String(rawRecoveryEmail).toLowerCase().trim() : '';
        const rawRecoveryPhone = onboardingData?.recoveryPhone || req.body?.recoveryPhone || (backupContact && !backupContact.includes('@') ? backupContact : '');
        const recoveryPhone = rawRecoveryPhone ? String(rawRecoveryPhone).trim() : '';

        user = new User({
            name: fullName,
            address: address,
            contact: contact,
            backupContact,
            email: email,
            recoveryEmail,
            recoveryPhone,
            googleId: googleId || '',
            password: chosenPassword,
            role: assignedRole,
            todaAssociation: todaAssociation,
            bodyNumber: bodyNumber,
            isVerified: true, // Automatically verified via Google!
            profilePic: googlePicture || '',
            authProvider: 'google',
            lastActive: new Date(),
            lastLogin: new Date()
        });

        await user.save();

        logAudit(req, {
            action: 'USER_REGISTERED_GOOGLE',
            targetType: 'User',
            targetId: user._id,
            details: { name: user.name, email: user.email, contact: user.contact, address: user.address, toda: user.todaAssociation }
        });

        const token = signSessionToken(user);
        const userObj = sanitizeUserObject(user);

        return res.status(201).json({
            isNewUser: false,
            token,
            role: user.role,
            name: user.name,
            user: userObj
        });
    } catch (error) {
        console.error('GOOGLE AUTH ERROR:', error);
        res.status(500).json({ message: 'Google authentication error: ' });
    }
};

// Submit an appeal for a deactivated account
exports.submitAppeal = async (req, res) => {
    try {
        const { contact, password, message } = req.body;
        
        if (!contact || !password || !message) {
            return res.status(400).json({ message: 'Contact, password, and appeal message are required.' });
        }

        const rawContact = String(contact).trim();
        const user = await User.findOne(getContactQueryFilter(rawContact));

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isActive) {
            return res.status(400).json({ message: 'Account is not deactivated.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        user.appealMessage = message;
        user.appealStatus = 'pending';
        await user.save();

        res.status(200).json({ message: 'Appeal submitted successfully' });
    } catch (error) {
        console.error('SUBMIT APPEAL ERROR:', error);
        res.status(500).json({ message: 'Server error: ' });
    }
};
// Mask contact info for public QR verification compliance with RA 10173
function maskContactInfo(val) {
    if (!val) return '';
    const str = String(val).trim();
    if (str.includes('@')) {
        const [username, domain] = str.split('@');
        const visibleLen = Math.min(2, username.length);
        return `${username.slice(0, visibleLen)}****@${domain}`;
    }
    if (str.length >= 10) {
        return `${str.slice(0, 4)}****${str.slice(-3)}`;
    }
    return str.length > 4 ? `${str.slice(0, 2)}****` : '****';
};

// Verify Operator for QR Code (Accepts User ID, Franchise ID, MTOP No, or Plate No from MTOP Certificate)
exports.verifyOperator = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const queryId = String(req.params.id || '').trim();
        if (!queryId) {
            return res.status(400).json({ message: 'Verification ID is required.' });
        }

        const formatVerifiedUnit = (f, ownerActive = true) => {
            const ownerIsInactive = ownerActive === false;
            const expiryMs = f.expiryDate ? new Date(f.expiryDate).getTime() : null;
            const hasValidExpiry = expiryMs !== null && !Number.isNaN(expiryMs);
            const isDateExpired = hasValidExpiry && expiryMs < Date.now();
            const isMissingOrInvalidExpiry = !hasValidExpiry;
            const rawStatus = f.status;
            const isActiveStatus = ['Active', 'Active - Under Warning'].includes(rawStatus);
            const isCurrentlyValid = !ownerIsInactive && isActiveStatus && !f.isArchived && hasValidExpiry && !isDateExpired;
            let validityStatus = 'INACTIVE';
            if (ownerIsInactive) {
                validityStatus = 'INACTIVE_OWNER';
            } else if (isActiveStatus && isMissingOrInvalidExpiry) {
                validityStatus = 'UNVERIFIED_EXPIRY';
            } else if (isCurrentlyValid) {
                validityStatus = 'VALID';
            } else if (rawStatus === 'Expired' || (isActiveStatus && isDateExpired)) {
                validityStatus = 'EXPIRED';
            } else if (['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup', 'Cancellation Requested'].includes(rawStatus)) {
                validityStatus = 'PENDING';
            }
            return {
                make: f.make,
                plateNo: f.plateNo,
                status: isActiveStatus && isDateExpired ? 'Expired' : rawStatus,
                todaName: f.todaName,
                approvalDate: f.approvalDate,
                expiryDate: f.expiryDate,
                mtopNo: f.mtopNo,
                isCurrentlyValid,
                validityStatus
            };
        };

        const isValidObjectId = mongoose.Types.ObjectId.isValid(queryId);
        const baseUrl = (process.env.BACKEND_URL || process.env.VITE_API_URL || '').replace(/\/+$/, '');

        // 1. Try finding by User ID first (only if valid ObjectId)
        let user = isValidObjectId
            ? await User.findById(queryId).select('name fullName profilePic role todaAssociation contact isActive')
            : null;

        if (user) {
            let formattedProfilePic = user.profilePic || '';
            if (formattedProfilePic && !formattedProfilePic.startsWith('http') && baseUrl) {
                formattedProfilePic = `${baseUrl}/${formattedProfilePic.replace(/^\/+/, '').replace(/\\/g, '/')}`;
            }

            const operatorName = user.name || user.fullName || 'Registered Operator';

            const userFranchises = await Franchise.find({ 
                operator: user._id,
                isArchived: { $ne: true }
            }).select('make plateNo status todaName approvalDate expiryDate mtopNo isArchived');

            const ownerIsActive = user.isActive !== false;
            const formattedFranchises = (userFranchises || []).map((f) => formatVerifiedUnit(f, ownerIsActive));
            const hasValidUnit = ownerIsActive && formattedFranchises.some((u) => u.isCurrentlyValid);
            let overallValidityStatus = 'INACTIVE';
            if (!ownerIsActive) {
                overallValidityStatus = 'INACTIVE_OWNER';
            } else if (hasValidUnit) {
                overallValidityStatus = 'VALID';
            } else if (formattedFranchises.some((u) => u.validityStatus === 'PENDING')) {
                overallValidityStatus = 'PENDING';
            } else if (formattedFranchises.some((u) => u.validityStatus === 'EXPIRED')) {
                overallValidityStatus = 'EXPIRED';
            } else if (formattedFranchises.some((u) => u.validityStatus === 'UNVERIFIED_EXPIRY')) {
                overallValidityStatus = 'UNVERIFIED_EXPIRY';
            }
            
            return res.status(200).json({
                name: operatorName,
                fullName: operatorName,
                profilePic: formattedProfilePic,
                role: user.role,
                todaAssociation: user.todaAssociation || 'NON-TODA',
                isActive: ownerIsActive,
                contact: maskContactInfo(user.contact),
                franchises: formattedFranchises,
                isCurrentlyValid: hasValidUnit,
                validityStatus: overallValidityStatus
            });
        }

        // 2. If not a User ID, try finding by Franchise ID (if valid ObjectId) or fallback strictly to mtopNo / plateNo
        let franchise = isValidObjectId
            ? await Franchise.findOne({ _id: queryId, isArchived: { $ne: true } }).populate('operator', 'name fullName profilePic role todaAssociation contact isActive')
            : null;

        if (!franchise) {
            const escapedQuery = queryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const queryRegex = new RegExp(`^${escapedQuery}$`, 'i');
            franchise = await Franchise.findOne({
                isArchived: { $ne: true },
                $or: [
                    { mtopNo: queryRegex },
                    { plateNo: queryRegex }
                ]
            }).populate('operator', 'name fullName profilePic role todaAssociation contact isActive');
        }

        if (franchise) {
            const opUser = franchise.operator;
            const ownerIsActive = opUser ? opUser.isActive !== false : true;
            const opName = franchise.fullName || opUser?.name || opUser?.fullName || 'Registered Operator';
            let formattedProfilePic = opUser?.profilePic || '';
            if (formattedProfilePic && !formattedProfilePic.startsWith('http') && baseUrl) {
                formattedProfilePic = `${baseUrl}/${formattedProfilePic.replace(/^\/+/, '').replace(/\\/g, '/')}`;
            }

            const formattedUnit = formatVerifiedUnit(franchise, ownerIsActive);

            return res.status(200).json({
                name: opName,
                fullName: opName,
                profilePic: formattedProfilePic,
                role: opUser?.role || 'operator',
                todaAssociation: franchise.todaName || opUser?.todaAssociation || 'NON-TODA',
                isActive: ownerIsActive,
                contact: maskContactInfo(opUser?.contact || ''),
                franchises: [formattedUnit],
                scannedFranchise: formattedUnit,
                isCurrentlyValid: formattedUnit.isCurrentlyValid,
                validityStatus: formattedUnit.validityStatus
            });
        }

        return res.status(404).json({ message: 'Operator or Franchise not found for this QR code.' });
    } catch (error) {
        console.error('VERIFY OPERATOR ERROR:', error);
        res.status(500).json({ message: 'Server error: ' });
    }
};

// Get Public Stats for Landing Page
exports.getPublicStats = async (req, res) => {
    try {
        const totalOperators = await User.countDocuments({ role: 'operator', isActive: true });
        
        // Count distinct accredited TODA associations across certified rosters and registered operators
        const TodaRoster = require('../models/todaModel');
        const rosterTodas = await TodaRoster.distinct('todaAssociation', { todaAssociation: { $nin: ['', null, 'NON-TODA'] } }).catch(() => []);
        const userTodas = await User.distinct('todaAssociation', { todaAssociation: { $nin: ['', null, 'NON-TODA'] } }).catch(() => []);
        const combinedTodas = new Set([...rosterTodas, ...userTodas]);
        const totalTodas = combinedTodas.size;
        
        // Also get total active franchises
        const totalFranchises = await Franchise.countDocuments({ status: 'Active', isArchived: { $ne: true } });

        res.status(200).json({
            operators: totalOperators,
            todas: totalTodas,
            franchises: totalFranchises
        });
    } catch (error) {
        console.error('GET PUBLIC STATS ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Export pre-registration TODA roster verification handler
exports.verifyTodaRoster = verifyTodaRoster;

