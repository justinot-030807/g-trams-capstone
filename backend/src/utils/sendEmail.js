const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        // Binalik natin sa official na address ng Gmail
        host: 'smtp.gmail.com', 
        port: 587, 
        secure: false, 
        requireTLS: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        // ITO ANG MAGIC: Pinipilit nito ang Node.js na gumamit ng IPv4 para iwas timeout at ENETUNREACH!
        family: 4 
    });

    const mailOptions = {
        from: 'G-TRAMS Admin <no-reply@gasan.gov.ph>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;