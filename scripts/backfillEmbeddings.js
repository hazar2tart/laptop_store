const axios = require('axios'); 
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const connectDB = require('../src/config/db');

require('dotenv').config();


const CLIP_SERVER_URL = process.env.CLIP_SERVER_URL || 'http://127.0.0.1:8000';

async function run() {
  await connectDB();
  console.log('✅ Connected to MongoDB');

  const products = await Product.find();
  console.log('🔵 Found products:', products.length);

  let updated = 0;

  for (const p of products) {
    if (!p.imageUrl) {
      console.log('⏭ No imageUrl for', p.name);
      continue;
    }

    try {
      console.log(`🔵 Embedding product ${p._id} (${p.name}) ...`);

      const resp = await axios.post(`${CLIP_SERVER_URL}/embed/url`, { url: p.imageUrl });
      const emb = resp.data.embedding;

      if (!emb || !emb.length) {
        console.log('⚠️ empty embedding for', p.name);
        continue;
      }

      console.log('   ➜ embedding length:', emb.length);

      p.embedding = emb;        // 👈 field الرئيسي
      p.searchEmbedding = null; // نظف القديم لو موجود
      await p.save();

      updated++;
      console.log('✅ updated embedding for', p.name);
    } catch (e) {
      console.error('❌ error for', p.name, e.message);
    }
  }

  console.log('🎉 done. Updated:', updated);
  process.exit();
}

run();
