console.log("✅ SHOP ROUTES FILE IS LOADING");

const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createOrder, getMyOrders } = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');
// Your existing auth middleware

// Public routes
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Protected routes (Requires login)
router.post('/orders', protect, createOrder);
router.get('/orders/myorders', protect, getMyOrders);

module.exports = router;