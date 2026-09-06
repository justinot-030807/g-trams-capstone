const User = require('../models/userModel'); 
const SystemSettings = require('../models/systemSettingsModel');
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail'); 
const axios = require('axios');
const { logAudit } = require('../utils/auditLogger');

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

        const { name, address, contact, password, role, todaAssociation } = req.body;
        const normalizedContact = String(contact || '').trim();

        if (!normalizedContact) {
            return res.status(400).json({ message: 'Contact email or phone number is required.' });
        }
        
        // Case-insensitive check for existing user
        let user = await User.findOne({ 
            contact: { $regex: new RegExp(`^${normalizedContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        });

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ 
                    message: 'AN ACCOUNT WITH THIS EMAIL / PHONE NUMBER ALREADY EXISTS. PLEASE LOG IN INSTEAD.' 
                });
            }
            await User.deleteOne({ _id: user._id }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user = new User({
            name, address, contact: normalizedContact, password,
            role: role || 'operator',
            todaAssociation: todaAssociation || 'NON-TODA',
            isVerified: false,
            otp,
            otpExpire: Date.now() + 10 * 60 * 1000 
        });
        
        await user.save();

        if (normalizedContact.includes('@')) {
            await sendEmail({ email: normalizedContact, subject: 'G-TRAMS: Account Verification OTP', message: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.` });
        } else {
            await axios.post('https://api.semaphore.co/api/v4/messages', { 
                apikey: process.env.SEMAPHORE_API_KEY, 
                number: normalizedContact, 
                message: `G-TRAMS: Ang iyong verification code ay ${otp}. Huwag itong i-share kaninuman.` 
            });
        }
        res.status(201).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { contact, otp } = req.body;
        const user = await User.findOne({ contact, otp, otpExpire: { $gt: Date.now() } });
        
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();
        
        res.status(200).json({ message: 'Account verified successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { contact, password } = req.body; 
        const user = await User.findOne({ contact });
        
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified) return res.status(400).json({ message: 'Please verify your account first.' });
        
        // Block deactivated accounts
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

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
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({ token, role: user.role, user: userObj, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Login error' });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

// Send password reset OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { contact } = req.body; 
        const normalizedContact = String(contact || '').trim();

        if (!normalizedContact) {
            return res.status(400).json({ message: 'Contact email or phone number is required.' });
        }

        // Case-insensitive lookup
        const user = await User.findOne({
            contact: { $regex: new RegExp(`^${normalizedContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
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
                    message: `G-TRAMS: Ang iyong password reset verification code ay ${otp}. Huwag itong i-share kaninuman.` 
                });
                return res.status(200).json({ message: 'OTP sent successfully via SMS.' });
            }
        } catch (err) {
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Error sending OTP code.' });
        }
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { contact, otp, newPassword } = req.body; 
        const normalizedContact = String(contact || '').trim();
        const normalizedOtp = String(otp || '').trim();

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const user = await User.findOne({
            contact: { $regex: new RegExp(`^${normalizedContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
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

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: newStatus },
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
        res.status(500).json({ message: error.message, error: error.message });
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
        const { idToken, googleProfile, onboardingData } = req.body;

        let email = '';
        let googleId = '';
        let googleName = '';
        let googlePicture = '';

        // If an idToken is provided, verify with Google's tokeninfo API
        if (idToken) {
            try {
                const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
                if (googleRes.data && googleRes.data.email) {
                    email = googleRes.data.email.toLowerCase().trim();
                    googleId = googleRes.data.sub;
                    googleName = googleRes.data.name || '';
                    googlePicture = googleRes.data.picture || '';
                }
            } catch (err) {
                console.warn('Google tokeninfo verification warning:', err.message);
            }
        }

        // Fallback to client-provided googleProfile if supplied
        if (!email && googleProfile && googleProfile.email) {
            email = googleProfile.email.toLowerCase().trim();
            googleId = googleProfile.googleId || googleProfile.sub || '';
            googleName = googleProfile.name || '';
            googlePicture = googleProfile.picture || '';
        }

        if (!email) {
            return res.status(400).json({ message: 'Valid Google email is required.' });
        }

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
                return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
            }

            const normalizedRole = String(user.role || '').toLowerCase().trim().replace(/_/g, ' ');
            const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrator';

            if (isMaintenance && !isAdmin) {
                return res.status(503).json({ 
                    message: sysSettings.maintenanceMessage || 'Portal is currently undergoing system maintenance. Access is restricted.',
                    maintenanceMode: true
                });
            }

            // Link googleId and email if not linked yet
            let shouldSave = false;
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                shouldSave = true;
            }
            if (!user.email) {
                user.email = email;
                shouldSave = true;
            }
            if (shouldSave) {
                await user.save();
            }

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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

        // If user does not exist yet:
        // Did the user submit their onboarding profile completion form?
        if (!onboardingData) {
            return res.status(200).json({
                isNewUser: true,
                googleProfile: {
                    email,
                    name: googleName,
                    picture: googlePicture,
                    googleId
                }
            });
        }

        // User is completing onboarding:
        if (isMaintenance) {
            return res.status(503).json({ 
                message: 'Registration is temporarily disabled during system maintenance.',
                maintenanceMode: true
            });
        }

        const { fullName, address, contact, todaAssociation } = onboardingData;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: 'Full legal name is required.' });
        }
        if (!address || !address.trim()) {
            return res.status(400).json({ message: 'Barangay address in Gasan is required.' });
        }
        if (!contact || !contact.trim()) {
            return res.status(400).json({ message: 'Mobile contact number is required.' });
        }

        const normalizedContact = String(contact).trim();

        // Check if phone number is already used by another account
        const existingContact = await User.findOne({
            contact: { $regex: new RegExp(`^${normalizedContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (existingContact) {
            return res.status(400).json({ message: 'An account with this mobile number already exists. Please use a different contact number.' });
        }

        // Create new operator user with isVerified: true (NO OTP NEEDED FOR GOOGLE!)
        const randomPass = Math.random().toString(36).slice(-8) + 'G!' + Math.floor(Math.random() * 90 + 10);
        user = new User({
            name: fullName.trim(), // Edited full legal name!
            address: address.trim(),
            contact: normalizedContact,
            email: email,
            googleId: googleId || '',
            password: randomPass,
            role: 'operator',
            todaAssociation: todaAssociation || 'NON-TODA',
            isVerified: true, // Auto-verified!
            profilePic: googlePicture || '',
            authProvider: 'google'
        });

        await user.save();

        logAudit(req, {
            action: 'USER_REGISTERED_GOOGLE',
            targetType: 'User',
            targetId: user._id,
            details: { name: user.name, email: user.email, contact: user.contact, address: user.address, toda: user.todaAssociation }
        });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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
        res.status(500).json({ message: 'Google authentication error: ' + error.message });
    }
};