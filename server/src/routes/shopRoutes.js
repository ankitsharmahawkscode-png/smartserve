const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createOrder, getMyOrders } = require('../controllers/shopController');

// 👇 CHANGE THIS LINE 👇
const { protect } = require('../middleware/auth'); 

// Public routes
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Protected routes (Requires login)
router.post('/orders', protect, createOrder);
router.get('/orders/myorders', protect, getMyOrders);

module.exports = router;