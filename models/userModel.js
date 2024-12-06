const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombreCompleto: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    direccion: { type: String, required: false },
    telefono: String,
    fechaRegistro: { type: Date, default: Date.now },
    tipoUsuario: { type: String, enum: ['Cliente', 'Admin'], default: 'Cliente' },
    metodoPagoPreferido: { type: String, enum: ['PayPal', 'CreditCard', 'DebitCard', 'ApplePay', 'Mercado Pago'] },
    facturapiid: { type: String } 
});

module.exports = mongoose.model('User', userSchema);
