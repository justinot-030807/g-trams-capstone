const mongoose = require('mongoose');
const User = require('../models/userModel'); 
const Franchise = require('../models/franchiseModel');
const SystemSettings = require('../models/systemSettingsModel');
const TodaRoster = require('../models/todaModel');
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail'); 
const sendSms = require('../utils/sendSms');
const axios = require('axios');
const crypto = require('crypto');
const { logAudit } = require('../utils/auditLogger');
const { validateOperatorAgainstRoster, normalizeBodyNumber } = require('../utils/rosterValidator');
const { isNameMatch } = require('../utils/nameMatcher');
const { claimRosterRow, findRosterSlot, releaseRosterClaims, rosterAssociation, rosterBodyKey, rosterClaimKey, rosterConflict, rosterOwners } = require('../utils/rosterClaims');
const { withRosterMutation } = require('../utils/rosterMutation');
const { verifyTodaRoster, rosterIneligible } = require('./todaController');
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

const hasLocalCredential = (user) => user.hasLocalPassword !== false &&
    (user.authProvider !== 'google' || Boolean(user.passwordChangedAt || user.localPasswordConfirmedAt));

const verifiedPrimaryContact = (user) => (
    user.isContactVerified === true || (user.isContactVerified === undefined && user.isVerified === true)
        ? normalizeContact(user.contact)
        : ''
);

const verifiedPrimaryContacts = (user) => [
    verifiedPrimaryContact(user),
    user.isEmailVerified === true ? normalizeContact(user.email) : ''
].filter(Boolean);

const verifiedRecoveryContacts = (user) => [
    user.isRecoveryEmailVerified === true ? normalizeContact(user.recoveryEmail) : '',
    user.isRecoveryPhoneVerified === true ? normalizeContact(user.recoveryPhone) : ''
].filter(Boolean);

const contactVersion = (user) => user.contactSecurityVersion || 0;
const contactVersionFilter = (user) => ({
    contactSecurityVersion: contactVersion(user) || { $in: [0, null] }
});
const clearContactOtp = { otpAttempts: 0, otpPurpose: '', otpRecipient: '' };
const unsetContactOtp = { otp: 1, otpExpire: 1 };

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

    // Expose whether user has a local password configured (defaults to true for legacy local users)
    obj.hasLocalPassword = hasLocalCredential(obj);
    delete obj.contactSecurityVersion;
    delete obj.localPasswordConfirmedAt;

    // Hydrate legacy backupContact into recoveryEmail / recoveryPhone when both typed fields are empty
    const cleanRecEmail = String(obj.recoveryEmail || '').trim();
    const cleanRecPhone = String(obj.recoveryPhone || '').trim();
    const cleanBackup = String(obj.backupContact || '').trim();
    if (!cleanRecEmail && !cleanRecPhone && cleanBackup) {
        if (cleanBackup.includes('@')) {
            obj.recoveryEmail = cleanBackup.toLowerCase();
        } else {
            obj.recoveryPhone = cleanBackup;
        }
    }

    return obj;
};

