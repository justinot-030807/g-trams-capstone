const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.preprocess(
            (val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined),
            z.string().min(2, 'Name must be at least 2 characters').optional()
        ),
        fullName: z.preprocess(
            (val) => (typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined),
            z.string().min(2, 'Full name must be at least 2 characters').optional()
        ),
        contact: z.string().trim().min(5, 'Valid email or phone number is required'),
        address: z.string().trim().min(2, 'Valid address is required'),
        todaAssociation: z.string().trim().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().optional(),
        role: z.preprocess(
            (val) => {
                if (!val) return 'operator';
                if (typeof val === 'string') {
                    const clean = val.toLowerCase().trim().replace(/_/g, ' ');
                    return (clean === 'toda president' || clean === 'toda_president') ? 'toda president' : 'operator';
                }
                return 'operator';
            },
            z.enum(['operator', 'toda president']).default('operator')
        ).optional(),
        authProvider: z.enum(['local', 'google']).default('local'),
        googleId: z.string().optional(),
        profilePic: z.string().optional(),
    }).passthrough().refine(
        (data) => Boolean((data.name && data.name.length >= 2) || (data.fullName && data.fullName.length >= 2)),
        {
            message: 'Full name must be at least 2 characters',
            path: ['name']
        }
    )
});

const verifyOtpSchema = z.object({
    body: z.object({
        contact: z.string().trim().min(1, 'Contact is required'),
        otp: z.string().trim().min(4, 'Valid OTP code is required'),
    }).passthrough()
});

const loginSchema = z.object({
    body: z.object({
        contact: z.string().trim().min(1, 'Contact is required'),
        password: z.string().min(1, 'Password is required'),
    }).passthrough()
});

const forgotPasswordSchema = z.object({
    body: z.object({
        contact: z.string().trim().min(1, 'Contact is required')
    }).passthrough()
});

const googleAuthSchema = z.object({
    body: z.object({
        idToken: z.string().optional(),
        credential: z.string().optional(),
        token: z.string().optional(),
        accessToken: z.string().optional(),
        email: z.string().trim().optional(),
        googleProfile: z.any().optional(),
        onboardingData: z.any().optional()
    }).passthrough()
});

module.exports = {
    registerSchema,
    verifyOtpSchema,
    loginSchema,
    forgotPasswordSchema,
    googleAuthSchema
};

