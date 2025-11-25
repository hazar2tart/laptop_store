const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

require('dotenv').config();
const connectDB = require('../config/db');

async function run() {
  await connectDB();

const products = await Product.find();
for (const p of products) {
  if (!p.imageUrl) continue;

  try {
    const resp = await axios.post('http://127.0.0.1:8000/embed/url', { url: p.imageUrl });
    const emb = resp.data.embedding;

    if (!emb || !emb.length) {
      console.log('⚠️ empty embedding for', p.name);
      continue;
    }

    p.embedding = emb;        // 👈 خليه field الأساسي
    p.searchEmbedding = null; // (اختياري) نظفي القديم
    await p.save();

    console.log('✅ updated embedding for', p.name, emb.length);
  } catch (e) {
    console.error('❌ error for', p.name, e.message);
  }
}

  console.log('🎉 done');
  process.exit();
}

run();
