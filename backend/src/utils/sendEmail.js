const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Pwede ring subukan ang 'smtp.ipv4.gmail.com'
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        },
        // ITO ANG FIX PARA SA ENETUNREACH (IPv6 Error)
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