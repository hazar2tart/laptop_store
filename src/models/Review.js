// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // عندك أصلاً User من الـ auth
      required: true,
    },
    userName: {
      type: String, // نخزن الاسم وقت التقييم عشان لو تغيّر بعدين
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },

    // 🖼 صور ملحقة بالتعليق
    photos: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Review', reviewSchema);
