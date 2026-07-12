const User = require('../models/userModel'); 
const jwt = require('jsonwebtoken'); 
const sendEmail = require('../utils/sendEmail'); 
const axios = require('axios'); // Para sa Semaphore SMS

// 1. REGISTER & SEND OTP
exports.register = async (req, res) => {
    try {
        // BINAGO: Idinagdag ang todaAssociation
        const { name, address, contact, password, role, todaAssociation } = req.body;
        
        let user = await User.findOne({ contact });
        if (user) {
            if (user.isVerified) return res.status(400).json({ message: 'Contact already registered and verified' });
            await User.deleteOne({ contact }); 
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user = new User({
            name, address, contact, password,
            role: role || 'operator',
            todaAssociation: todaAssociation || 'NON-TODA', // <-- ISINAVE DITO
            isVerified: false,
            otp,
            otpExpire: Date.now() + 10 * 60 * 1000 
        });
        
        await user.save();

        if (contact.includes('@')) {
            await sendEmail({ email: contact, subject: 'G-TRAMS: Account Verification OTP', message: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.` });
        } else {
            await axios.post('https://api.semaphore.co/api/v4/messages', { apikey: 'b95803ab99f6bc85ea217d2e057c5f34', number: contact, message: `G-TRAMS: Ang iyong verification code ay ${otp}. Huwag itong i-share kaninuman.` });
        }
        res.status(201).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("REGISTER ERROR:", error); // <-- Dinagdag para makita sa Render Logs
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
// 2. VERIFY OTP
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

// 3. LOGIN (NILAGYAN NA NG HARANG PARA SA DEACTIVATED ACCOUNTS)
exports.login = async (req, res) => {
    try {
        const { contact, password } = req.body; 
        const user = await User.findOne({ contact });
        
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (!user.isVerified) return res.status(400).json({ message: 'Please verify your account first.' });
        
        // HARANG: Kapag ang isActive ay naging false, i-block agad ang login!
        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Login error' });
    }
};

// 4. GET USERS
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

// 5. FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    try {
        const { contact } = req.body; 
        const user = await User.findOne({ contact });
        if (!user) return res.status(404).json({ message: 'Contact is not registered.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        try {
            if (contact.includes('@')) {
            // Walang bypass! Kapag nag-fail, mag-e-error talaga siya gaya ng dapat mangyari.
            await sendEmail({ 
                email: contact, 
                subject: 'G-TRAMS: Account Verification OTP', 
                message: `Your OTP for G-TRAMS registration is: ${otp}\n\nThis is valid for 10 minutes only.` 
            });
            res.status(201).json({ message: 'OTP sent successfully' });
        } else {
            // SMS Logic (Gumagana pa rin ito kapag may credits ka na)
            await axios.post('https://api.semaphore.co/api/v4/messages', { 
                apikey: 'b95803ab99f6bc85ea217d2e057c5f34', 
                number: contact, 
                message: `G-TRAMS: Ang iyong verification code ay ${otp}. Huwag itong i-share kaninuman.` 
            });
            res.status(201).json({ message: 'OTP sent successfully via SMS' });
        }
            res.status(200).json({ message: 'OTP sent successfully.' });
        } catch (err) {
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Error sending OTP.' });
        }
    } catch (error) {
        console.error("REGISTER ERROR:", error); // <-- Dinagdag para makita sa Render Logs
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// 6. RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { contact, otp, newPassword } = req.body; 
        const user = await User.findOne({
             contact,
             otp,
             otpExpire: { $gt: Date.now() }
         });
        if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successful. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// 7. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password.' });
        
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// 8. VERIFY ADMIN PASSWORD
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

// 9. UPDATE USER
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).select('-password');
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};

// 10. DELETE USER
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// 11. UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { name, address, contact, todaAssociation } = req.body;
        
        let updateData = { name, address };
        if (contact) updateData.contact = contact;
        if (todaAssociation) updateData.todaAssociation = todaAssociation; // Sinasalo na rito yung galing frontend
        
        if (req.file) {
            updateData.profilePic = req.file.path; 
        }

        // BINAGO: Pinalitan ng returnDocument: 'after' para mawala yung Mongoose Warning
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
// 12. TOGGLE ACCOUNT STATUS (ACTIVATE / DEACTIVATE)
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot deactivate an administrator account.' });
        }

        const newStatus = user.isActive === false ? true : false; 

        // Gumagamit tayo ng findByIdAndUpdate para ma-bypass ang validation
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: newStatus },
            { new: true }
        );

        res.status(200).json({ 
            message: `User account successfully ${updatedUser.isActive ? 'activated' : 'deactivated'}.`,
            user: updatedUser 
        });
    } catch (error) {
        res.status(500).json({ message: error.message, error: error.message });
    }
};

// 13. GET CURRENT USER PROFILE (Ibinabalik natin para gumana ang Autofill!)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};