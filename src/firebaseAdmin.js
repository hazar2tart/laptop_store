// src/firebaseAdmin.js
const admin = require("firebase-admin");

function must(name) {
  if (!process.env[name]) {
    throw new Error(`Missing ENV ${name}`);
  }
  return process.env[name];
}

if (!admin.apps.length) {
  const projectId = must("FIREBASE_PROJECT_ID");
  const clientEmail = must("FIREBASE_CLIENT_EMAIL");
  const privateKey = must("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase Admin initialized (ENV)");
}

module.exports = admin;