const isValidEmailFormat = (val) => {
    const str = String(val || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
};

const isValidPhMobileFormat = (val) => {
    const clean = String(val || '').trim().replace(/[\s\-()]/g, '');
    return /^(09\d{9}|\+639\d{9}|639\d{9})$/.test(clean);
};

// Unified OTP dispatcher with accurate delivery failure detection (M1)
const dispatchOtpMessage = async ({ destination, subject, emailMessage, smsMessage }) => {
    if (process.env.NODE_ENV === 'test') {
        return { success: true, simulated: true };
    }
    const target = String(destination || '').trim();
    if (!target) {
        return { success: false, error: 'Missing OTP destination' };
    }
    if (target.includes('@')) {
        const emailRes = await sendEmail({
            email: target,
            subject,
            message: emailMessage
        });
        if (emailRes && emailRes.success === false) {
            return { success: false, error: emailRes.error || emailRes.reason || 'Email delivery failed' };
        }
        return { success: true, data: emailRes };
    }
    const smsRes = await sendSms({
        phone: target,
        message: smsMessage
    });
    if (!smsRes || smsRes.success !== true) {
        return {
            success: false,
            error: smsRes?.error || smsRes?.reason || 'SMS delivery failed',
            details: smsRes?.details
        };
    }
    return { success: true, data: smsRes };
};

const isOperatorRole = role => ['operator', 'driver'].includes(String(role).trim().toLowerCase());

const operatorStateFilter = user => ({
    _id: user._id,
    role: user.role,
    todaAssociation: !user.todaAssociation || user.todaAssociation === 'NON-TODA'
        ? { $in: [user.todaAssociation || 'NON-TODA', '', null] }
        : user.todaAssociation,
    bodyNumber: user.bodyNumber || { $in: ['', null] }
});

async function findVerifiedRosterClaimConflict({ todaAssociation, bodyNumber, excludeUserId, session }) {
    const association = rosterAssociation(todaAssociation);
    const key = rosterBodyKey(bodyNumber);
    if (!association.id || association.id === 'NON-TODA' || !key) return { conflict: false, matchingRosterDoc: null };

    const verifiedUsers = await User.find({
        todaAssociation: association.pattern,
        role: { $in: ['operator', 'driver'] },
        isVerified: true,
        bodyNumber: { $exists: true, $ne: '' },
        ...(excludeUserId && { _id: { $ne: excludeUserId } })
    }).select('_id bodyNumber').session(session ?? null).lean();
    if (verifiedUsers.some(user => rosterBodyKey(user.bodyNumber) === key)) return { conflict: true };

    try {
        const row = await findRosterSlot(association.id, bodyNumber, session);
        const conflict = row && (row.status !== 'Active' || rosterOwners(row).some(owner => owner !== String(excludeUserId)));
        return { conflict: Boolean(conflict), matchingRosterDoc: row };
    } catch (error) {
        if (error.statusCode === 409) return { conflict: true };
        throw error;
    }
}

async function claimTodaRosterSlot({ matchingRosterDoc, userId, operatorName }) {
    if (!isNameMatch(operatorName, matchingRosterDoc.operatorName)) return { claimed: false };
    try {
        const row = await withRosterMutation(TodaRoster.db, writes => claimRosterRow(matchingRosterDoc, userId, writes));
        return { claimed: true, rosterId: row._id };
    } catch (error) {
        if (error.statusCode === 409 || error.code === 11000) return { claimed: false };
        throw error;
    }
}

const releaseTodaRosterSlot = ({ rosterId, userId }) => withRosterMutation(TodaRoster.db, async writes => {
    const verified = await User.exists({ _id: userId, isVerified: true }).session(writes.session ?? null);
    if (!verified) await releaseRosterClaims(userId, { criteria: { _id: rosterId }, writes });
});

async function hasLostVerifiedUserSlotRace({ todaAssociation, bodyNumber, userId }) {
    const association = rosterAssociation(todaAssociation);
    const key = rosterBodyKey(bodyNumber);
    if (!association.id || association.id === 'NON-TODA' || !key) return false;
    const allVerified = await User.find({
        todaAssociation: association.pattern,
        role: { $in: ['operator', 'driver'] },
        isVerified: true,
        bodyNumber: { $exists: true, $ne: '' }
    }).select('_id bodyNumber').sort({ _id: 1 }).lean();
    const first = allVerified.find(user => rosterBodyKey(user.bodyNumber) === key);
    return Boolean(first && String(first._id) !== String(userId));
}

async function claimOperatorTransfer({ user, association, bodyNumber, writes }) {
    const { session } = writes;
    const { conflict, matchingRosterDoc } = await findVerifiedRosterClaimConflict({
        todaAssociation: association, bodyNumber, excludeUserId: user._id, session
    });
    if (conflict) throw rosterConflict('This TODA Body Number is unavailable.');

    const report = await validateOperatorAgainstRoster({
        fullName: user.name, todaAssociation: association, bodyNumber, session
    });
    if (!report.isValid) {
        throw Object.assign(new Error('TODA affiliation change requires a matching official roster entry.'), { statusCode: 403 });
    }

    // Older approved submissions may predate direct roster rows.
    const row = matchingRosterDoc || await writes.create(TodaRoster, {
        todaAssociation: association,
        operatorName: report.matchedMember,
        bodyNumber: report.matchedBodyNumber,
        plateNo: report.plateNo,
        claimKey: rosterClaimKey(association, report.matchedBodyNumber)
    });
    await claimRosterRow(row, user._id, writes);
    return row;
}

// Shared singleton institutional role uniqueness guard (M14)
const checkSingletonRoleConflict = async ({ targetUserId, normalizedRole, todaAssociation }) => {
    if (normalizedRole === 'bplo_staff') {
        const existingLlsa = await User.findOne({
            _id: { $ne: targetUserId },
            role: { $in: ['bplo_staff', 'bplo staff'] },
            isActive: { $ne: false }
        });
        if (existingLlsa) {
            return {
                conflict: true,
                message: `May nakatalaga nang aktibong LLSA I Staff (${existingLlsa.name}). Tanging 1 aktibong LLSA I (Franchising Staff) account lamang ang pinapayagan.`
            };
        }
    }

    if (normalizedRole === 'cashier') {
        const existingCashier = await User.findOne({
            _id: { $ne: targetUserId },
            role: 'cashier',
            isActive: { $ne: false }
        });
        if (existingCashier) {
            return {
                conflict: true,
                message: `May nakatalaga nang aktibong Municipal Cashier (${existingCashier.name}). Tanging 1 aktibong Municipal Cashier account lamang ang pinapayagan.`
            };
        }
    }

    if (normalizedRole === 'toda_president') {
        const targetToda = String(todaAssociation || '').trim();
        if (!targetToda || targetToda.toUpperCase() === 'NON-TODA') {
            return {
                conflict: true,
                invalidToda: true,
                message: 'A TODA President must be assigned to an active TODA Association (cannot be NON-TODA).'
            };
        }
        const escaped = targetToda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingPresident = await User.findOne({
            _id: { $ne: targetUserId },
            role: { $in: ['toda_president', 'toda president'] },
            todaAssociation: { $regex: new RegExp(`^${escaped}$`, 'i') },
            isActive: { $ne: false }
        });
        if (existingPresident) {
            return {
                conflict: true,
                message: `May nakatalaga nang TODA President para sa ${targetToda} (${existingPresident.name}). Tanging 1 TODA President lamang ang pinapayagan bawat asosasyon.`
            };
        }
    }

    return { conflict: false };
};

// Reusable Google token verification helper for googleAuth, profile reauth (H2), and Google-only appeals (M4)
const verifyGoogleTokens = async ({ idToken, accessToken, allowTestJwtFallback = true }) => {
    let email = '';
    let googleId = '';
    let googleName = '';
    let googlePicture = '';
    let emailVerified = false;
    let sawUnverifiedGoogleEmail = false;

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

    if (idToken) {
        const isLikelyJwt = typeof idToken === 'string' && idToken.split('.').length === 3 && idToken.startsWith('eyJ');

        if (isLikelyJwt) {
            try {
                const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { timeout: 4000 });
                if (googleRes.data && googleRes.data.email && isValidIdTokenAudience(googleRes.data)) {
                    const verifiedFlag = isTruthyEmailVerified(googleRes.data.email_verified);
                    if (process.env.NODE_ENV !== 'test' && !verifiedFlag) {
                        sawUnverifiedGoogleEmail = true;
                    } else if (googleRes.data.email_verified === false || googleRes.data.email_verified === 'false') {
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

            if (!email && !sawUnverifiedGoogleEmail && allowTestJwtFallback && process.env.NODE_ENV === 'test') {
                try {
                    const decoded = jwt.decode(idToken);
                    const isAppInternalToken = Boolean(decoded && (decoded.tokenType || decoded.purpose));
                    if (
                        decoded &&
                        !isAppInternalToken &&
                        (decoded.email || decoded.sub || decoded.email_verified) &&
                        (!process.env.GOOGLE_CLIENT_ID || decoded.aud === process.env.GOOGLE_CLIENT_ID)
                    ) {
                        if (decoded.email_verified === false || decoded.email_verified === 'false') {
                            sawUnverifiedGoogleEmail = true;
                        } else {
                            if (decoded.email) email = String(decoded.email).toLowerCase().trim();
                            emailVerified = decoded.email_verified === undefined ? true : isTruthyEmailVerified(decoded.email_verified);
                            googleId = googleId || decoded.sub || decoded.user_id || decoded.id || '';
                            googleName = googleName || decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim() || '';
                            googlePicture = googlePicture || decoded.picture || '';
                        }
                    }
                } catch (jwtErr) {
                    console.warn('Google JWT decode warning:', jwtErr.message);
                }
            }
        } else {
            try {
                const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(idToken)}`, { timeout: 4000 });
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

    const rawAccessToken = accessToken || (!email && !sawUnverifiedGoogleEmail && idToken ? idToken : null);
    if (!email && !sawUnverifiedGoogleEmail && rawAccessToken) {
        let accessTokenAudienceVerified = false;
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
            } catch {
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

    return {
        email,
        googleId,
        googleName,
        googlePicture,
        emailVerified,
        sawUnverifiedGoogleEmail
    };
};

// Verify that a fresh Google token belongs to a specific User account (for H2 profile reauth & M4 Google-only appeals)
const verifyGoogleReauthForUser = async ({ idToken, accessToken, user }) => {
    if (!idToken && !accessToken) {
        return { valid: false, message: 'Fresh Google sign-in token is required.' };
    }
    const verified = await verifyGoogleTokens({ idToken, accessToken, allowTestJwtFallback: true });
    if (verified.sawUnverifiedGoogleEmail || (process.env.NODE_ENV !== 'test' && !verified.emailVerified)) {
        return { valid: false, message: 'Google account email must be verified.' };
    }
    if (!verified.email && !verified.googleId) {
        return { valid: false, message: 'Invalid or expired Google reauthentication token.' };
    }

    const userGoogleId = String(user.googleId || '').trim();
    const userEmail = String(user.email || '').trim().toLowerCase();
    const userContactEmail = String(user.contact || '').includes('@') ? String(user.contact).trim().toLowerCase() : '';

    if (userGoogleId) {
        if (verified.googleId && verified.googleId !== userGoogleId) {
            return { valid: false, message: 'Google account identity mismatch.' };
        }
        if (process.env.NODE_ENV !== 'test' && !verified.googleId) {
            return { valid: false, message: 'Google account identity mismatch.' };
        }
    }

    const googleIdMatched = Boolean(userGoogleId && verified.googleId && verified.googleId === userGoogleId);
    const emailMatched = Boolean(
        verified.email &&
        ((userEmail && verified.email === userEmail) || (userContactEmail && verified.email === userContactEmail))
    );

    if (verified.email && (userEmail || userContactEmail) && !emailMatched) {
        return { valid: false, message: 'Google account email does not match your account.' };
    }

    if (!googleIdMatched && !emailMatched) {
        return { valid: false, message: 'Google account does not match your account.' };
    }

    return { valid: true, verified };
};

const sessionFingerprint = (req) => crypto.createHash('sha256').update(req.headers.authorization || '').digest('hex');

exports.googleStepUpChallenge = async (req, res) => {
    if (hasLocalCredential(req.user) || !req.user.googleId) {
        return res.status(400).json({ message: 'Google step-up requires a linked Google-only account.' });
    }
    res.set('Cache-Control', 'no-store');
    return res.json({
        nonce: jwt.sign({
            purpose: 'google_profile_step_up',
            userId: String(req.user._id),
            session: sessionFingerprint(req),
            version: contactVersion(req.user),
            challenge: crypto.randomUUID()
        }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '3m' })
    });
};

const verifyGoogleProfileStepUp = async (req, user) => {
    const credential = String(req.body.googleReauthToken || '').trim();
    const decoded = jwt.decode(credential);
    if (!decoded || typeof decoded.nonce !== 'string' || !user.googleId) return false;
    let challenge;
    try {
        challenge = jwt.verify(decoded.nonce, getJwtSecret(), { algorithms: ['HS256'] });
    } catch {
        return false;
    }
    if (challenge.purpose !== 'google_profile_step_up' || challenge.userId !== String(user._id) ||
        challenge.session !== sessionFingerprint(req) || challenge.version !== contactVersion(user)) {
        return false;
    }
    // The provider verifies the same signed credential whose nonce was read above.
    const verified = await verifyGoogleTokens({ idToken: credential, allowTestJwtFallback: false });
    return verified.emailVerified && verified.googleId === user.googleId;
};

const signSessionToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0, tokenType: 'access' },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '1d', jwtid: crypto.randomUUID() }
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
                return res.status(403).json(rosterIneligible);
            }

            // H3: Prevent a TODA association + normalized body number from being claimed by a second verified operator
            const claimConflict = await findVerifiedRosterClaimConflict({
                todaAssociation: normalizedToda,
                bodyNumber: normalizedBodyNo
            });
            if (claimConflict.conflict) {
                return res.status(409).json({
                    success: false,
                    status: 'already_claimed',
                    message: 'Ang TODA association at Body Number na ito ay nakarehistro at na-claim na ng ibang verified operator account.'
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
            isContactVerified: false,
            isEmailVerified: false,
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
            let deliverySucceeded = false;
            try {
                const sendResult = await dispatchOtpMessage({
                    destination: otpTargetContact,
                    subject: 'G-TRAMS: Account Verification OTP',
                    emailMessage: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.`,
                    smsMessage: `G-TRAMS LGU Gasan: Ang inyong verification code ay ${otp}. Huwag itong ibahagi kahit kanino.`
                });
                deliverySucceeded = Boolean(sendResult && sendResult.success);
                if (!deliverySucceeded) {
                    console.error("OTP Delivery Error (email/SMS):", sendResult?.error || 'Unknown delivery failure');
                }
            } catch (sendErr) {
                console.error("OTP Delivery Error (email/SMS):", sendErr.message);
                deliverySucceeded = false;
            }

            if (!deliverySucceeded) {
                await User.findOneAndUpdate(
                    { _id: user._id, otp: user.otp, otpPurpose: user.otpPurpose },
                    { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
                ).catch(() => {});
                return res.status(503).json({
                    message: 'Unable to deliver verification code right now. Please try again.'
                });
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
            isContactVerified: true,
            isEmailVerified: isEmail && (!user.email || normalizeContact(user.email) === normalizeContact(rawContact)),
            otpAttempts: 0,
            otpPurpose: '',
            otpRecipient: ''
        };
        if (!user.email && isEmail) {
            setFields.email = rawContact.toLowerCase();
        }

        // H3: Enforce single-use TODA roster claim atomically before finalizing verification
        let claimedRosterId = null;
        const hasClaimableSlot = Boolean(
            user.todaAssociation &&
            String(user.todaAssociation).trim().toUpperCase() !== 'NON-TODA' &&
            user.bodyNumber &&
            normalizeBodyNumber(user.bodyNumber)
        );

        if (hasClaimableSlot) {
            const claimConflict = await findVerifiedRosterClaimConflict({
                todaAssociation: user.todaAssociation,
                bodyNumber: user.bodyNumber,
                excludeUserId: user._id
            });
            if (claimConflict.conflict) {
                return res.status(409).json({
                    message: 'Ang TODA association at Body Number na ito ay na-claim na ng ibang verified operator account.'
                });
            }
            if (claimConflict.matchingRosterDoc) {
                const claimResult = await claimTodaRosterSlot({
                    matchingRosterDoc: claimConflict.matchingRosterDoc,
                    userId: user._id,
                    operatorName: user.name
                });
                if (!claimResult.claimed) {
                    return res.status(409).json({
                        message: 'Ang TODA association at Body Number na ito ay na-claim na ng ibang verified operator account.'
                    });
                }
                claimedRosterId = claimResult.rosterId;
            }
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
            if (claimedRosterId) {
                await releaseTodaRosterSlot({ rosterId: claimedRosterId, userId: user._id });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Race-safe fallback guard if no TodaRoster document existed to lock
        if (hasClaimableSlot && !claimedRosterId) {
            const lostRace = await hasLostVerifiedUserSlotRace({
                todaAssociation: verifiedUser.todaAssociation,
                bodyNumber: verifiedUser.bodyNumber,
                userId: verifiedUser._id
            });
            if (lostRace) {
                await User.findByIdAndUpdate(verifiedUser._id, { $set: { isVerified: false } }).catch(() => {});
                return res.status(409).json({
                    message: 'Ang TODA association at Body Number na ito ay na-claim na ng ibang verified operator account.'
                });
            }
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
        
        if (!hasLocalCredential(user)) {
            user.hasLocalPassword = true;
            user.localPasswordConfirmedAt = new Date();
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

        // Determine exact recovery/primary destination (M3)
        const isEmailInput = rawContact.includes('@');
        const effectiveRecEmail = user.isRecoveryEmailVerified ? normalizeContact(user.recoveryEmail) : '';
        const effectiveRecPhone = user.isRecoveryPhoneVerified ? normalizeContact(user.recoveryPhone) : '';
        const backupTargetRaw = effectiveRecEmail || effectiveRecPhone;
        const primaryContactNorm = verifiedPrimaryContact(user);
        const primaryEmailNorm = (user.isEmailVerified === true ? normalizeContact(user.email) : '') ||
            (primaryContactNorm.includes('@') ? primaryContactNorm : '');
        const primaryTargetRaw = primaryContactNorm || primaryEmailNorm;

        const matchesPrimary =
            (normalizedContact && primaryContactNorm && normalizedContact.toLowerCase() === primaryContactNorm.toLowerCase()) ||
            (isEmailInput && primaryEmailNorm && rawContact.toLowerCase() === primaryEmailNorm);
        const matchesRecEmail = isEmailInput && Boolean(effectiveRecEmail) && rawContact.toLowerCase() === effectiveRecEmail;
        const matchesRecPhone = !isEmailInput && Boolean(effectiveRecPhone) && normalizedContact === effectiveRecPhone;

        const preferredChannel = String(req.body.preferredChannel || req.body.channel || '').trim().toLowerCase();
        const manualRecoveryTarget = normalizeContact(req.body.recoveryTarget || req.body.target || '');
        const requestBackup = Boolean(req.body.useBackupContact);

        let destination = normalizedContact;
        let isRecovery = false;

        // 1. Direct match against a specific recovery field ALWAYS dispatches to that exact matched destination
        if (!matchesPrimary && matchesRecEmail) {
            destination = effectiveRecEmail;
            isRecovery = true;
        } else if (!matchesPrimary && matchesRecPhone) {
            destination = effectiveRecPhone;
            isRecovery = true;
        } else if (manualRecoveryTarget) {
            if (effectiveRecEmail && manualRecoveryTarget.toLowerCase() === effectiveRecEmail) {
                destination = effectiveRecEmail;
                isRecovery = true;
            } else if (effectiveRecPhone && manualRecoveryTarget === effectiveRecPhone) {
                destination = effectiveRecPhone;
                isRecovery = true;
            } else if (
                (primaryContactNorm && manualRecoveryTarget.toLowerCase() === primaryContactNorm.toLowerCase()) ||
                (primaryEmailNorm && manualRecoveryTarget.toLowerCase() === primaryEmailNorm)
            ) {
                destination = manualRecoveryTarget;
                isRecovery = false;
            } else {
                return res.status(400).json({ message: 'Selected recovery destination does not match this account.' });
            }
        } else if (preferredChannel === 'recoveryemail' || preferredChannel === 'recovery_email') {
            if (!effectiveRecEmail) {
                return res.status(400).json({ message: 'No recovery email is configured for this account.' });
            }
            destination = effectiveRecEmail;
            isRecovery = true;
        } else if (preferredChannel === 'recoveryphone' || preferredChannel === 'recovery_phone') {
            if (!effectiveRecPhone) {
                return res.status(400).json({ message: 'No recovery phone is configured for this account.' });
            }
            destination = effectiveRecPhone;
            isRecovery = true;
        } else if (preferredChannel === 'email') {
            if ((requestBackup || !primaryTargetRaw.includes('@')) && effectiveRecEmail) {
                destination = effectiveRecEmail;
                isRecovery = true;
            } else if (primaryEmailNorm) {
                destination = primaryEmailNorm;
                isRecovery = false;
            } else if (effectiveRecEmail) {
                destination = effectiveRecEmail;
                isRecovery = true;
            }
        } else if (preferredChannel === 'phone' || preferredChannel === 'sms') {
            if ((requestBackup || primaryTargetRaw.includes('@')) && effectiveRecPhone) {
                destination = effectiveRecPhone;
                isRecovery = true;
            } else if (primaryContactNorm && !primaryContactNorm.includes('@')) {
                destination = primaryContactNorm;
                isRecovery = false;
            } else if (effectiveRecPhone) {
                destination = effectiveRecPhone;
                isRecovery = true;
            }
        } else if (requestBackup) {
            const fallbackBackup = effectiveRecEmail || effectiveRecPhone;
            if (fallbackBackup) {
                destination = fallbackBackup;
                isRecovery = true;
            }
        }

        if (![...verifiedPrimaryContacts(user), ...verifiedRecoveryContacts(user)].includes(destination)) {
            return res.status(400).json({ message: 'Choose a verified email or phone number to reset your password.' });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const issuedUser = await User.findOneAndUpdate(
            { _id: user._id, ...contactVersionFilter(user) },
            { $set: { otp: hashOtp(otp), otpExpire: new Date(Date.now() + 10 * 60 * 1000), otpAttempts: 0, otpPurpose: 'reset', otpRecipient: destination } },
            { returnDocument: 'after' }
        );
        if (!issuedUser) {
            return res.status(409).json({ message: 'Account security details changed. Please request a new code.' });
        }
        user = issuedUser;

        const isDestEmail = destination.includes('@');

        if (process.env.NODE_ENV === 'test') {
            console.log(`[DEV/TEST OTP] Password Reset OTP for ${destination}${isRecovery ? ' (via Recovery Contact)' : ''}: ${otp}`);
        }

        try {
            const sendResult = await dispatchOtpMessage({
                destination,
                subject: 'G-TRAMS: Account Recovery OTP',
                emailMessage: `Your OTP for G-TRAMS password reset is: ${otp}\n\nThis code is valid for 10 minutes only.${isRecovery ? '\n\nNote: This code was requested using your registered Recovery Email.' : ''}`,
                smsMessage: `G-TRAMS LGU Gasan: Ang inyong password reset OTP code ay ${otp}. Huwag itong ibahagi kahit kanino.${isRecovery ? ' (Sent to recovery phone)' : ''}`
            });

            if (!sendResult || !sendResult.success) {
                await User.findOneAndUpdate(
                    { _id: user._id, otp: user.otp, otpPurpose: user.otpPurpose },
                    { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
                ).catch(() => {});
                const errDetail = typeof sendResult?.details === 'string' ? sendResult.details : JSON.stringify(sendResult?.details || sendResult?.error || '');
                const isSmsIssue = errDetail.includes('approved') || errDetail.includes('credit') || errDetail.includes('balance');
                return res.status(503).json({
                    message: isSmsIssue
                        ? 'SMS gateway has insufficient credits or is unverified. Please use your email address or contact support.'
                        : 'Unable to deliver verification code right now. Please try again.'
                });
            }

            // M3: Mint short-lived signed resetChallengeToken binding uid & exact target recipient
            const resetChallengeToken = jwt.sign(
                {
                    uid: String(user._id),
                    purpose: 'password_reset',
                    recipient: destination,
                    contactSecurityVersion: contactVersion(user),
                    otpExpiresAt: user.otpExpire.getTime()
                },
                getJwtSecret(),
                { algorithm: 'HS256', expiresIn: '10m' }
            );

            return res.status(200).json({ 
                message: isRecovery 
                    ? `OTP recovery code sent successfully to your Recovery ${isDestEmail ? 'Email' : 'Phone'} (${maskContactInfo(destination)}).` 
                    : `OTP sent successfully to your ${isDestEmail ? 'email' : 'SMS'}.`,
                recoveryUsed: isRecovery,
                destination: isRecovery ? maskContactInfo(destination) : undefined,
                resetChallengeToken,
                hasBackupContact: Boolean(backupTargetRaw && backupTargetRaw.toLowerCase() !== primaryTargetRaw.toLowerCase()),
                hasRecoveryEmail: Boolean(effectiveRecEmail),
                hasRecoveryPhone: Boolean(effectiveRecPhone),
                maskedRecoveryEmail: effectiveRecEmail ? maskContactInfo(effectiveRecEmail) : '',
                maskedRecoveryPhone: effectiveRecPhone ? maskContactInfo(effectiveRecPhone) : '',
                maskedBackupContact: backupTargetRaw ? maskContactInfo(backupTargetRaw) : '',
                maskedPrimaryContact: primaryTargetRaw ? maskContactInfo(primaryTargetRaw) : '',
                ...(process.env.NODE_ENV === 'test' ? { testOtp: otp } : {})
            });
        } catch (err) {
            console.error("FORGOT PASSWORD OTP SEND ERROR:", err?.response?.data || err.message);
            await User.findOneAndUpdate(
                { _id: user._id, otp: user.otp, otpPurpose: user.otpPurpose },
                { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
            ).catch(() => {});
            const errDetail = typeof err?.response?.data === 'string' ? err.response.data : JSON.stringify(err?.response?.data || '');
            const isSmsIssue = errDetail.includes('approved') || errDetail.includes('credit') || errDetail.includes('balance');
            return res.status(503).json({ 
                message: isSmsIssue 
                    ? 'SMS gateway has insufficient credits or is unverified. Please use your email address or contact support.' 
                    : 'Unable to deliver verification code right now. Please try again.' 
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
        const { contact, otp, newPassword, resetChallengeToken } = req.body;
        const hasChallengeToken = typeof resetChallengeToken === 'string' && resetChallengeToken.trim().length > 0;

        if (typeof otp !== 'string' || typeof newPassword !== 'string') {
            return res.status(400).json({ message: 'Contact, OTP code, and new password are required.' });
        }
        if (!hasChallengeToken && typeof contact !== 'string') {
            return res.status(400).json({ message: 'Contact, OTP code, and new password are required.' });
        }

        const rawContact = typeof contact === 'string' ? contact.trim() : '';
        const normalizedOtp = otp.trim();

        if ((!hasChallengeToken && !rawContact) || !normalizedOtp) {
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

        let user = null;
        let challengeRecipient = '';

        // M3: Bind account lookup & otpRecipient directly to signed resetChallengeToken when provided
        if (hasChallengeToken) {
            let decodedChallenge;
            try {
                decodedChallenge = jwt.verify(resetChallengeToken.trim(), getJwtSecret(), { algorithms: ['HS256'] });
            } catch {
                return res.status(400).json({ message: 'Invalid or expired password reset session. Please request a new OTP.' });
            }
            if (!decodedChallenge || decodedChallenge.purpose !== 'password_reset' || !decodedChallenge.uid || !decodedChallenge.recipient) {
                return res.status(400).json({ message: 'Invalid or expired password reset session. Please request a new OTP.' });
            }
            if (!mongoose.Types.ObjectId.isValid(decodedChallenge.uid)) {
                return res.status(400).json({ message: 'Invalid or expired password reset session. Please request a new OTP.' });
            }
            challengeRecipient = String(decodedChallenge.recipient).trim();
            user = await User.findById(decodedChallenge.uid);
            if (!user || decodedChallenge.contactSecurityVersion !== contactVersion(user) ||
                decodedChallenge.otpExpiresAt !== user.otpExpire?.getTime()) {
                return res.status(400).json({ message: 'Invalid or expired password reset session. Please request a new OTP.' });
            }
        } else {
            user = await User.findOne(getPrimaryContactQueryFilter(rawContact));
            if (!user) {
                user = await User.findOne(getContactQueryFilter(rawContact));
            }
        }

        if (!user || !user.isVerified || !user.otp || !user.otpExpire || user.otpExpire <= Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        const storedRecipient = normalizeContact(user.otpRecipient);
        const primaryTargets = verifiedPrimaryContacts(user);
        const recoveryTargets = verifiedRecoveryContacts(user);
        const input = normalizeContact(rawContact);
        const matchesRequest = hasChallengeToken
            ? storedRecipient === normalizeContact(challengeRecipient)
            : input === storedRecipient || (recoveryTargets.includes(storedRecipient) && primaryTargets.includes(input));
        if (user.otpPurpose !== 'reset' || !storedRecipient || !matchesRequest ||
            ![...primaryTargets, ...recoveryTargets].includes(storedRecipient)) {
            return res.status(400).json({ message: 'Invalid or expired OTP code.' });
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
        const claimedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                otp: user.otp,
                otpPurpose: 'reset',
                otpRecipient: user.otpRecipient,
                ...contactVersionFilter(user),
                otpExpire: { $eq: user.otpExpire, $gt: new Date() },
                otpAttempts: { $lt: 5 }
            },
            {
                $unset: { otp: 1, otpExpire: 1 },
                $set: {
                    otpAttempts: 0,
                    otpPurpose: '',
                    otpRecipient: '',
                    password: hashedPassword,
                    hasLocalPassword: true,
                    failedLoginAttempts: 0,
                    lockUntil: null,
                    passwordChangedAt: new Date()
                },
                $inc: { tokenVersion: 1, contactSecurityVersion: 1 }
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

        const currentUser = await User.findById(req.user._id);
        if (!currentUser) return res.status(404).json({ message: 'User not found' });
        if (!(await currentUser.matchPassword(oldPassword))) {
            return res.status(400).json({ message: 'Incorrect old password.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: currentUser._id, password: currentUser.password, ...contactVersionFilter(currentUser) },
            {
                $set: { ...clearContactOtp, password: await User.hashPassword(newPassword), hasLocalPassword: true, passwordChangedAt: new Date() },
                $unset: unsetContactOtp,
                $inc: { tokenVersion: 1, contactSecurityVersion: 1 }
            },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(409).json({ message: 'Account security details changed. Please try again.' });

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

// Request OTP to verify ownership of a recovery email or phone before binding (H2 + M1)
exports.requestRecoveryOtp = async (req, res) => {
    try {
        const rawTarget = String(req.body?.target || '').trim();
        if (!rawTarget) {
            return res.status(400).json({ message: 'Recovery target email or Philippine mobile number is required.' });
        }

        const isTargetEmail = rawTarget.includes('@');
        if (isTargetEmail ? !isValidEmailFormat(rawTarget) : !isValidPhMobileFormat(rawTarget)) {
            return res.status(400).json({
                message: isTargetEmail
                    ? 'Please provide a valid recovery email address.'
                    : 'Please provide a valid Philippine mobile number (e.g. 09XXXXXXXXX).'
            });
        }

        const normalizedTarget = normalizeContact(rawTarget);
        const currentUser = await User.findById(req.user._id || req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const primaryContactNorm = normalizeContact(currentUser.contact || '');
        const primaryEmailNorm = String(currentUser.email || '').trim().toLowerCase();
        if (
            (currentUser.isContactVerified && normalizedTarget === primaryContactNorm) ||
            (isTargetEmail && currentUser.isEmailVerified && normalizedTarget === primaryEmailNorm)
        ) {
            return res.status(400).json({
                message: isTargetEmail
                    ? 'Ang Recovery Email ay dapat iba sa inyong pangunahing contact email.'
                    : 'Ang Recovery Phone ay dapat iba sa inyong pangunahing numero ng telepono.'
            });
        }

        const collision = await User.findOne({
            _id: { $ne: currentUser._id },
            ...getPrimaryContactQueryFilter(normalizedTarget)
        });
        if (collision) {
            return res.status(400).json({
                message: 'Ang inilagay na recovery detail ay ginagamit na bilang pangunahing contact ng ibang rehistradong account.'
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const issuedUser = await User.findOneAndUpdate(
            { _id: currentUser._id, ...contactVersionFilter(currentUser) },
            { $set: {
                otp: hashOtp(otp),
                otpPurpose: 'recovery_bind',
                otpRecipient: normalizedTarget,
                otpExpire: new Date(Date.now() + 10 * 60 * 1000),
                otpAttempts: 0
            } },
            { returnDocument: 'after' }
        );
        if (!issuedUser) return res.status(409).json({ message: 'Account security details changed. Please request a new code.' });

        if (process.env.NODE_ENV === 'test') {
            console.log(`[DEV/TEST OTP] Recovery Bind OTP for ${normalizedTarget}: ${otp}`);
        }

        try {
            const sendResult = await dispatchOtpMessage({
                destination: normalizedTarget,
                subject: 'G-TRAMS: Recovery Contact Verification Code',
                emailMessage: `Your G-TRAMS verification code to bind this recovery email is: ${otp}\n\nThis code is valid for 10 minutes only.`,
                smsMessage: `G-TRAMS LGU Gasan: Ang inyong recovery verification code ay ${otp}. Valid ito sa loob ng 10 minuto.`
            });

            if (!sendResult || !sendResult.success) {
                await User.findOneAndUpdate(
                    { _id: currentUser._id, otp: issuedUser.otp, otpExpire: issuedUser.otpExpire, otpPurpose: 'recovery_bind' },
                    { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
                ).catch(() => {});
                return res.status(503).json({
                    message: 'Unable to deliver verification code right now. Please try again.'
                });
            }
        } catch (sendErr) {
            console.error('REQUEST RECOVERY OTP SEND ERROR:', sendErr.message);
            await User.findOneAndUpdate(
                { _id: currentUser._id, otp: issuedUser.otp, otpExpire: issuedUser.otpExpire, otpPurpose: 'recovery_bind' },
                { $unset: { otp: 1, otpExpire: 1 }, $set: { otpAttempts: 0, otpPurpose: '', otpRecipient: '' } }
            ).catch(() => {});
            return res.status(503).json({
                message: 'Unable to deliver verification code right now. Please try again.'
            });
        }

        return res.status(200).json({
            message: `Verification code sent to ${maskContactInfo(normalizedTarget)}.`,
            destination: maskContactInfo(normalizedTarget),
            ...(process.env.NODE_ENV === 'test' ? { testOtp: otp } : {})
        });
    } catch (error) {
        console.error('REQUEST RECOVERY OTP ERROR:', error);
        return res.status(500).json({ message: 'Server error' });
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

        // 4 & 5. Enforce single-instance institutional roles (bplo_staff, cashier, 1 toda_president per TODA)
        let targetToda = existingUser.todaAssociation || 'NON-TODA';
        if (rawRequestedRole === 'toda_president') {
            targetToda = (req.body.todaAssociation !== undefined ? req.body.todaAssociation : existingUser.todaAssociation || '').trim();
        } else if (rawRequestedRole === 'bplo_staff' || rawRequestedRole === 'cashier') {
            targetToda = 'NON-TODA';
        }

        const roleConflict = await checkSingletonRoleConflict({
            targetUserId: req.params.id,
            normalizedRole: rawRequestedRole,
            todaAssociation: targetToda
        });
        if (roleConflict.conflict) {
            return res.status(400).json({ message: roleConflict.message });
        }

        // 6. Strict whitelist update (prevents mass-assignment injection)
        const whitelistUpdate = {
            role: rawRequestedRole,
            todaAssociation: targetToda
        };
        const operatorRoleChanged = isOperatorRole(currentRoleNorm) !== isOperatorRole(rawRequestedRole);
        if (operatorRoleChanged) {
            whitelistUpdate.bodyNumber = '';
            if (isOperatorRole(rawRequestedRole)) whitelistUpdate.todaAssociation = 'NON-TODA';
        }
        if (rawRequestedRole !== currentRoleNorm) {
            whitelistUpdate.tokenVersion = (existingUser.tokenVersion || 0) + 1;
        }

        const accountFilter = operatorStateFilter(existingUser);
        const accountUpdate = { $set: whitelistUpdate };
        const updatedUser = operatorRoleChanged
            ? await withRosterMutation(User.db, async writes => {
                const updated = await writes.update(User, accountFilter, accountUpdate);
                if (updated) await releaseRosterClaims(existingUser._id, { writes });
                return updated;
            })
            : await User.findOneAndUpdate(accountFilter, accountUpdate, { returnDocument: 'after' }).select(USER_SENSITIVE_SELECT);

        if (!updatedUser) return res.status(409).json({ message: 'Account details changed. Please try again.' });

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
        if (error.statusCode === 409) return res.status(409).json({ message: error.message });
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

        const user = await withRosterMutation(User.db, async writes => {
            const removed = await writes.remove(User, operatorStateFilter(existingUser));
            if (removed) await releaseRosterClaims(existingUser._id, { writes });
            return removed;
        });
        if (!user) return res.status(409).json({ message: 'Account details changed. Please try again.' });

        logAudit(req, {
            action: 'USER_DELETED',
            targetType: 'User',
            targetId: req.params.id,
            details: { name: user.name, role: user.role, contact: user.contact }
        });

        res.status(200).json({ message: 'User successfully deleted' });
    } catch (error) {
        if (error.statusCode === 409) return res.status(409).json({ message: error.message });
        console.error('Error deleting user:', error);
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
        }

        let transfer = null;
        if (isOperatorRole(currentUserRole) && (todaAssociation !== undefined || req.body.bodyNumber !== undefined)) {
            if ((todaAssociation !== undefined && typeof todaAssociation !== 'string') ||
                (req.body.bodyNumber !== undefined && typeof req.body.bodyNumber !== 'string')) {
                return res.status(400).json({ message: 'Select an official TODA and provide a valid Body Number.' });
            }
            const currentAssociation = rosterAssociation(currentUser.todaAssociation || 'NON-TODA');
            const association = rosterAssociation(todaAssociation === undefined
                ? currentAssociation.id : (todaAssociation.trim() || 'NON-TODA'));
            const bodyNumber = association.id === 'NON-TODA' ? '' : (req.body.bodyNumber ?? currentUser.bodyNumber);
            if (association.id !== currentAssociation.id || rosterBodyKey(bodyNumber) !== rosterBodyKey(currentUser.bodyNumber)) {
                if (!association.official || (association.id !== 'NON-TODA' && !rosterBodyKey(bodyNumber))) {
                    return res.status(400).json({ message: 'Select an official TODA and provide a valid Body Number.' });
                }
                transfer = { association: association.id, bodyNumber };
            }
        }

        const rawReqRecEmail = req.body.recoveryEmail !== undefined ? String(req.body.recoveryEmail || '').trim().toLowerCase() : undefined;
        const rawReqRecPhone = req.body.recoveryPhone !== undefined ? String(req.body.recoveryPhone || '').trim() : undefined;
        const clearRecovery = req.body.clearRecovery === true || req.body.clearRecovery === 'true';

        const dbRecEmail = String(currentUser.recoveryEmail || '').trim().toLowerCase();
        const dbRecPhone = String(currentUser.recoveryPhone || '').trim();
        const dbBackup = String(currentUser.backupContact || '').trim();

        const hydratedLegacyEmail = (!dbRecEmail && !dbRecPhone && dbBackup && dbBackup.includes('@')) ? dbBackup.toLowerCase() : '';
        const hydratedLegacyPhone = (!dbRecEmail && !dbRecPhone && dbBackup && !dbBackup.includes('@')) ? dbBackup : '';

        const isContactChanging = contact !== undefined && normalizeContact(contact) !== normalizeContact(currentUser.contact);
        // M2: Only treat recovery fields as changing when genuinely changed (do not treat echoed legacy backupContact or blank-to-blank as a change)
        const isRecEmailChanging = rawReqRecEmail !== undefined &&
            rawReqRecEmail !== dbRecEmail &&
            !(hydratedLegacyEmail && rawReqRecEmail === hydratedLegacyEmail);
        const isRecPhoneChanging = rawReqRecPhone !== undefined &&
            normalizeContact(rawReqRecPhone) !== normalizeContact(dbRecPhone) &&
            !(hydratedLegacyPhone && normalizeContact(rawReqRecPhone) === normalizeContact(hydratedLegacyPhone));
        const isClearingExistingRecovery = clearRecovery && Boolean(dbBackup || dbRecEmail || dbRecPhone);

        const verificationTarget = normalizeContact(req.body.verificationTarget);
        const newContact = normalizeContact(contact ?? currentUser.contact);
        const newEmail = normalizeContact(rawReqRecEmail ?? (dbRecEmail || hydratedLegacyEmail));
        const newPhone = normalizeContact(rawReqRecPhone ?? (dbRecPhone || hydratedLegacyPhone));
        const pending = [
            { value: newContact, required: isContactChanging, verified: currentUser.isContactVerified, field: 'contact' },
            { value: normalizeContact(currentUser.email), required: false, verified: currentUser.isEmailVerified, field: 'email' },
            { value: clearRecovery ? '' : newEmail, required: !clearRecovery && isRecEmailChanging && Boolean(newEmail), verified: currentUser.isRecoveryEmailVerified, field: 'recoveryEmail' },
            { value: clearRecovery ? '' : newPhone, required: !clearRecovery && isRecPhoneChanging && Boolean(newPhone), verified: currentUser.isRecoveryPhoneVerified, field: 'recoveryPhone' }
        ];
        const requiredTargets = new Set(pending.filter(entry => entry.required).map(entry => entry.value));
        const selectedTarget = verificationTarget || [...requiredTargets][0];
        const verifiedFields = selectedTarget
            ? pending.filter(entry => entry.value === selectedTarget && (entry.required || !entry.verified))
            : [];
        const sensitive = isContactChanging || isRecEmailChanging || isRecPhoneChanging ||
            isClearingExistingRecovery || Boolean(verificationTarget);
        if (sensitive) {
            if (hasLocalCredential(currentUser)) {
                const password = req.body.currentPassword || req.body.password;
                if (typeof password !== 'string' || !password || !(await currentUser.matchPassword(password))) {
                    return res.status(401).json({ message: 'Current password is required to change contact or recovery details.' });
                }
            } else if (!(await verifyGoogleProfileStepUp(req, currentUser))) {
                return res.status(401).json({ message: 'Confirm your Google identity again before changing contact or recovery details.' });
            }
        }

        if (requiredTargets.size > 1 || (requiredTargets.size && !requiredTargets.has(selectedTarget))) {
            return res.status(400).json({ message: 'Verify and save one contact at a time.' });
        }
        if ((verificationTarget || requiredTargets.size) && !verifiedFields.length) {
            return res.status(400).json({ message: 'Select an unverified contact to verify.' });
        }
        const recoveryOtpRequired = verifiedFields.length > 0;
        if (recoveryOtpRequired) {
            if (!currentUser.otp || currentUser.otpPurpose !== 'recovery_bind' ||
                currentUser.otpRecipient !== selectedTarget || !currentUser.otpExpire || currentUser.otpExpire <= Date.now()) {
                return res.status(400).json({ message: 'Request a verification code for this contact before saving.' });
            }
            if ((currentUser.otpAttempts || 0) >= 5) {
                return res.status(429).json({ message: 'Too many verification attempts. Please request a new code.' });
            }
            if (!verifyHashedOtp(currentUser.otp, String(req.body.recoveryOtp || '').trim())) {
                const locked = await recordInvalidOtpAttempt(currentUser);
                return res.status(locked ? 429 : 400).json({ message: 'Invalid verification code. Request a new code if needed.' });
            }
        }

        const effectivePrimaryContact = contact !== undefined ? normalizeContact(contact) : normalizeContact(currentUser.contact);
        if (isRecEmailChanging && rawReqRecEmail) {
            if (!isValidEmailFormat(rawReqRecEmail)) {
                return res.status(400).json({ message: 'Invalid recovery email format.' });
            }
            if (rawReqRecEmail === effectivePrimaryContact.toLowerCase()) {
                return res.status(400).json({ message: 'Ang Recovery Email ay dapat iba sa inyong pangunahing contact email.' });
            }
        }
        if (isRecPhoneChanging && rawReqRecPhone) {
            const candidateRecPhone = normalizeContact(rawReqRecPhone);
            if (candidateRecPhone && candidateRecPhone === effectivePrimaryContact) {
                return res.status(400).json({ message: 'Ang Recovery Phone ay dapat iba sa inyong pangunahing numero ng telepono.' });
            }
        }

        // Prevent recoveryEmail / recoveryPhone / contact from colliding with another user's primary contact
        const collisionCandidates = [
            isContactChanging ? contact : null,
            isRecEmailChanging ? rawReqRecEmail : null,
            isRecPhoneChanging ? rawReqRecPhone : null
        ].filter(Boolean);
        for (const candidateContact of collisionCandidates) {
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
        if (isContactChanging) {
            updateData.contact = newContact;
            updateData.isContactVerified = false;
        }

        // M2: Only modify recovery fields / backupContact when genuinely changing or explicitly cleared
        if (clearRecovery) {
            updateData.recoveryEmail = '';
            updateData.recoveryPhone = '';
            updateData.backupContact = '';
            updateData.isRecoveryEmailVerified = false;
            updateData.isRecoveryPhoneVerified = false;
        } else if (isRecEmailChanging || isRecPhoneChanging) {
            if (isRecEmailChanging) {
                updateData.recoveryEmail = rawReqRecEmail;
                updateData.isRecoveryEmailVerified = false;
            }
            if (isRecPhoneChanging) {
                updateData.recoveryPhone = rawReqRecPhone;
                updateData.isRecoveryPhoneVerified = false;
            }
            const nextRecPhone = isRecPhoneChanging ? rawReqRecPhone : dbRecPhone;
            const nextRecEmail = isRecEmailChanging ? rawReqRecEmail : dbRecEmail;
            updateData.backupContact = nextRecPhone || nextRecEmail || '';
        }

        if (req.body.emergencyContact !== undefined) updateData.emergencyContact = String(req.body.emergencyContact || '').trim();
        if (todaAssociation !== undefined && currentUserRole !== 'toda_president' && !isOperatorRole(currentUserRole)) {
            updateData.todaAssociation = todaAssociation;
        }
        if (language !== undefined) updateData.language = language;
        if (theme !== undefined) updateData.theme = theme;
        
        if (req.file) {
            updateData.profilePic = req.file.path; 
        }

        for (const { field } of verifiedFields) {
            updateData[field] = selectedTarget;
            updateData['is' + field[0].toUpperCase() + field.slice(1) + 'Verified'] = true;
        }

        const filter = { _id: userId };
        const update = { $set: updateData };
        if (sensitive) {
            Object.assign(filter, contactVersionFilter(currentUser));
            Object.assign(updateData, clearContactOtp);
            update.$unset = unsetContactOtp;
            update.$inc = { contactSecurityVersion: 1 };
        }
        if (recoveryOtpRequired) {
            Object.assign(filter, {
                otp: currentUser.otp,
                otpPurpose: 'recovery_bind',
                otpRecipient: selectedTarget,
                otpExpire: { $eq: currentUser.otpExpire, $gt: new Date() },
                otpAttempts: { $lt: 5 }
            });
        }
        const updatedUser = transfer
            ? await withRosterMutation(User.db, async writes => {
                const row = transfer.association === 'NON-TODA' ? null : await claimOperatorTransfer({
                    user: currentUser, association: transfer.association, bodyNumber: transfer.bodyNumber, writes
                });
                const updated = await writes.update(User, { ...filter, ...operatorStateFilter(currentUser), name: currentUser.name }, {
                    ...update,
                    $set: { ...updateData, todaAssociation: transfer.association, bodyNumber: row?.bodyNumber || '' }
                });
                if (!updated) throw rosterConflict('Account details or verification code changed. Please try again.');
                await releaseRosterClaims(currentUser._id, { writes, criteria: row ? { _id: { $ne: row._id } } : {} });
                return updated;
            })
            : await User.findOneAndUpdate(filter, update, { returnDocument: 'after' }).select(USER_SENSITIVE_SELECT);
        if (!updatedUser) {
            return res.status(409).json({ message: 'Account details or verification code changed. Please try again.' });
        }

        res.status(200).json(sanitizeUserObject(updatedUser));
    } catch (error) {
        if (error.statusCode === 403 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        if (error.code === 11000 && error.keyPattern?.claimKey) {
            return res.status(409).json({ message: 'This TODA Body Number is unavailable.' });
        }
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

        // M14: Before reactivating an account, enforce singleton institutional role uniqueness
        if (newStatus === true) {
            const userRoleNorm = String(user.role || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
            const roleConflict = await checkSingletonRoleConflict({
                targetUserId: user._id,
                normalizedRole: userRoleNorm,
                todaAssociation: user.todaAssociation
            });
            if (roleConflict.conflict) {
                return res.status(409).json({ message: roleConflict.message });
            }
        }

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

        // Prefer the stable Google subject. Email is only a candidate for a first binding.
        let user = googleId ? await User.findOne({ googleId }) : null;
        if (!user) user = await User.findOne(getPrimaryContactQueryFilter(email));

        // Check maintenance mode
        const sysSettings = await SystemSettings.findOne().sort({ updatedAt: -1, createdAt: -1 });
        const isMaintenance = sysSettings && sysSettings.maintenanceMode === true;

        if (user) {
            if (user.googleId && user.googleId !== googleId) {
                return res.status(403).json({ message: 'Google account identity mismatch.' });
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

            const wasLocalUnlinked = !user.googleId;
            const verifiedLocalEmail = verifiedPrimaryContacts(user).includes(email);
            if (!googleId || !emailVerified || !user.isVerified || (wasLocalUnlinked &&
                (!isOperatorOrToda || !verifiedLocalEmail))) {
                return res.status(403).json({
                    message: 'Google linking requires a verified local email. Sign in with your existing credentials to verify it first.'
                });
            }

            const changes = { lastActive: new Date(), lastLogin: new Date() };
            if (wasLocalUnlinked) changes.googleId = googleId;
            if (!user.profilePic && googlePicture) changes.profilePic = googlePicture;
            if (!user.email || normalizeContact(user.email) === email) {
                if (!user.email) changes.email = email;
                if (!user.isEmailVerified) changes.isEmailVerified = true;
            }
            if (normalizeContact(user.contact) === email && !user.isContactVerified) {
                changes.isContactVerified = true;
            }

            const filter = { _id: user._id, isActive: { $ne: false }, ...contactVersionFilter(user) };
            filter.googleId = user.googleId || { $in: ['', null] };
            const update = { $set: changes };
            if (changes.email !== undefined || changes.isEmailVerified || changes.isContactVerified || wasLocalUnlinked) {
                Object.assign(changes, clearContactOtp);
                update.$unset = unsetContactOtp;
                update.$inc = { contactSecurityVersion: 1 };
            }
            user = await User.findOneAndUpdate(filter, update, { returnDocument: 'after' });
            if (!user) return res.status(409).json({ message: 'Account details changed. Please sign in again.' });

            if (wasLocalUnlinked) {
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
        const rawSubmittedContact = String(onboardingData?.contact || onboardingData?.phone || onboardingData?.email || email).trim();
        const todaAssociation = (onboardingData?.todaAssociation || 'NON-TODA').trim();

        // Check if account with this submitted contact / phone already exists (prevents hijacking another user's account)
        const contactFilter = getPrimaryContactQueryFilter(rawSubmittedContact);
        const existingContact = await User.findOne(contactFilter);

        if (existingContact) {
            return res.status(400).json({
                message: 'AN ACCOUNT WITH THIS CONTACT ALREADY EXISTS. Please sign in with your existing credentials.'
            });
        }

        // Public Google sign-in strictly registers as 'operator' (privilege escalation prevention)
        const assignedRole = 'operator';
        const bodyNumber = String(onboardingData?.bodyNumber || onboardingData?.unitNo || '').trim().toUpperCase();
        let matchingRosterDoc = null;
        const hasClaimableSlot = Boolean(
            todaAssociation &&
            todaAssociation.toUpperCase() !== 'NON-TODA' &&
            bodyNumber &&
            normalizeBodyNumber(bodyNumber)
        );

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
                return res.status(403).json(rosterIneligible);
            }

            // H3: Prevent a TODA association + normalized body number from being claimed by a second verified operator
            if (hasClaimableSlot) {
                const claimConflict = await findVerifiedRosterClaimConflict({
                    todaAssociation,
                    bodyNumber
                });
                if (claimConflict.conflict) {
                    return res.status(409).json({
                        success: false,
                        status: 'already_claimed',
                        message: 'Ang TODA association at Body Number na ito ay nakarehistro at na-claim na ng ibang verified operator account.'
                    });
                }
                matchingRosterDoc = claimConflict.matchingRosterDoc;
            }
        }

        // M4: NEVER set an unverified user-entered phone as primary contact of a verified Google account.
        // Always keep verified Google email as primary contact; store optional user-supplied phone in emergencyContact.
        const submittedPhoneCandidate =
            onboardingData?.phone ||
            (onboardingData?.contact && !String(onboardingData.contact).includes('@') ? onboardingData.contact : '') ||
            onboardingData?.emergencyContact ||
            '';
        const emergencyContact = submittedPhoneCandidate ? normalizeContact(submittedPhoneCandidate) : '';

        // Create new Google-only operator user (authProvider: 'google', hasLocalPassword: false)
        if (!googleId || !emailVerified) {
            return res.status(403).json({ message: 'A verified Google account and subject are required.' });
        }
        const randomPass = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'G!9a';
        const rawBackupContact = onboardingData?.backupContact || req.body?.backupContact || '';
        const backupContact = rawBackupContact ? normalizeContact(rawBackupContact) : '';
        const rawRecoveryEmail = onboardingData?.recoveryEmail || req.body?.recoveryEmail || (backupContact && backupContact.includes('@') ? backupContact : '');
        const recoveryEmail = rawRecoveryEmail && String(rawRecoveryEmail).includes('@') ? String(rawRecoveryEmail).toLowerCase().trim() : '';
        const rawRecoveryPhone = onboardingData?.recoveryPhone || req.body?.recoveryPhone || (backupContact && !backupContact.includes('@') ? backupContact : '');
        const recoveryPhone = rawRecoveryPhone ? String(rawRecoveryPhone).trim() : '';

        const newUserId = new mongoose.Types.ObjectId();
        let claimedRosterId = null;

        // H3: Atomically claim TodaRoster entry before creating the verified account
        if (hasClaimableSlot && matchingRosterDoc) {
            const claimResult = await claimTodaRosterSlot({
                matchingRosterDoc,
                userId: newUserId,
                operatorName: fullName
            });
            if (!claimResult.claimed) {
                return res.status(409).json({
                    success: false,
                    status: 'already_claimed',
                    message: 'Ang TODA association at Body Number na ito ay nakarehistro at na-claim na ng ibang verified operator account.'
                });
            }
            claimedRosterId = claimResult.rosterId;
        }

        user = new User({
            _id: newUserId,
            name: fullName,
            address: address,
            contact: email,
            backupContact,
            email: email,
            recoveryEmail,
            recoveryPhone,
            emergencyContact,
            googleId: googleId || '',
            password: randomPass,
            role: assignedRole,
            todaAssociation: todaAssociation,
            bodyNumber: bodyNumber,
            isVerified: true,
            isContactVerified: true,
            isEmailVerified: true,
            profilePic: googlePicture || '',
            authProvider: 'google',
            hasLocalPassword: false,
            lastActive: new Date(),
            lastLogin: new Date()
        });

        try {
            await user.save();
        } catch (saveErr) {
            if (claimedRosterId) {
                await releaseTodaRosterSlot({ rosterId: claimedRosterId, userId: newUserId });
            }
            throw saveErr;
        }

        // Race-safe fallback guard when no TodaRoster row anchored the claim
        if (hasClaimableSlot && !claimedRosterId) {
            const lostRace = await hasLostVerifiedUserSlotRace({
                todaAssociation,
                bodyNumber,
                userId: user._id
            });
            if (lostRace) {
                await User.deleteOne({ _id: user._id }).catch(() => {});
                return res.status(409).json({
                    success: false,
                    status: 'already_claimed',
                    message: 'Ang TODA association at Body Number na ito ay nakarehistro at na-claim na ng ibang verified operator account.'
                });
            }
        }

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

// Submit an appeal for a deactivated account (supports local password AND Google-only reauth — M4)
exports.submitAppeal = async (req, res) => {
    try {
        const { contact, password, message, googleCredential, googleAccessToken, idToken, accessToken } = req.body;
        const cleanMessage = String(message || '').trim();
        const rawContact = String(contact || '').trim();
        const googleIdToken = String(googleCredential || req.body.googleReauthToken || req.body.googleIdToken || idToken || req.body.credential || '').trim();
        const googleAccToken = String(googleAccessToken || accessToken || req.body.access_token || '').trim();
        const hasGoogleAuth = Boolean(googleIdToken || googleAccToken);

        if (!cleanMessage || (!rawContact && !hasGoogleAuth)) {
            return res.status(400).json({ message: 'Contact, credentials (password or Google verification), and appeal message are required.' });
        }

        let user = null;
        if (rawContact) {
            user = await User.findOne(getPrimaryContactQueryFilter(rawContact));
            if (!user) {
                user = await User.findOne(getContactQueryFilter(rawContact));
            }
        } else if (hasGoogleAuth) {
            const verified = await verifyGoogleTokens({ idToken: googleIdToken, accessToken: googleAccToken, allowTestJwtFallback: true });
            if (verified.sawUnverifiedGoogleEmail || (process.env.NODE_ENV !== 'test' && !verified.emailVerified) || (!verified.email && !verified.googleId)) {
                return res.status(401).json({ message: 'Google verification failed.' });
            }
            const lookupClauses = [];
            if (verified.googleId) lookupClauses.push({ googleId: verified.googleId });
            if (verified.email) {
                const esc = verified.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                lookupClauses.push({ email: { $regex: new RegExp(`^${esc}$`, 'i') } });
                lookupClauses.push({ contact: { $regex: new RegExp(`^${esc}$`, 'i') } });
            }
            if (lookupClauses.length > 0) {
                user = await User.findOne({ $or: lookupClauses });
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isActive) {
            return res.status(400).json({ message: 'Account is not deactivated.' });
        }

        const isGoogleOnlyUser = !hasLocalCredential(user);
        const isGoogleAccount = isGoogleOnlyUser || user.authProvider === 'google' || Boolean(user.googleId);

        if (hasGoogleAuth && isGoogleAccount) {
            const googleCheck = await verifyGoogleReauthForUser({
                idToken: googleIdToken,
                accessToken: googleAccToken,
                user
            });
            if (!googleCheck.valid) {
                return res.status(401).json({ message: googleCheck.message || 'Google verification failed for this account.' });
            }
        } else {
            if (!password) {
                return res.status(400).json({
                    message: isGoogleOnlyUser
                        ? 'This Google account requires Google verification to submit an appeal.'
                        : 'Contact, password, and appeal message are required.'
                });
            }
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    message: isGoogleOnlyUser
                        ? 'This Google account does not have a local password. Please verify with Google to submit your appeal.'
                        : 'Invalid password.'
                });
            }
        }

        user.appealMessage = cleanMessage;
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

        const { getIssuedPermit, hasIssuedPermitSnapshot, OPERATING_STATUSES } = require('../utils/issuedPermit');
        const formatVerifiedUnit = (f, ownerActive = true) => {
            const ownerIsInactive = ownerActive === false;
            const { status: issuedStatus, expiryDate: effectiveExpiryDate } = getIssuedPermit(f);
            const expiryMs = effectiveExpiryDate ? new Date(effectiveExpiryDate).getTime() : null;
            const hasValidExpiry = expiryMs !== null && !Number.isNaN(expiryMs);
            const isDateExpired = hasValidExpiry && expiryMs < Date.now();
            const isMissingOrInvalidExpiry = !hasValidExpiry;
            const isActiveStatus = OPERATING_STATUSES.includes(issuedStatus);
            const isCurrentlyValid = !ownerIsInactive && isActiveStatus && !f.isArchived && hasValidExpiry && !isDateExpired;
            let validityStatus = 'INACTIVE';
            if (ownerIsInactive) {
                validityStatus = 'INACTIVE_OWNER';
            } else if (isActiveStatus && isMissingOrInvalidExpiry) {
                validityStatus = 'UNVERIFIED_EXPIRY';
            } else if (isCurrentlyValid) {
                validityStatus = 'VALID';
            } else if (issuedStatus === 'Expired' || (isActiveStatus && isDateExpired)) {
                validityStatus = 'EXPIRED';
            } else if (['Pending', 'Pending for Approval', 'For Payment', 'For Signing', 'Ready for Pickup', 'Cancellation Requested'].includes(issuedStatus)) {
                validityStatus = 'PENDING';
            }
            return {
                make: f.make,
                plateNo: f.plateNo,
                status: isActiveStatus && isDateExpired ? 'Expired' : issuedStatus,
                todaName: f.todaName,
                approvalDate: f.approvalDate,
                expiryDate: effectiveExpiryDate,
                mtopNo: f.mtopNo,
                isRenewalPending: Boolean(f.isRenewalPending && f.status !== 'Cancelled'),
                ...(hasIssuedPermitSnapshot(f) ? { renewalStatus: f.status } : {}),
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
            }).select('make plateNo status todaName approvalDate expiryDate mtopNo isArchived applicationType isRenewalPending previousStatus previousExpiryDate');

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
            // L6: Treat missing / deleted operator account as inactive (never default orphaned permits to active)
            const ownerIsActive = Boolean(opUser && opUser.isActive !== false);
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

