const axios = require('axios');
const FormData = require('form-data');

const CLIP_SERVER_URL = process.env.CLIP_SERVER_URL || 'http://localhost:8000';

// ------------------------------
// 1) URL → embedding
// ------------------------------
async function getImageEmbeddingFromUrl(imageUrl) {
  const res = await axios.post(`${CLIP_SERVER_URL}/embed/url`, { url: imageUrl });
  return res.data.embedding;
}

// ------------------------------
// 2) Buffer → embedding (شغال 100%)
// ------------------------------
async function getImageEmbeddingFromBuffer(buffer, mimetype = 'image/jpeg') {
  const formData = new FormData();

  // ✔ بدال Blob → استعمل Buffer مباشر
  formData.append('image', buffer, {
    filename: 'upload.jpg',
    contentType: mimetype,
  });

  const res = await axios.post(
    `${CLIP_SERVER_URL}/embed/file`,
    formData,
    { headers: formData.getHeaders() }
  );

  return res.data.embedding;
}

module.exports = {
  getImageEmbeddingFromUrl,
  getImageEmbeddingFromBuffer,
};
