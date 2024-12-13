const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe ( `${process.env.STRIPE_SECRET_API_KEY}`);

async function createPayment(amount, currency, payment_method){
    const payment = {
        amount,  
        currency,  
        payment_method_types: ['card'],  
        payment_method,  
        confirmation_method: 'manual',  
        confirm: true
    };
    return await stripe.paymentIntents.create(payment);
};

module.exports = {createPayment};