const twilio = require('twilio');
require('dotenv').config();

const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
const authToken =  `${process.env.TWILIO_AUTH_TOKEN}`;
const client = new twilio(accountSid, authToken);

async function sendSMS (telefono, message) {
    const notification = {
        body: message,
        from: `${process.env.TWILIO_FROM_NUMBER}`,
        to: telefono
    }
    return await client.messages.create(notification);
};

module.exports = {sendSMS};

