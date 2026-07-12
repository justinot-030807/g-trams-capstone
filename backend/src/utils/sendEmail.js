const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        // 1. Literal na tina-target natin ang IPv4 address ng Gmail para iwas ENETUNREACH
        host: 'smtp.ipv4.gmail.com', 
        // 2. Gagamitin natin ang Port 587 (Mas cloud-friendly kaysa 465)
        port: 587, 
        // 3. Dapat false kapag 587, pero gagamit pa rin tayo ng TLS
        secure: false, 
        requireTLS: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
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