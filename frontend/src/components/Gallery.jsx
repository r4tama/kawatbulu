import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";

// Mock data — ganti `image` dengan URL foto produk asli kapan saja,
// struktur/kategori (`tag`) tidak perlu berubah.
const GALLERY_ITEMS = [
  {
    id: 1,
    title: "Kucing Oren",
    tag: "Hewan",
    image:
      "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&h=600&fit=crop",
  },
  {
    id: 2,
    title: "Bunga Matahari Mini",
    tag: "Bunga",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Karakter Beruang",
    tag: "Karakter",
    image:
      "https://images.unsplash.com/photo-1568152950566-c1bf43f4ab28?w=600&h=600&fit=crop",
  },
  {
    id: 4,
    title: "Inisial 'A'",
    tag: "Inisial Custom",
    image:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop",
  },
  {
    id: 5,
    title: "Kelinci Pastel",
    tag: "Hewan",
    image:
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&h=600&fit=crop",
  },
  {
    id: 6,
    title: "Rangkaian Mawar",
    tag: "Bunga",
    image:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=600&fit=crop",
  },
];

const CATEGORIES = ["Semua", "Hewan", "Bunga", "Inisial Custom"];

export default function Gallery() {
  const [activeTag, setActiveTag] = useState("Semua");
  const [selected, setSelected] = useState(null); // item untuk lightbox

  const filtered = useMemo(() => {
    if (activeTag === "Semua") return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.tag === activeTag);
  }, [activeTag]);

  // Tutup lightbox dengan tombol Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section id="gallery" className="relative py-24 px-6 bg-base-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Hasil Karya <span className="text-gradient">Pelanggan Kami</span>
          </h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">
            Sebagian keychain yang sudah kami buat — klik untuk lihat lebih
            besar.
          </p>
        </div>

        {/* Filter kategori */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTag(cat)}
              className={`text-sm px-3 py-2 rounded-full border transition-all ${
                activeTag === cat
                  ? "bg-accent-pink border-accent-pink text-white"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid foto */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10"
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/60">{item.tag}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>

          <div
            className="max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()} // klik gambar tidak menutup modal
          >
            <img
              src={selected.image}
              alt={selected.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="text-center mt-4">
              <p className="font-display text-lg font-semibold text-white">
                {selected.title}
              </p>
              <p className="text-sm text-white/50">{selected.tag}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
