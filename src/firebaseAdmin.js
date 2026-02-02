const admin = require("firebase-admin");

console.log("🔥 Firebase ENV CHECK", {
  project: !!process.env.FIREBASE_PROJECT_ID,
  email: !!process.env.FIREBASE_CLIENT_EMAIL,
  key: !!process.env.FIREBASE_PRIVATE_KEY,
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  console.log("✅ Firebase Admin initialized (ENV)");
}

module.exports = admin;
