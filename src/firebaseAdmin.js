const admin = require('firebase-admin');

if (!admin.apps.length) {
  console.log('🔥 Initializing Firebase Admin from ENV');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase ENV missing', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
    });
    throw new Error('Firebase Admin ENV variables are missing');
  }

  // مهم جدًا: معالجة \n
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('✅ Firebase Admin initialized successfully');
} else {
  console.log('ℹ️ Firebase Admin already initialized');
}

module.exports = admin;
