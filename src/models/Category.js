const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String, // URL صورة الأيقونة (اختياري)
    },
    slug: {
      type: String,
      required: true,
      unique: true, // ex: "laptops", "mac", "hp"
    },
    // 👇 parent = الكاتيجوري الرئيسية (null لو كاتيجوري رئيسيّة)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
