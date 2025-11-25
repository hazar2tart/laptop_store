const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ميدلوير: يتحقق إن المستخدم مسجل دخول
const protect = async (req, res, next) => {
  let token;

  // نتأكد إن فيه Authorization header يبدأ بـ "Bearer "
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // نأخذ التوكن بدون كلمة Bearer
      token = req.headers.authorization.split(' ')[1];

      // نفك التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!token) {
    return res.status(400).json({ message: 'Not authorized, no token' });
  }
      // نجيب بيانات المستخدم من DB بدون الباسورد
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // كل شيء تمام → نكمل للـ route
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ميدلوير: يسمح فقط للـ admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access only' });
};

module.exports = { protect, adminOnly };
