const axios = require('axios');

const sendEmail = async (options) => {
    try {
        const apiKey = process.env.SMTP_API_KEY;
        
        if (!apiKey) {
            throw new Error("SMTP_API_KEY is missing in environment variables.");
        }

        const payload = {
            sender: {
                name: "G-TRAMS Admin",
                email: "justinelachica114@gmail.com" // Must use verified sender in Brevo
            },
            to: [
                {
                    email: options.email
                }
            ],
            subject: options.subject,
            textContent: options.message,
            htmlContent: options.html || undefined
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            }
        });

        console.log(`[Brevo API] Email successfully delivered to: ${options.email}`);
        return response.data;
    } catch (error) {
        const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("[Email API Error]:", errorDetail);
        throw new Error(`Failed to send email via Brevo API. Reason: ${errorDetail}`);
    }
};

module.exports = sendEmail;