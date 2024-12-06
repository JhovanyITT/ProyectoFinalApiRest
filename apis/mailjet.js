const mailjet = require('node-mailjet');
require('dotenv').config();

const client = mailjet.apiConnect(
    `${process.env.MAILJET_FIRST_API_KEY}`,
    `${process.env.MAILJET_SECOND_API_KEY}`
);

const sendEmail = async (email, subject, htmlContent) => {
    try{
        const request = await client.post('send', { version: 'v3.1'}).request({
            Messages: [
                {
                    From: {
                        Email: 'alazamaralde@ittepic.edu.mx',
                        Name: 'Instituto Tecnologico de Tepic',
                    },
                    To: [
                        {
                            Email: email,
                            Name: email,
                        },
                    ],
                    Subject: subject,
                    HTMLPart: htmlContent,
                },
            ],
        });
        console.log(`Email sent successfully: ${request.body.Messages[0].Status}`);
    }catch(error){
        console.error('Error al enviar el correo:', error.response ? error.response.body : error);
    }
};

module.exports = { sendEmail };