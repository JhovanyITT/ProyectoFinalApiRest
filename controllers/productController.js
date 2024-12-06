const Product = require('../models/productModel');
const facturapi = require('../apis/facturapi');

// Obtener todos los productos
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un producto
const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const facturapiProduct = await facturapi.createProduct(product);
    product.facturapiid = facturapiProduct.id;

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
  try {
    const { _id } = req.params;
    const updates = req.body;
    
    let product = await Product.findById(_id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const updatedProduct = await Product.findByIdAndUpdate(_id, updates, { new: true });
    await facturapi.updateProduct(product.facturapiid, updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
  try {
    const { _id } = req.params;
    
    let product = await Product.findById(_id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    await facturapi.deleteProduct(product.facturapiid);
    await Product.findByIdAndDelete(_id);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };