import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";

// Di dev, Vite proxy meneruskan "/api" ke backend (lihat vite.config.js).
// Di production (Vercel), set VITE_API_BASE ke URL backend/serverless-mu.
const API_BASE = import.meta.env.VITE_API_BASE || "";

// FALLBACK_CATALOG: dipakai kalau /api/catalog gagal (404, network error,
// atau balasan non-JSON dari Vercel). Bentuknya sengaja disamakan persis
// dengan payload asli backend/data/catalog.json supaya form tetap bisa
// dipakai (render + submit order) walau backend sedang down/misconfigured.
const FALLBACK_CATALOG = {
  shapes: [
    { id: "hewan", label: "Hewan", description: "Kucing, anjing, kelinci, dan karakter hewan lucu lainnya" },
    { id: "bunga", label: "Bunga", description: "Rangkaian bunga mini penuh warna" },
    { id: "custom", label: "Custom Request", description: "Bentuk sesuai request/foto referensi kamu" },
  ],
  colorThemes: [
    { id: "pastel", label: "Pastel Dream", hex: ["#F7C6D9", "#C9E4DE", "#F6E7CB"] },
    { id: "vibrant", label: "Vibrant Pop", hex: ["#FF3B6E", "#3AB0FF", "#FFD23F"] },
    { id: "earth", label: "Earth Tone", hex: ["#A47148", "#6B8E4E", "#D9B382"] },
    { id: "monochrome", label: "Mono Elegance", hex: ["#111111", "#8A8A8A", "#F5F5F5"] },
  ],
  pricing: { basePrice: 25000, currency: "IDR", minQuantity: 1, maxQuantity: 50 },
};

