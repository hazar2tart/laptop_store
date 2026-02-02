// src/firebaseAdmin.js
const admin = require("firebase-admin");

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ENV: ${name}`);
  return v;
}

if (!admin.apps.length) {
  try {
    const projectId = requireEnv("FIREBASE_PROJECT_ID");
    const clientEmail = requireEnv("FIREBASE_CLIENT_EMAIL");
    const privateKey = requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log("✅ Firebase Admin initialized (ENV)");
  } catch (err) {
    console.error("❌ Firebase Admin init failed:", err.message);
    // خلي السيرفر يشتغل حتى لو Firebase مش جاهز (بس OAuth رح يفشل)
    // إذا بدك تمنعي السيرفر يشتغل بدون Firebase، احذفي السطر الجاي:
    // throw err;
  }
}

module.exports = admin;
