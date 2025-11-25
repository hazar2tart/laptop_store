// src/config/claude.js
const axios = require('axios');

const claude = axios.create({
  baseURL: 'https://api.anthropic.com/v1/messages',
  headers: {
    'x-api-key': process.env.CLAUDE_API_KEY,      // ضيفي CLAUDE_API_KEY في .env
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
});

module.exports = claude;
