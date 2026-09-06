const axios = require('axios');

const sendEmail = async (options) => {
    try {
        // Send transactional email via Brevo API
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { 
                name: "G-TRAMS Admin", 
                email: "justinelachica114@gmail.com"
            },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message
        }, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SMTP_API_KEY,
                'content-type': 'application/json'
            }
        });
        
        // Log delivery confirmation
        console.log(`[SMTP Relay] OTP Email successfully delivered to: ${options.email}`);
    } catch (error) {
        console.error("[SMTP Relay Error]: Connection failed or blocked by provider.");
        throw new Error("Failed to process email delivery");
    }
};

module.exports = sendEmail;