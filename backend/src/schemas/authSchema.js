const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(2, 'Name must be at least 2 characters'),
        contact: z.string().min(5, 'Valid email or phone number is required'),
        address: z.string().min(5, 'Valid address is required'),
        todaAssociation: z.string().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['operator', 'toda president', 'toda_president']).default('operator'),
        authProvider: z.enum(['local', 'google']).default('local'),
        googleId: z.string().optional(),
        profilePic: z.string().optional(),
    })
});

const loginSchema = z.object({
    body: z.object({
        contact: z.string().min(1, 'Contact is required'),
        password: z.string().min(1, 'Password is required'),
    })
});

const forgotPasswordSchema = z.object({
    body: z.object({
        contact: z.string().min(1, 'Contact is required')
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema
};
