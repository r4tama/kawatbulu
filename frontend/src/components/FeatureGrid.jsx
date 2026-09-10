import { Shapes, Palette, ShieldCheck, MessageSquareHeart } from "lucide-react";

const FEATURES = [
  {
    icon: Shapes,
    title: "Variasi Bentuk",
    desc: "Dari hewan lucu, bunga mini, sampai karakter custom sesuai imajinasi kamu.",
  },
  {
    icon: Palette,
    title: "20+ Pilihan Warna",
    desc: "Palet warna cerah sampai earth tone lembut — mix & match sesuka hati.",
  },
  {
    icon: ShieldCheck,
    title: "Bahan Soft & Safe",
    desc: "Chenille premium yang lembut di tangan, aman, dan nggak gampang rusak.",
  },
  {
    icon: MessageSquareHeart,
    title: "Custom Request",
    desc: "Kirim referensi/foto, kami bantu wujudkan jadi keychain versi kamu.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="relative py-24 px-6 bg-base-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Kenapa <span className="text-gradient">Keychain Kawat Bulu</span>?
          </h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">
            Handmade, fleksibel, dan 100% bisa disesuaikan — setiap keychain
            punya cerita bentuknya sendiri.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-base-800/50 p-6 hover:border-accent-pink/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-pink/10 flex items-center justify-center mb-4 group-hover:bg-accent-pink/20 transition-colors">
                <Icon size={20} className="text-accent-pink" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                {title}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
