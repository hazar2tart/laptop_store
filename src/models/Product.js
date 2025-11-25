// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },

    description: { type: String, default: '' },

    imageUrl: { type: String, default: '' },
    images: [{ type: String }],

    stock: { type: Number, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    categoryIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],

    colors: [{ type: String }],
    discountPercent: { type: Number, default: 0 },
  embedding: {
    type: [Number],   // array of floats
    default: [],
  },

    // ⭐⭐ NEW: التقييمات ملخّصة على مستوى المنتج
    ratingAverage: { type: Number, default: 0 }, // من 1 إلى 5
    ratingCount: { type: Number, default: 0 },   // عدد التقييمات
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('finalPrice').get(function () {
  if (!this.discountPercent || this.discountPercent <= 0) return this.price;
  const p = this.price * (1 - this.discountPercent / 100);
  return Math.round(p * 100) / 100;
});

module.exports = mongoose.model('Product', productSchema);
