// src/middleware/uploadImage.js
const multer = require('multer');
const path = require('path');

// نخزن الملف في الذاكرة (RAM)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB للصورة الخام قبل الضغط
  },
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    // لو الـ mimetype ناقص أو application/octet-stream → نعتمد على الإكستنشن
    if (!mime || mime === 'application/octet-stream') {
      if (!allowedExt.includes(ext)) {
        return cb(new Error('Only image files are allowed'));
      }
      return cb(null, true);
    }

    // لو في mimetype → لازم يكون image/*
    if (!mime.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  },
});

module.exports = upload;
