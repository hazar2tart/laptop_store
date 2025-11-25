const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 🛒 schema صغير لعنصر واحد في السلة
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false } // ما نحتاج id لكل عنصر كارت
);

// 👤 schema تبع اليوزر
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'client',
    },
    cart: [cartItemSchema], // 🛒 سلة المشتريات
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ], // ⭐ المفضلة
  },
  {
    // ✅ هون مكان timestamps الصح (الأوبشنز)
    timestamps: true,
  }
);

// قبل الحفظ نعمل hash للباسورد
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ميثود لمقارنة الباسورد
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
