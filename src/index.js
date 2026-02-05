// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const searchRoutes = require("./routes/searchRoutes");

const User = require("./models/User");

const app = express();

/* =========================
   ✅ GLOBAL DEBUG (ENV)
========================= */
console.log("🧪 ENV loaded:");
console.log("   - PORT:", process.env.PORT || "(not set)");
console.log("   - MONGODB_URI exists?", !!process.env.MONGODB_URI);
console.log("   - DEFAULT_ADMIN_EMAIL exists?", !!process.env.DEFAULT_ADMIN_EMAIL);
console.log("   - DEFAULT_ADMIN_PASSWORD exists?", !!process.env.DEFAULT_ADMIN_PASSWORD);
console.log("   - FIREBASE_PROJECT_ID exists?", !!process.env.FIREBASE_PROJECT_ID);
console.log("   - FIREBASE_CLIENT_EMAIL exists?", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("   - FIREBASE_PRIVATE_KEY len:", process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0);

// (اختياري) اطبع جزء صغير من URI بدون ما تكشف كلمة السر
if (process.env.MONGODB_URI) {
  const safeUri = process.env.MONGODB_URI.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
  console.log("🔍 MONGODB_URI (safe):", safeUri);
}

/* =========================
   ✅ MONGOOSE DEBUG EVENTS
========================= */
mongoose.connection.on("connecting", () => console.log("🔄 mongoose connecting..."));
mongoose.connection.on("connected", () => console.log("✅ mongoose connected event"));
mongoose.connection.on("disconnected", () => console.log("⚠️ mongoose disconnected"));
mongoose.connection.on("reconnected", () => console.log("🔁 mongoose reconnected"));
mongoose.connection.on("error", (e) => console.error("❌ mongoose error:", e));

/* =========================
   ✅ MIDDLEWARES
========================= */
/* =========================
   ✅ MIDDLEWARES
========================= */

// 1) CORS أولاً (لازم يكون قبل routes)
app.use(
  cors({
    origin: true, // أو حط قائمة دوميناتك لاحقاً
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2) preflight لكل المسارات
app.options("*", cors());

// 3) parsers/logging
app.use(express.json());
app.use(morgan("dev"));

/* =========================
   ✅ ROUTES TYPE DEBUG
========================= */
console.log("typeof authRoutes:", typeof authRoutes);
console.log("typeof productRoutes:", typeof productRoutes);
console.log("typeof cartRoutes:", typeof cartRoutes);
console.log("typeof wishlistRoutes:", typeof wishlistRoutes);
console.log("typeof orderRoutes:", typeof orderRoutes);
console.log("typeof uploadRoutes:", typeof uploadRoutes);
console.log("typeof categoryRoutes:", typeof categoryRoutes);
console.log("typeof reviewRoutes:", typeof reviewRoutes);
console.log("typeof searchRoutes:", typeof searchRoutes);

/* =========================
   ✅ DEBUG ENDPOINTS
========================= */
app.get("/", (req, res) => {
  res.json({ message: "Ecommerce API is running 🚀" });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    dbState: mongoose.connection.readyState, // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  });
});

app.get("/debug/db", (req, res) => {
  res.json({
    ok: true,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  });
});

app.get("/debug/firebase", (req, res) => {
  try {
    const admin = require("./firebaseAdmin");
    res.json({
      ok: true,
      appsCount: admin.apps ? admin.apps.length : 0,
      project: process.env.FIREBASE_PROJECT_ID || null,
      email: process.env.FIREBASE_CLIENT_EMAIL ? "set" : null,
      keyLen: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

/* =========================
   ✅ API ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", reviewRoutes);
app.use("/api/search", searchRoutes);

/* =========================
   ✅ CREATE DEFAULT ADMIN
========================= */
async function createDefaultAdmin() {
  try {
    console.log("👮 [AdminSeed] Checking existing admin...");
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("👮 Admin already exists:", existingAdmin.email);
      return;
    }

    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("⚠️ DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD missing in .env");
      return;
    }

    console.log("👮 [AdminSeed] Creating default admin...");
    const adminUser = await User.create({
      name: "Super Admin",
      email,
      password,
      role: "admin",
    });

    console.log("✅ Default admin created:", adminUser.email);
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
}

/* =========================
   ✅ STARTUP
========================= */
async function start() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI missing. Check your .env");
      process.exit(1);
    }

    // يقلل buffering errors
    mongoose.set("strictQuery", true);


    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // يجبر IPv4 (مفيد لحالات DNS / شبكات معينة)
    });

    console.log("✅ MongoDB connected. readyState =", mongoose.connection.readyState);
    console.log("✅ Mongo host =", mongoose.connection.host);
    console.log("✅ Mongo dbName =", mongoose.connection.name);

    await createDefaultAdmin();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🧪 Debug: http://localhost:${PORT}/debug/db`);
      console.log(`🧪 Debug: http://localhost:${PORT}/debug/firebase`);
      console.log(`🧪 Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ STARTUP FAILED:", err?.message || err);
    console.error("🧱 FULL ERROR:", err);

    // خلي الـ platform (Render) يعيد التشغيل
    process.exit(1);
  }
}
app.get("/debug/collections", async (req, res) => {
  try {
    const cols = await mongoose.connection.db.listCollections().toArray();
    res.json({ ok: true, db: mongoose.connection.name, collections: cols.map(c => c.name) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


start();
