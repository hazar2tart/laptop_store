const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const admin = require("../firebaseAdmin"); // عدّل المسار حسب مكان الملف

router.post("/oauth/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // ✅ تحقق من Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // decoded.email, decoded.name, decoded.uid
    const email = decoded.email;
    const name = decoded.name || "Google User";

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    // ✅ هات أو أنشئ User في MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "GOOGLE_OAUTH", // أو خليه null وعدّل schema
        role: "client",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({
      message: "Google OAuth failed",
      error: error.message,
    });
  }
});

// دالة توليد JWT من الـ user id
function generateToken(userId) {
  try {
    console.log('🔐 generateToken called with userId =', userId);

    // نطبع الـ secret ونشوف إذا موجود
    console.log('🔐 JWT_SECRET defined?', !!process.env.JWT_SECRET);

    // نطبع القيمة الخام اللي جاية من env بالضبط
    console.log(
      '🔐 raw JWT_EXPIRE from env =',
      JSON.stringify(process.env.JWT_EXPIRE)
    );

    // نحضّر expiresIn بشكل نظيف
    let expiresIn = process.env.JWT_EXPIRE;

    if (!expiresIn) {
      expiresIn = '30d';
      console.log('ℹ️ JWT_EXPIRE is empty, fallback to "30d"');
    } else {
      expiresIn = String(expiresIn).trim(); // نشيل مسافات و newlines
    }

    console.log('✅ final expiresIn used =', expiresIn, 'typeof =', typeof expiresIn);

    const payload = { id: userId };
    console.log('🔐 JWT payload =', payload);

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    console.log('✅ JWT token generated successfully');
    return token;

  } catch (err) {
    console.error('❌ ERROR inside generateToken:', err);
    // نرميها لنفس الـ catch في login عشان ترجع 500
    throw err;
  }
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
    res.status(500).json({
        message: 'Server error',
        error: error.message,
        stack: error.stack
      });
  }
});

module.exports = router;
  