export default function OrderWidget() {
  // FIX: mulai dari FALLBACK_CATALOG, bukan null — supaya kalau fetch()
  // gagal/di-skip, `catalog.shapes` dkk di JSX di bawah TETAP ada isinya
  // dan tidak pernah membaca properti dari null (itu penyebab
  // "TypeError: can't access property 'shapes', n is null" yang bikin
  // layar blank: sebelumnya `catalog` tetap null saat request gagal,
  // padahal render form di bawah langsung memanggil catalog.shapes.map()
  // tanpa guard sama sekali).
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [form, setForm] = useState({
    shape: "",
    colorTheme: "",
    quantity: 1,
    name: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 1. Ambil opsi katalog (bentuk & tema warna) dari backend saat komponen mount
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const res = await fetch(`${API_BASE}/api/catalog`);

        // FIX #1: cek res.ok SEBELUM res.json(). Kalau /api/catalog 404
        // (mis. rewrite Vercel belum aktif), Vercel/browser balikin HALAMAN
        // HTML 404, bukan JSON — memanggil res.json() langsung di situ
        // yang menghasilkan "SyntaxError: JSON.parse: unexpected character
        // at line 1 column 1" (karena parser ketemu "<" dari HTML, bukan
        // "{"). Dengan cek res.ok dulu, kita throw error yang jelas TANPA
        // pernah mencoba parse body-nya sebagai JSON.
        if (!res.ok) {
          throw new Error(`API merespons status ${res.status}`);
        }

        // FIX #2: bungkus res.json() sendiri, buat jaga-jaga kalau res.ok
        // true tapi body-nya tetap bukan JSON valid (mis. proxy/edge cache
        // aneh, response ke-truncate, dll).
        let json;
        try {
          json = await res.json();
        } catch {
          throw new Error("Respons katalog dari server tidak valid (bukan JSON).");
        }

        if (!json.success || !json.data) {
          throw new Error(json.message || "Format data katalog tidak sesuai.");
        }

        if (cancelled) return;

        setCatalog(json.data);
        // Default-kan pilihan pertama supaya form langsung valid
        setForm((prev) => ({
          ...prev,
          shape: json.data.shapes?.[0]?.id || FALLBACK_CATALOG.shapes[0].id,
          colorTheme: json.data.colorThemes?.[0]?.id || FALLBACK_CATALOG.colorThemes[0].id,
        }));
      } catch (err) {
        if (cancelled) return;
        console.error("[OrderWidget] Gagal memuat /api/catalog:", err);

        // FIX #3: JANGAN biarkan `catalog` jadi null di sini. Tetap pakai
        // FALLBACK_CATALOG (sudah jadi default state) supaya form di bawah
        // (yang membaca catalog.shapes / catalog.colorThemes / catalog.pricing
        // tanpa optional chaining) tidak pernah crash walau API mati.
        setCatalog(FALLBACK_CATALOG);
        setForm((prev) => ({
          ...prev,
          shape: FALLBACK_CATALOG.shapes[0].id,
          colorTheme: FALLBACK_CATALOG.colorThemes[0].id,
        }));
        setError(
          "Gagal memuat opsi katalog dari server, memakai data cadangan. Order tetap bisa dikirim."
        );
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // 2. Submit form -> backend menyusun pesan & mengembalikan link WhatsApp
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // res.ok gagal (400/500) -> baca message dari body kalau ada, jangan
      // langsung asumsikan JSON selalu valid (misal server crash -> HTML error page)
      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Respons server tidak valid. Coba lagi.");
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal membuat pesanan.");
      }

      // Validasi waUrl benar-benar ada dan berbentuk URL wa.me sebelum dibuka,
      // supaya tidak window.open(undefined) kalau backend berubah bentuk responsnya.
      if (!json.waUrl || !/^https:\/\/wa\.me\//.test(json.waUrl)) {
        throw new Error("Link WhatsApp tidak valid dari server.");
      }

      window.open(json.waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="customizer" className="relative py-24 px-6 bg-base-950">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent-mint">
            <Sparkles size={14} /> Order Preview
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
            Susun Keychain Custom-mu
          </h2>
          <p className="text-white/60 mt-2">
            Pilih bentuk, tema warna, dan jumlah — kami siapkan pesanmu, tinggal kirim.
          </p>
        </div>

        {loadingCatalog ? (
          <div className="flex justify-center py-16 text-white/50">
            <Loader2 className="animate-spin" />
          </div>
        ) : !catalog ? (
          // FIX #4: guard render terakhir. Secara normal baris ini tidak
          // akan pernah kepakai lagi (catalog selalu FALLBACK_CATALOG atau
          // data asli), tapi ini jaring pengaman kalau ada refactor lain di
          // masa depan yang lupa set fallback-nya — mencegah
          // "catalog.shapes.map()" dipanggil saat catalog masih null/undefined.
          <p className="text-center text-white/50 py-16">
            Gagal memuat form pemesanan. Silakan refresh halaman.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-base-800/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6"
          >
            {/* Shape */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Bentuk
              </label>
              <div className="grid grid-cols-3 gap-3">
                {catalog.shapes.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => updateField("shape", s.id)}
                    className={`rounded-xl px-3 py-3 text-sm border transition-all ${
                      form.shape === s.id
                        ? "border-accent-pink bg-accent-pink/10 text-white"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color theme */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Tema Warna
              </label>
              <div className="grid grid-cols-2 gap-3">
                {catalog.colorThemes.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => updateField("colorTheme", c.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm border transition-all ${
                      form.colorTheme === c.id
                        ? "border-accent-gold bg-accent-gold/10 text-white"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span className="flex -space-x-1">
                      {c.hex.map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                Jumlah:{" "}
                <span className="text-white">{form.quantity} pcs</span>
              </label>
              <input
                type="range"
                min={catalog.pricing.minQuantity}
                max={catalog.pricing.maxQuantity}
                value={form.quantity}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
                className="w-full accent-accent-pink"
              />
            </div>

            {/* Name + note */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nama kamu (opsional)"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="bg-base-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-pink/60"
              />
              <input
                type="text"
                placeholder="Catatan tambahan (opsional)"
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                className="bg-base-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent-pink/60"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-pink to-accent-gold text-base-950 font-semibold rounded-xl py-4 hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <MessageCircle size={18} />
              )}
              {submitting ? "Menyiapkan pesanan..." : "Lanjut ke WhatsApp"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}