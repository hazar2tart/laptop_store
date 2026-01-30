// src/index.js
require('dotenv').config();

console.log('🔍 MONGODB_URI from .env =', process.env.MONGODB_URI);
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const User = require('./models/User');
const searchRoutes = require('./routes/searchRoutes');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// فقط للتشخيص: نطبع نوع كل راوتر
console.log('typeof authRoutes:', typeof authRoutes);
console.log('typeof productRoutes:', typeof productRoutes);
console.log('typeof cartRoutes:', typeof cartRoutes);
console.log('typeof wishlistRoutes:', typeof wishlistRoutes);
console.log('typeof orderRoutes:', typeof orderRoutes);
console.log('typeof uploadRoutes:', typeof uploadRoutes);

// اتصال DB + إنشاء admin
connectDB().then(() => {
  createDefaultAdmin();
});

// دالة لإنشاء أدمن افتراضي
async function createDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('👮 Admin already exists:', existingAdmin.email);
      return;
    }

    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('⚠️ DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD missing in .env');
      return;
    }

    const adminUser = await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'admin',
    });

    console.log('✅ Default admin created:', adminUser.email);
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', reviewRoutes);
app.use('/api/search', searchRoutes);
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce API is running 🚀' });
});
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    ok: true,
    dbState: mongoose.connection.readyState
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
