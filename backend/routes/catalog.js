import { Router } from "express";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Base URL dipakai untuk membangun URL gambar absolut (bukan cuma path
// relatif) supaya frontend bisa langsung pasang ke <img src> tanpa perlu
// tahu-menahu alamat backend. Override via env BACKEND_URL saat deploy
// (mis. domain Vercel production) — fallback ke localhost:5000 untuk dev.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

const IMAGES_DIR = path.join(__dirname, "..", "public", "images", "keychains");
const FALLBACK_IMAGE = "placeholder.svg";

/**
 * Ubah nama file gambar (relatif) jadi URL absolut siap pakai.
 * Kalau file fisiknya belum ada di backend/public/images/keychains/
 * (misal admin belum sempat upload foto produk asli), otomatis fallback
 * ke placeholder lokal supaya UI di frontend tidak menampilkan broken image.
 */
function resolveImageUrl(filename) {
  if (!filename || typeof filename !== "string") {
    return `${BACKEND_URL}/images/keychains/${FALLBACK_IMAGE}`;
  }

  const safeFilename = existsSync(path.join(IMAGES_DIR, filename))
    ? filename
    : FALLBACK_IMAGE;

  return `${BACKEND_URL}/images/keychains/${safeFilename}`;
}

/**
 * GET /api/catalog
 * Mengembalikan data master: pilihan bentuk, tema warna, info harga dasar,
 * dan sekarang juga daftar `items` (contoh produk) — tiap item sudah
 * dilengkapi field `image` berupa URL penuh (http://.../images/keychains/..),
 * lengkap dengan local static fallback kalau file aslinya belum tersedia.
 * Frontend (OrderWidget/Gallery) memakai ini untuk mengisi opsi form &
 * galeri secara dinamis, jadi kalau ada perubahan katalog cukup edit
 * data/catalog.json — tidak perlu ubah kode React sama sekali.
 */
router.get("/", async (_req, res) => {
  try {
    const filePath = path.join(__dirname, "..", "data", "catalog.json");
    const raw = await readFile(filePath, "utf-8");
    const catalog = JSON.parse(raw);

    const items = Array.isArray(catalog.items)
      ? catalog.items.map((item) => ({
          ...item,
          image: resolveImageUrl(item.image),
        }))
      : [];

    res.json({ success: true, data: { ...catalog, items } });
  } catch (err) {
    console.error("[GET /api/catalog] error:", err);
    res.status(500).json({ success: false, message: "Gagal memuat katalog." });
  }
});

export default router;
