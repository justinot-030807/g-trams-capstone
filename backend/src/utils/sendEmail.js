const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL direct handshake is much faster than STARTTLS port 587
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 12000,
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
        throw new Error("Failed to process email delivery");
    }
};

module.exports = sendEmail;