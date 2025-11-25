// scripts/indexProductsEmbeddings.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Product = require('../src/models/Product');
const openai = require('../src/config/claude');

async function getTextEmbedding(text) {
  const resp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return resp.data[0].embedding;
}

async function main() {
  await connectDB();

  const products = await Product.find();
  console.log(`Found ${products.length} products`);

  for (const p of products) {
    try {
      const text = [
        p.name || '',
        p.description || '',
        // حطي هنا أي حقول إضافية تحبي تدخل بالبحث
      ].join(' ');

      if (!text.trim()) {
        console.log(`Skipping product ${p._id} – no text`);
        continue;
      }

      console.log(`Embedding product: ${p._id} / ${p.name}`);
      const embedding = await getTextEmbedding(text);

      p.searchEmbedding = embedding;
      await p.save();
    } catch (e) {
      console.error(`Error embedding product ${p._id}:`, e.message);
    }
  }

  console.log('✅ Done indexing products');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
