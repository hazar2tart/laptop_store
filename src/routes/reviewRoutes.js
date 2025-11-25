// routes/reviewRoutes.js
const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Get reviews for a product
 */
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Create a review
 */
router.post('/products/:productId/reviews', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, photos } = req.body;

    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // userName من الـ token (حسب الـ auth عندك)
    const userId = req.user._id;
    const userName = req.user.name || 'User';

    // ممكن تمنع تكرار التقييم من نفس اليوزر:
    let review = await Review.findOne({ product: productId, user: userId });

    if (review) {
      // 🔁 EDIT review
      review.rating = rating;
      review.comment = comment || '';
      review.photos = Array.isArray(photos) ? photos : [];
      await review.save();
    } else {
      // 🆕 CREATE review
      review = await Review.create({
        product: productId,
        user: userId,
        userName,
        rating,
        comment: comment || '',
        photos: Array.isArray(photos) ? photos : [],
      });
    }


    // 🔄 حدّث الـ ratingAverage و ratingCount في المنتج
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      product.ratingAverage = stats[0].avgRating;
      product.ratingCount = stats[0].count;
    } else {
      product.ratingAverage = 0;
      product.ratingCount = 0;
    }

    await product.save();

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
