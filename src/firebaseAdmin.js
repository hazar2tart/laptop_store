// src/firebaseAdmin.js
const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return admin;

  const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();

  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();

  console.log("🧪 [Firebase] project?", !!projectId);
  console.log("🧪 [Firebase] email?", !!clientEmail);
  console.log("🧪 [Firebase] keyLen(raw)?", privateKeyRaw.length);
  console.log("🧪 [Firebase] keyLen(final)?", privateKey.length);
  console.log("🧪 [Firebase] key starts?", privateKey.startsWith("-----BEGIN PRIVATE KEY-----"));
  console.log("🧪 [Firebase] key ends?", privateKey.endsWith("-----END PRIVATE KEY-----"));

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_* env vars");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase Admin initialized");
  return admin;
}

module.exports = initFirebase();
