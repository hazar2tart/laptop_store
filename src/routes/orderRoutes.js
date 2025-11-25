const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart'); // 👈 مهم

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create order from user's cart (Cart model)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1) نجيب الـ cart من collection Cart
    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2) نشيل أي عنصر منتجه null (محذوف مثلاً)
    const validItems = cart.items.filter((item) => item.product);

    if (validItems.length === 0) {
      // نفرغ الكارت لأن كله خراب
      cart.items = [];
      await cart.save();
      return res.status(400).json({
        message: 'No valid products in cart. Some products may have been removed.',
      });
    }

    // 3) نبني items للأوردر
    const items = validItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 4) نقرأ العنوان من body
    const { shippingAddress } = req.body || {};

    if (!shippingAddress) {
      return res.status(400).json({ message: 'shippingAddress is required' });
    }

    if (!shippingAddress.fullName || !shippingAddress.phone) {
      return res
        .status(400)
        .json({ message: 'fullName and phone are required' });
    }

    // 5) إنشاء الأوردر
    const order = await Order.create({
      user: userId,
      items,
      totalPrice,
      status: 'pending',
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
    });

    // 6) populate قبل ما نرجع
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product');

    // 7) نفرغ الكارت بعد نجاح الأوردر
    cart.items = [];
    await cart.save();

    return res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Create order error:', error.message, error.stack);
    return res
      .status(500)
      .json({ message: error.message || 'Server error' });
  }
});





/**
 * @route   GET /api/orders/my
 * @desc    Get current user's orders
 */
/**
 * @route   GET /api/orders/my
 * @desc    Get current user's orders
 */
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'items.product',
        populate: { path: 'category', select: 'name slug' }, // 🔥 هون
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders (admin)
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate({
        path: 'items.product',
        populate: { path: 'category', select: 'name slug' }, // 🔥 نفس الشي هون
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (admin)
 * body: { status }
 */
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
