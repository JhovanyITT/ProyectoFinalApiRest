const express = require('express');
const cartController = require('../controllers/cartController');
const router = express.Router();

router.get('/', cartController.getAllCarts);
router.get('/:id', cartController.getCartById);
router.get('/history/:id', cartController.getHistoryUserCarts);
router.post('/', cartController.createCart);
router.put('/addProduct', cartController.addProduct);
router.put('/removeProduct', cartController.removeProduct);
router.put('/closeCart', cartController.closeCart);

module.exports = router;
