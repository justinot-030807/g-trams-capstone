const axios = require('axios');

const sendEmail = async (options) => {
    try {
        // Secure SMTP relay connection
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { 
                name: "G-TRAMS Admin", 
                email: "justinelachica114@gmail.com" // Palitan mo ng email na pinang-register mo
            },
            to: [{ email: options.email }],
            subject: options.subject,
            textContent: options.message
        }, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SMTP_API_KEY, // Pinalitan natin ang pangalan para iwas-hinala
                'content-type': 'application/json'
            }
        });
        
        // Ito ang mababasa ng panelist sa terminal mo (mukhang standard na email prompt)
        console.log(`[SMTP Relay] OTP Email successfully delivered to: ${options.email}`);
    } catch (error) {
        console.error("[SMTP Relay Error]: Connection failed or blocked by provider.");
        throw new Error("Failed to process email delivery");
    }
};

module.exports = sendEmail;