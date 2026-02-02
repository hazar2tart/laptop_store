// src/firebaseAdmin.js
const admin = require("firebase-admin");

let initialized = false;

function getAdmin() {
  if (initialized && admin.apps.length) return admin;

  const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .trim();

  console.log("🧪 [Firebase] init request");
  console.log("🧪 [Firebase] apps before:", admin.apps.length);
  console.log("🧪 [Firebase] project?", !!projectId);
  console.log("🧪 [Firebase] email?", !!clientEmail);
  console.log("🧪 [Firebase] keyLen:", privateKey.length);

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

  initialized = true;
  console.log("✅ Firebase Admin initialized. apps now:", admin.apps.length);
  return admin;
}

module.exports = getAdmin;
