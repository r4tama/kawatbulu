import { Router } from "express";

const router = Router();

// Fallback dipakai kalau .env belum di-set — jangan lupa override ini di
// production lewat environment variable WA_ADMIN_NUMBER.
const DEFAULT_WA_NUMBER = "6289682690923";

function validateOrderPayload(body) {
  const errors = [];
  const { shape, colorTheme, quantity, name } = body;

  if (!shape || typeof shape !== "string") {
    errors.push("Bentuk (shape) wajib diisi.");
  }
  if (!colorTheme || typeof colorTheme !== "string") {
    errors.push("Tema warna (colorTheme) wajib diisi.");
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
    errors.push("Jumlah (quantity) harus berupa angka 1–50.");
  }
  if (name && typeof name !== "string") {
    errors.push("Nama tidak valid.");
  }

  return { valid: errors.length === 0, errors, quantity: qty };
}

/**
 * POST /api/order
 * Body: { shape, colorTheme, quantity, name?, note? }
 *
 * Balikin: { success: true, waUrl: "https://wa.me/<nomor>?text=<encoded>" }
 *
 * Catatan desain:
 * - WA_ADMIN_NUMBER punya fallback DEFAULT_WA_NUMBER supaya route tetap
 *   berfungsi walau .env belum di-setup (misal saat demo/dev cepat) —
 *   tapi di production selalu override lewat env var.
 * - Teks pesan di-encode dengan encodeURIComponent SEBELUM disisipkan ke
 *   URL, supaya karakter seperti newline, emoji, atau simbol dari input
 *   user (name/note) tidak merusak format link wa.me.
 */
router.post("/", (req, res) => {
  const { valid, errors, quantity } = validateOrderPayload(req.body || {});

  if (!valid) {
    return res.status(400).json({ success: false, message: errors.join(" ") });
  }

  const { shape, colorTheme, name, note } = req.body;
  const adminNumber = process.env.WA_ADMIN_NUMBER || DEFAULT_WA_NUMBER;

  const lines = [
    "Halo! Saya mau custom keychain kawat bulu 🧵",
    "",
    `Bentuk: ${shape}`,
    `Tema Warna: ${colorTheme}`,
    `Jumlah: ${quantity} pcs`,
  ];

  if (name) lines.push(`Nama: ${name}`);
  if (note) lines.push(`Catatan: ${note}`);

  const encodedText = encodeURIComponent(lines.join("\n"));
  const waUrl = `https://wa.me/${adminNumber}?text=${encodedText}`;

  return res.status(200).json({
    success: true,
    waUrl,
    summary: { shape, colorTheme, quantity, name: name || null, note: note || null },
  });
});

export default router;
