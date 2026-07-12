const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // TINA-TARGET NATIN MISMO ANG SMTP SERVER NG GMAIL
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true kapag port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // Ito ang sikreto para hindi i-reject ng cloud server ang connection
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