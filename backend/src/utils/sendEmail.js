const axios = require('axios');

const maskEmail = (email) => {
    const str = String(email || '').trim();
    const atIdx = str.indexOf('@');
    if (atIdx <= 1) return '***';
    return `${str[0]}***@${str.slice(atIdx + 1)}`;
};

const redactEmailsInText = (text, targetEmail) => {
    let output = String(text || '');
    if (targetEmail) {
        const escaped = String(targetEmail).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        output = output.replace(new RegExp(escaped, 'gi'), maskEmail(targetEmail));
    }
    return output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (match) => maskEmail(match));
};

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

        console.log(`[Brevo API] Email successfully delivered to: ${maskEmail(options.email)}`);
        return response.data;
    } catch (error) {
        const rawDetail = error.response ? JSON.stringify(error.response.data) : error.message;
        const safeDetail = redactEmailsInText(rawDetail, options?.email);
        console.error(`[Email API Error] (recipient: ${maskEmail(options?.email)}):`, safeDetail);
        throw new Error(`Failed to send email via Brevo API. Reason: ${safeDetail}`);
    }
};

module.exports = sendEmail;