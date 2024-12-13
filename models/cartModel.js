const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productos: [
      {
        producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        cantidad: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, default: 0 },
    iva: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    estatus: { type: String, enum: ['activo', 'cerrado'], default: 'activo' },
    stripeId: {type: String},
    fecha_creacion: { type: Date, default: Date.now },
    fecha_cierre: { type: Date }
  });

  cartSchema.path('productos').schema.add({
    _id: false
  });

  module.exports = mongoose.model('shopcarts', cartSchema);