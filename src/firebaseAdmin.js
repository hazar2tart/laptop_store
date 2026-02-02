const admin = require("firebase-admin");

console.log("🧪 [Firebase] ENV project?", !!process.env.FIREBASE_PROJECT_ID);
console.log("🧪 [Firebase] ENV email?", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("🧪 [Firebase] ENV key len?", (process.env.FIREBASE_PRIVATE_KEY || "").length);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin initialized");
  } else {
    console.log("ℹ️ Firebase Admin already initialized");
  }
} catch (e) {
  console.log("❌ Firebase init ERROR:", e.message);
}

module.exports = admin;
