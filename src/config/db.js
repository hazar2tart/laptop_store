// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined');
    return; // ❌ لا تطفّي السيرفر
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // يمنع التعليق الطويل
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // ❌ لا process.exit على Render
  }
};

// Logs مفيدة جدًا على Render
mongoose.connection.on('connected', () =>
  console.log('🟢 MongoDB state: connected')
);
mongoose.connection.on('disconnected', () =>
  console.log('🟡 MongoDB state: disconnected')
);
mongoose.connection.on('error', (e) =>
  console.log('🔴 MongoDB state: error', e.message)
);

module.exports = connectDB;
