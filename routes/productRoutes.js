const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');


router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:_id', productController.updateProduct);
router.delete('/:_id', productController.deleteProduct);

module.exports = router;

