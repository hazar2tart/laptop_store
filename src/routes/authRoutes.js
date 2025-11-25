const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// دالة توليد JWT من الـ user id
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,              // لازم يكون موجود في .env
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
}

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('🟦 REGISTER BODY:', req.body);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 👇 لا تشفّر هون، خليها plain
    const user = await User.create({
      name,
      email,
      password,     // 👈 عادي
      role: 'client',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('REGISTER error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔵 LOGIN BODY:', req.body);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    console.log('🟡 USER FROM DB:', user);

    if (!user) {
      console.log('❌ No user with this email');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('🟣 Password compare:', {
      enteredPassword: password,
      dbPassword: user.password,
      typeofEntered: typeof password,
      typeofDb: typeof user.password,
    });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🟢 isMatch =', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
