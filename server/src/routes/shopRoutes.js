const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createOrder, getMyOrders } = require('../controllers/shopController');

// 👇 Import both 'protect' and 'authorize', and import the Product model 👇
const { protect, authorize } = require('../middleware/auth'); 
const Product = require('../models/Product'); 

// --- PUBLIC ROUTES ---
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// --- CUSTOMER ROUTES ---
router.post('/orders', protect, authorize('customer'), createOrder);
router.get('/orders/myorders', protect, getMyOrders);

// --- ADMIN ROUTES ---
// Create a product
router.post('/products', protect, authorize('admin'), async (req, res) => {
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