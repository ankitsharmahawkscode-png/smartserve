const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createOrder, getMyOrders } = require('../controllers/shopController');

// Import both 'protect' and 'authorize', and import the Product model
const { protect, authorize } = require('../middleware/auth'); 
const Product = require('../models/Product'); 

// --- PUBLIC ROUTES ---
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// --- CUSTOMER ROUTES ---
router.post('/orders', protect, authorize('customer'), createOrder);
router.get('/orders/myorders', protect, getMyOrders);

// --- ADMIN ROUTES ---

// 👇 ADDED: Get ALL products for the Admin Panel (including hidden ones) 👇
router.get('/admin/products', protect, authorize('admin'), async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a product
router.post('/admin/products', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product
router.put('/admin/products/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete('/admin/products/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;