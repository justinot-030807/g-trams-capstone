const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports like 587
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"G-TRAMS Admin" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html // optionally support HTML
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP Relay] Email successfully delivered to: ${options.email} (Message ID: ${info.messageId})`);
        return info;
    } catch (error) {
        console.error("[SMTP Relay Error]: Connection failed or blocked by provider.", error.message);
        throw new Error(error.message || "Failed to process email delivery");
    }
};

module.exports = sendEmail;