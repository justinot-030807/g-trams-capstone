require('dotenv').config();
const sendEmail = require('./src/utils/sendEmail');

async function testEmail() {
    try {
        await sendEmail({
            email: 'gtrams.admin@gmail.com',
            subject: 'Test Email',
            message: 'This is a test email.'
        });
        console.log('Email sent successfully!');
    } catch (err) {
        console.error('Email failed to send:', err);
    }
}

testEmail();
