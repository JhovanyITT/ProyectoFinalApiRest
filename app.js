const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
require('dotenv').config();

const app = express();

app.use(express.json());

mongoose.connect(`${process.env.MONGO_CLUSTER_URL}`)
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch((error) => console.error('Error al conectar a MongoDB:', error));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/carts',cartRoutes);


module.exports = app;