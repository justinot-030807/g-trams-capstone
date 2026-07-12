const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Official address
        port: 465,              // Secure port para hindi i-throttle ni Google
        secure: true,           // Required kapag port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false // Iwas SSL error sa Render
        },
        family: 4 // ITO ANG MAGIC: Pipilitin niyang IPv4 ang gamitin para hindi ka magka-ENETUNREACH
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