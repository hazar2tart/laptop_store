// src/routes/searchRoutes.js
const express = require('express');
const upload = require('../middleware/uploadImage');
const Product = require('../models/Product');
const axios = require('axios');
const FormData = require('form-data');   // 👈 مهم جداً

const router = express.Router();
// 🔍 Debug route: يشوف كم منتج عنده embedding
// 🔍 Debug route: يشوف حالة الـ embeddings في الـ DB
router.get('/visual/debug', async (req, res) => {
  try {
    const total = await Product.countDocuments();

    const withEmbedding = await Product.countDocuments({
      embedding: { $exists: true },
    });

    const sample = await Product.findOne({
      embedding: { $exists: true },
    })
      .select('name imageUrl embedding')
      .lean();

    return res.json({
      totalProducts: total,
      productsWithEmbeddingField: withEmbedding,
      sampleName: sample?.name,
      sampleImageUrl: sample?.imageUrl,
      sampleIsArray: Array.isArray(sample?.embedding) || false,
      sampleEmbeddingLength: Array.isArray(sample?.embedding)
        ? sample.embedding.length
        : null,
    });
  } catch (e) {
    console.error('🔴 /visual/debug error:', e);
    return res.status(500).json({ message: 'debug error', error: e.message });
  }
});


function cosineSimilarity(a, b) {
  // ✅ حماية: اذا وحدة من الاثنين مش Array أو الطول مختلف → رجّع -1
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return -1;
  }

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!denom || !isFinite(denom)) return -1;

  const score = dot / denom;
  return isFinite(score) ? score : -1;
}

router.post('/visual', upload.single('image'), async (req, res) => {
  try {
    console.log('🟦 [/visual] hit');

    if (!req.file) {
      console.log('🔴 no file');
      return res.status(400).json({ message: 'image is required' });
    }

    console.log('📷 file:', {
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });

    // 1) نجيب الـ embedding تبع الصورة المرفوعة
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname || 'scan.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });

    const clipResp = await axios.post('http://127.0.0.1:8000/embed/file', formData, {
      headers: formData.getHeaders(),
    });

    const queryEmbedding = clipResp.data.embedding;
    console.log('🧠 queryEmbedding length:', queryEmbedding.length);

    // 2) نجيب المنتجات اللي عندها embedding فعلي
    let products = await Product.find({
      $or: [
        { embedding: { $exists: true, $type: 'array' } },
        { searchEmbedding: { $exists: true, $type: 'array' } },
      ],
    })
      .populate('category', 'name')
      .populate('categoryIds', 'name')
      .lean();

    console.log('📦 products with embedding field:', products.length);

    // 2bis) فلترة المنتجات: لازم يكون عندها array بنفس طول queryEmbedding
    products = products.filter((p) => {
      const emb = Array.isArray(p.embedding) && p.embedding.length
        ? p.embedding
        : Array.isArray(p.searchEmbedding) && p.searchEmbedding.length
        ? p.searchEmbedding
        : null;

      if (!emb) return false;
      if (emb.length !== queryEmbedding.length) {
        console.log(
          '⚠️ skip product length mismatch',
          p.name,
          'embLen =',
          emb.length,
          'vs query =',
          queryEmbedding.length
        );
        return false;
      }

      // خليه متوفر لحساب السكور
      p._usableEmbedding = emb;
      return true;
    });

    console.log('✅ valid products for similarity:', products.length);

    if (!products.length) {
      console.log('⚠️ no valid embedding products after filter');
      return res.json([]); // لا ترجع أي برودكت بدل ما ترجع واحد غلط
    }

    // 3) نحسب التشابه
    const scored = products.map((p) => {
      const score = cosineSimilarity(queryEmbedding, p._usableEmbedding);
      return { product: p, score };
    });

    // 4) نرتبهم و نحط threshold
    scored.sort((a, b) => b.score - a.score);

    console.log(
      '🏆 top scores:',
      scored.slice(0, 5).map((s) => ({
        name: s.product.name,
        score: s.score.toFixed(3),
      }))
    );

    const MIN_SIMILARITY = 0.20; // مثلاً
    const topProducts = scored
      .filter((s) => s.score >= MIN_SIMILARITY && isFinite(s.score))
      .slice(0, 20)
      .map((s) => s.product);

    if (!topProducts.length) {
      console.log('⚠️ no product above threshold, returning []');
      return res.json([]);
    }

    return res.json(topProducts);
  } catch (error) {
    console.error(
      '🔴 Visual search error:',
      error.response?.data || error.message || error
    );
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
      raw: error.response?.data,
    });
  }
});


module.exports = router;
