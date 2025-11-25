// src/routes/uploadRoutes.js
const express = require('express');
const axios = require('axios');
const sharp = require('sharp');        // لضغط الصورة
const multer = require('multer');      // لالتقاط أخطاء Multer
const upload = require('../middleware/uploadImage'); // ميدلوير الرفع المشترك

const router = express.Router();

/**
 * @route POST /api/uploads/imgbb
 * @desc  رفع صورة إلى ImgBB بعد ضغطها
 * @access Public (أو حسب ما بدك في الفرونت)
 */
router.post('/imgbb', upload.single('image'), async (req, res, next) => {
  try {
    console.log('➡️ /api/uploads/imgbb HIT');
    console.log(
      'file:',
      req.file && {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    );

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: 'IMGBB_API_KEY missing in server' });
    }

    // 1) البفر الخام من multer
    const inputBuffer = req.file.buffer;

    // 2) نضغط / نعيد تحجيم الصورة قبل الرفع
    const compressedBuffer = await sharp(inputBuffer)
      .rotate() // يصلّح الـ orientation
      .resize({
        width: 1200,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 75,
        mozjpeg: true,
      })
      .toBuffer();

    console.log('📦 Original size:', req.file.size, 'bytes');
    console.log('📦 Compressed size:', compressedBuffer.length, 'bytes');

    // 3) نحول الصورة المضغوطة إلى base64
    const base64Image = compressedBuffer.toString('base64');

    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    // 4) نرفع النسخة المضغوطة لـ ImgBB
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      formData
    );

    if (!response.data?.data?.url) {
      console.error('❌ Invalid ImgBB response:', response.data);
      return res.status(500).json({
        message: 'Invalid response from ImgBB',
        raw: response.data,
      });
    }

    const imageUrl = response.data.data.url;
    console.log('✅ ImgBB URL:', imageUrl);

    return res.json({ imageUrl });
  } catch (error) {
    console.error(
      'ImgBB upload error:',
      error.response?.data || error.message
    );
    return next(error); // نمرر للـ error middleware
  }
});

// 🧱 ميدل وير خاص بأخطاء Multer (مثل File too large)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Image too large. Max size is 25MB (before compression).',
      });
    }

    return res.status(400).json({ message: err.message });
  }

  // أخطاء أخرى
  console.error('Upload route error middleware:', err);
  return res.status(500).json({ message: 'Upload failed', error: err.message });
});

module.exports = router;
