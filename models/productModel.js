const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, enum: ['ELECTRONICS', 'CLOTHING', 'FOOD', 'TOYS'], required: true },
  brand: { type: String, required: true }, 
  stock: { type: Number, default: 0 },
  creationDate: { type: Date, default: Date.now },
  imgs: [String],
  facturapiid: { type: String, required: true }
});

module.exports = mongoose.model('Product', productSchema);
