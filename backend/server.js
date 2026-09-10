import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import orderRoute from "./routes/order.js";
import catalogRoute from "./routes/catalog.js";

dotenv.config();

// ESM tidak punya __dirname bawaan — direkonstruksi manual, sama seperti
// pola yang sudah dipakai di routes/catalog.js.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// --- Middleware ---
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// --- Static files: foto produk keychain ---
// Semua file di backend/public/images/keychains/ otomatis bisa diakses
// publik lewat GET /images/keychains/<filename>. Folder ini yang dipakai
// catalog.js untuk membangun URL gambar penuh tiap item katalog.
const IMAGES_ROOT = path.join(__dirname, "public/images");
app.use(
  "/images",
  express.static(IMAGES_ROOT, {
    maxAge: "7d", // gambar produk jarang berubah, aman di-cache agak lama
    fallthrough: true, // kalau file tidak ada, lanjut ke fallback di bawah alih-alih 404 langsung
  })
);

// Fallback terakhir kalau ada request ke /images/keychains/<file-yang-belum-ada>
// (mis. admin belum upload foto asli) — balikin placeholder lokal ketimbang
// biarkan <img> di frontend pecah/broken.
app.use("/images/keychains", (_req, res) => {
  res.sendFile(path.join(IMAGES_ROOT, "keychains", "placeholder.svg"));
});

// --- Routes ---
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Keychain Kawat Bulu API is running 🧵" });
});

app.use("/api/order", orderRoute);
app.use("/api/catalog", catalogRoute);

// --- 404 fallback ---
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

// --- Error handler terakhir (jaring pengaman) ---
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
});

app.listen(PORT, () => {
  console.log(`✅ Server jalan di http://localhost:${PORT}`);
  console.log(`🖼️  Static images tersedia di http://localhost:${PORT}/images/keychains/`);
});

// Untuk deploy sebagai Vercel Serverless Function, export default app
// dan biarkan Vercel yang handle listen() lewat vercel.json (lihat catatan deploy).
export default app;
