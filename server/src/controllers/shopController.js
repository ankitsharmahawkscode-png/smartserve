const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get all active products
// @route   GET /api/v1/shop/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products.' });
  }
};

// @desc    Get single product
// @route   GET /api/v1/shop/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Create a new order (Checkout)
// @route   POST /api/v1/shop/orders
// @access  Private (Requires login)
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentId } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in cart.' });
    }

    // 1. Calculate total and verify prices/stock from DB (Never trust frontend prices)
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product || !product.isActive) {
        return res.status(404).json({ message: `Product ${item.product} not found.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.name}. Only ${product.stock} left.` });
      }

      totalAmount += product.price * item.quantity;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price, // Use DB price, not frontend price
      });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // 2. Create the order
    const order = await Order.create({
      user: req.user._id, // From auth middleware
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentId: paymentMethod === 'Online' ? paymentId : undefined,
      paymentStatus: paymentMethod === 'Online' ? 'Paid' : 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order
    });
  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({ message: 'Server error while placing order.' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/shop/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
};