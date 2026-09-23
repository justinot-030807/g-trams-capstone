const User = require('../models/userModel'); 
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail'); 
const axios = require('axios');
const crypto = require('crypto');
const { logAudit } = require('../utils/auditLogger');

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

// Build MongoDB query matching email or various phone number formats (09..., +639..., dashes)
const getContactQueryFilter = (contactStr) => {
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

        const { name, fullName, address, contact, password, role, todaAssociation } = req.body;
        const resolvedName = String(name || fullName || '').trim().replace(/\s+/g, ' ');
        const rawContact = String(contact || '').trim();
        const normalizedContact = normalizeContact(rawContact);
        const normalizedAddress = String(address || '').trim();
        const normalizedToda = String(todaAssociation || 'NON-TODA').trim();

        if (!resolvedName || resolvedName.length < 2) {
            return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
        }

        if (!normalizedContact) {
            return res.status(400).json({ message: 'Contact email or phone number is required.' });
        }

        if (!normalizedAddress) {
            return res.status(400).json({ message: 'Address is required.' });
        }

        // Determine allowable role
        let assignedRole = 'operator';
        const requestedRole = String(role || '').toLowerCase().trim().replace(/_/g, ' ');
        if (requestedRole === 'toda president' || requestedRole === 'toda_president') {
            assignedRole = 'toda president';
            if (!normalizedToda || normalizedToda === 'NON-TODA') {
                return res.status(400).json({ message: 'TODA President must select a valid TODA Association.' });
            }
        }
        
        // Case-insensitive check for existing user by contact or email
        const isEmail = normalizedContact.includes('@');
        let user = await User.findOne(getContactQueryFilter(rawContact));

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ 
                    message: 'AN ACCOUNT WITH THIS EMAIL / PHONE NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
                });
            }
            // Allow unverified users to re-register with fresh credentials and OTP
            await User.deleteOne({ _id: user._id }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user = new User({
            name: resolvedName,
            address: normalizedAddress,
            contact: normalizedContact,
            email: isEmail ? normalizedContact : (req.body.email && String(req.body.email).includes('@') ? String(req.body.email).toLowerCase().trim() : ''),
            password,
            role: assignedRole,
            todaAssociation: normalizedToda,
            isVerified: false,
            otp,
            otpExpire: Date.now() + 10 * 60 * 1000 
        });
        
        await user.save();

        if (process.env.NODE_ENV !== 'test') {
            try {
                if (isEmail) {
                    await sendEmail({ 
                        email: normalizedContact, 
                        subject: 'G-TRAMS: Account Verification OTP', 
                        message: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.` 
                    });
                } else {
                    await axios.post('https://api.semaphore.co/api/v4/messages', { 
                        apikey: process.env.SEMAPHORE_API_KEY, 
                        number: normalizedContact, 
                        message: `G-TRAMS: Your verification code is ${otp}. Do not share this with anyone.` 
                    }, { timeout: 5000 });
                }
            } catch (sendErr) {
                console.error("OTP Delivery Warning (email/SMS):", sendErr.message);
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV/TEST OTP] Registration OTP for ${normalizedContact}: ${otp}`);
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
        const rawContact = String(contact || '').trim();
        const normalizedOtp = String(otp || '').trim();

        if (!rawContact || !normalizedOtp) {
            return res.status(400).json({ message: 'Contact and OTP code are required.' });
        }

        const contactFilter = getContactQueryFilter(rawContact);
        const user = await User.findOne({ 
            ...contactFilter,
            otp: normalizedOtp, 
            otpExpire: { $gt: Date.now() } 
        });
        
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        const isEmail = rawContact.includes('@');
        if (!user.email && isEmail) {
            user.email = rawContact.toLowerCase();
        }
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'gtrams_jwt_default_secret', { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;
        
        res.status(200).json({ 
            message: 'Account verified successfully.',
            token,
            role: user.role,
            name: user.name,
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

        const user = await User.findOne(getContactQueryFilter(rawContact));
        
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
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            if (user.authProvider === 'google' || user.googleId) {
                return res.status(400).json({ 
                    message: 'Ang account na ito ay naka-link sa Google. Pindutin lamang ang "Continue with Google" sa ibaba para makapasok, o gamitin ang "Forgot Password" kung nais mag-set ng sariling password.',
                    isGoogleAccount: true
                });
            }
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Block non-admin users during maintenance mode
        const normalizedRole = String(user.role || '').toLowerCase().trim().replace(/_/g, ' ');
        const isAdminUser = normalizedRole === 'admin' || normalizedRole === 'administrator';

        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        if (sysSettings && sysSettings.maintenanceMode === true && !isAdminUser) {
            return res.status(503).json({ 
                message: sysSettings.maintenanceMessage || 'Portal is currently undergoing system maintenance. Non-admin access is restricted. Please try again later.',
                maintenanceMode: true
            });
        }
        
        user.lastActive = new Date();
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;
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
            { $project: { password: 0 } } // Exclude password field
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

        // Robust lookup across contact, email, and phone variants
        const user = await User.findOne(getContactQueryFilter(rawContact));
        if (!user) return res.status(404).json({ message: 'Contact is not registered.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        try {
            if (normalizedContact.includes('@')) {
                // Send OTP via email
                await sendEmail({ 
                    email: normalizedContact, 
                    subject: 'G-TRAMS: Account Verification OTP', 
                    message: `Your OTP for G-TRAMS password reset is: ${otp}\n\nThis code is valid for 10 minutes only.` 
                });
                return res.status(200).json({ message: 'OTP sent successfully to your email.' });
            } else {
                // Send OTP via SMS
                await axios.post('https://api.semaphore.co/api/v4/messages', { 
                    apikey: process.env.SEMAPHORE_API_KEY, 
                    number: normalizedContact, 
                    message: `G-TRAMS: Your password reset verification code is ${otp}. Do not share this with anyone.` 
                }, { timeout: 5000 });
                return res.status(200).json({ message: 'OTP sent successfully via SMS.' });
            }
        } catch (err) {
            console.error("FORGOT PASSWORD OTP SEND ERROR:", err?.response?.data || err.message);
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();
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
        const rawContact = String(contact || '').trim();
        const normalizedOtp = String(otp || '').trim();

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const contactFilter = getContactQueryFilter(rawContact);
        const user = await User.findOne({
            ...contactFilter,
            otp: normalizedOtp,
            otpExpire: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        logAudit(req, {
            action: 'PASSWORD_RESET',
            targetType: 'User',
            targetId: user._id,
            details: { name: user.name, contact: user.contact, role: user.role }
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

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from your current password.' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password.' });
        
        user.password = newPassword;
        await user.save();

        logAudit(req, {
            action: 'PASSWORD_CHANGED',
            targetType: 'User',
            targetId: user._id,
            details: { name: user.name, role: user.role }
        });

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify admin password
exports.verifyAdminPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id); 
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect Admin Password' });
        
        res.status(200).json({ message: 'Password Verified' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).select('-password');
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        logAudit(req, {
            action: 'USER_UPDATED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: updatedUser.name, role: updatedUser.role, contact: updatedUser.contact }
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

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
        
        let updateData = {};
        if (name !== undefined) updateData.name = name;
        if (address !== undefined) updateData.address = address;
        if (contact !== undefined) updateData.contact = contact;
        if (todaAssociation !== undefined) updateData.todaAssociation = todaAssociation;
        if (language !== undefined) updateData.language = language;
        if (theme !== undefined) updateData.theme = theme;
        
        if (req.file) {
            updateData.profilePic = req.file.path; 
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { returnDocument: 'after' }
        ).select('-password');

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

// Toggle account status (activate / deactivate)
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot deactivate an administrator account.' });
        }

        const newStatus = user.isActive === false ? true : false; 

        const updateData = { isActive: newStatus };
        if (newStatus === false) {
            updateData.deactivationReason = req.body.reason || 'No reason provided';
        } else {
            updateData.deactivationReason = '';
            updateData.appealMessage = '';
            updateData.appealStatus = 'none';
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        logAudit(req, {
            action: updatedUser.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: updatedUser.name, role: updatedUser.role, contact: updatedUser.contact }
        });

        res.status(200).json({ 
            message: `User account successfully ${updatedUser.isActive ? 'activated' : 'deactivated'}.`,
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred', error: 'An internal server error occurred' });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
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

        const tokenCandidate = idToken || req.body.credential || req.body.token;
        const accessTokenCandidate = accessToken || req.body.accessToken || req.body.access_token;

        // 1. If tokenCandidate is provided, determine if it is a JWT (ID token) or access token
        if (tokenCandidate) {
            const isLikelyJwt = typeof tokenCandidate === 'string' && tokenCandidate.split('.').length >= 2;

            if (isLikelyJwt) {
                // Verify with Google's tokeninfo API for id_token
                try {
                    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenCandidate}`, { timeout: 4000 });
                    if (googleRes.data && googleRes.data.email) {
                        email = String(googleRes.data.email).toLowerCase().trim();
                        googleId = googleRes.data.sub || googleRes.data.user_id || '';
                        googleName = googleRes.data.name || '';
                        googlePicture = googleRes.data.picture || '';
                    }
                } catch (err) {
                    console.warn('Google tokeninfo id_token verification note:', err.message);
                }

                // Robust fallback: decode JWT directly without outbound request
                if (!email) {
                    try {
                        const decoded = jwt.decode(tokenCandidate);
                        if (decoded && (decoded.email || decoded.sub || decoded.email_verified)) {
                            if (decoded.email) email = String(decoded.email).toLowerCase().trim();
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
                    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenCandidate}`, { timeout: 4000 });
                    if (googleRes.data && googleRes.data.email) {
                        email = String(googleRes.data.email).toLowerCase().trim();
                        googleId = googleId || googleRes.data.sub || googleRes.data.user_id || '';
                    }
                } catch (err) {
                    console.warn('Google tokeninfo access_token note:', err.message);
                }
            }
        }

        // 2. If access token is provided (or tokenCandidate was an access token) and email not yet resolved
        const rawAccessToken = accessTokenCandidate || (!email && tokenCandidate && !tokenCandidate.includes('.') ? tokenCandidate : null);
        if (!email && rawAccessToken) {
            // Check Google tokeninfo for access_token
            try {
                const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${rawAccessToken}`, { timeout: 4000 });
                if (tokenInfoRes.data && tokenInfoRes.data.email) {
                    email = String(tokenInfoRes.data.email).toLowerCase().trim();
                    googleId = googleId || tokenInfoRes.data.sub || '';
                }
            } catch {
                // proceed to userinfo endpoints
            }

            if (!email) {
                try {
                    const userinfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${rawAccessToken}` },
                        timeout: 4000
                    });
                    if (userinfoRes.data && userinfoRes.data.email) {
                        email = String(userinfoRes.data.email).toLowerCase().trim();
                        googleId = googleId || userinfoRes.data.sub || '';
                        googleName = googleName || userinfoRes.data.name || '';
                        googlePicture = googlePicture || userinfoRes.data.picture || '';
                    }
                } catch (err) {
                    try {
                        const oidcRes = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', {
                            headers: { Authorization: `Bearer ${rawAccessToken}` },
                            timeout: 4000
                        });
                        if (oidcRes.data && oidcRes.data.email) {
                            email = String(oidcRes.data.email).toLowerCase().trim();
                            googleId = googleId || oidcRes.data.sub || '';
                            googleName = googleName || oidcRes.data.name || '';
                            googlePicture = googlePicture || oidcRes.data.picture || '';
                        }
                    } catch {
                        // proceed
                    }
                }
            }
        }

        // 3. Client-provided googleProfile fallback (handles direct or nested wrappers)
        const profileCandidate = googleProfile || req.body.profile || req.body.user || null;
        if (!email && profileCandidate) {
            const p = profileCandidate.googleProfile || profileCandidate.profile || profileCandidate.user || profileCandidate.data || profileCandidate;
            const pEmail = p.email || p.mail || p.emailAddress || p.userEmail || (typeof p.contact === 'string' && p.contact.includes('@') ? p.contact : '');
            if (pEmail) {
                email = String(pEmail).toLowerCase().trim();
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
                        googleId = googleId || dec.sub || '';
                        googleName = googleName || dec.name || '';
                        googlePicture = googlePicture || dec.picture || '';
                    }
                } catch {
                    // proceed
                }
            }
        }

        // 4. Direct email field in body
        if (!email && req.body.email && String(req.body.email).includes('@')) {
            email = String(req.body.email).toLowerCase().trim();
        }

        // 5. Direct contact field in body if it's an email
        if (!email && req.body.contact && String(req.body.contact).includes('@')) {
            email = String(req.body.contact).toLowerCase().trim();
        }

        // 6. onboardingData email or contact
        if (!email && onboardingData) {
            const candidate = onboardingData.email || onboardingData.contact;
            if (candidate && String(candidate).includes('@')) {
                email = String(candidate).toLowerCase().trim();
            }
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

            const normalizedRole = String(user.role || '').toLowerCase().trim().replace(/_/g, ' ');
            const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';

            if (isMaintenance && !isAdmin) {
                return res.status(503).json({ 
                    message: sysSettings.maintenanceMessage || 'Portal is currently undergoing system maintenance. Access is restricted.',
                    maintenanceMode: true
                });
            }

            // Link googleId, email, profilePic, and auto-verify immediately!
            let shouldSave = false;
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                shouldSave = true;
            }
            if (!user.email) {
                user.email = email;
                shouldSave = true;
            }
            if (!user.profilePic && googlePicture) {
                user.profilePic = googlePicture;
                shouldSave = true;
            }
            // Auto-verify since Google confirms email identity
            if (!user.isVerified) {
                user.isVerified = true;
                user.otp = undefined;
                user.otpExpire = undefined;
                shouldSave = true;
            }
            if (user.authProvider !== 'google') {
                user.authProvider = 'google';
            }
            user.lastActive = new Date();
            user.lastLogin = new Date();
            await user.save();

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'gtrams_jwt_default_secret', { expiresIn: '1d' });
            const userObj = user.toObject();
            delete userObj.password;

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
                googleProfile: { email, googleId, name: googleName, picture: googlePicture }
            });
        }

        const fullName = (onboardingData?.fullName || onboardingData?.name || googleName || email.split('@')[0]).trim();
        const address = (onboardingData?.address || 'Gasan, Marinduque').trim();
        const rawContact = (onboardingData?.contact || onboardingData?.email || email).trim();
        const contact = normalizeContact(rawContact) || email;
        const todaAssociation = (onboardingData?.todaAssociation || 'NON-TODA').trim();

        // Check if account with this contact already exists
        const contactFilter = getContactQueryFilter(rawContact);
        const existingContact = await User.findOne(contactFilter);

        if (existingContact) {
            const isSameAccount = existingContact.email === email || existingContact.contact.toLowerCase() === email;
            if (existingContact.isVerified && !isSameAccount) {
                return res.status(400).json({ 
                    message: 'AN ACCOUNT WITH THIS CONTACT NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
                });
            }
            existingContact.googleId = googleId || existingContact.googleId || '';
            existingContact.email = email;
            if (address && (!existingContact.address || existingContact.address === 'Gasan, Marinduque')) {
                existingContact.address = address;
            }
            if (todaAssociation && existingContact.todaAssociation === 'NON-TODA') {
                existingContact.todaAssociation = todaAssociation;
            }
            existingContact.isVerified = true;
            existingContact.otp = undefined;
            existingContact.otpExpire = undefined;
            existingContact.authProvider = 'google';
            if (googlePicture && !existingContact.profilePic) existingContact.profilePic = googlePicture;
            existingContact.lastActive = new Date();
            existingContact.lastLogin = new Date();
            await existingContact.save();

            const token = jwt.sign({ id: existingContact._id, role: existingContact.role }, process.env.JWT_SECRET || 'gtrams_jwt_default_secret', { expiresIn: '1d' });
            const userObj = existingContact.toObject();
            delete userObj.password;

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

        // Create new operator user with isVerified: true (NO 6-DIGIT OTP CODE REQUIRED!)
        const randomPass = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'G!9a';
        const chosenPassword = (onboardingData?.password && onboardingData.password.length >= 6) ? onboardingData.password : randomPass;
        user = new User({
            name: fullName,
            address: address,
            contact: contact,
            email: email,
            googleId: googleId || '',
            password: chosenPassword,
            role: assignedRole,
            todaAssociation: todaAssociation,
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

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'gtrams_jwt_default_secret', { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;

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
// Verify Operator for QR Code
exports.verifyOperator = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name fullName profilePic role todaAssociation contact isActive');
        if (!user) return res.status(404).json({ message: 'Operator not found' });
        
        let formattedProfilePic = user.profilePic;
        if (formattedProfilePic && !formattedProfilePic.startsWith('http')) {
            formattedProfilePic = `${process.env.VITE_API_URL || 'http://localhost:3000'}/${formattedProfilePic.replace(/\\/g, '/')}`;
        }

        const operatorName = user.name || user.fullName || 'Registered Operator';

        const franchises = await Franchise.find({ 
            $or: [
                { operator: user._id },
                { fullName: operatorName }
            ],
            isArchived: { $ne: true }
        }).select('make plateNo motorNo status todaName');
        
        res.status(200).json({
            name: operatorName,
            fullName: operatorName,
            profilePic: formattedProfilePic,
            role: user.role,
            todaAssociation: user.todaAssociation || 'NON-TODA',
            isActive: user.isActive,
            contact: user.contact,
            franchises: franchises || []
        });
    } catch (error) {
        console.error('VERIFY OPERATOR ERROR:', error);
        res.status(500).json({ message: 'Server error: ' });
    }
};

// Get Public Stats for Landing Page
exports.getPublicStats = async (req, res) => {
    try {
        const totalOperators = await User.countDocuments({ role: 'operator', isActive: true });
        
        // Count distinct TODA associations
        const distinctTodas = await User.distinct('todaAssociation', { todaAssociation: { $nin: ['', 'NON-TODA'] } });
        const totalTodas = distinctTodas.length;
        
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

