const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist
 */
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wishlist/toggle
 * @desc    Toggle wishlist (add/remove)
 * body: { productId }
 */
router.post('/toggle', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    const exists = user.wishlist.some((id) => id.toString() === productId);

    if (exists) {
      // remove
      user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== productId
      );
    } else {
      // add
      user.wishlist.push(productId);
    }

    await user.save();

    const finalUser = await User.findById(req.user._id).populate('wishlist');

    res.json(finalUser.wishlist);
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wishlist/add
 * @desc    Add product to wishlist
 */
router.post('/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    if (!user.wishlist.some((id) => id.toString() === productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    const populatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json(populatedUser.wishlist);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 */
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );

    await user.save();

    const populatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json(populatedUser.wishlist);
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/wishlist/check/:productId
 * @desc    Check if product is already in wishlist
 */
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    const exists = user.wishlist.some(
      (id) => id.toString() === productId
    );

    res.json({ exists });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
