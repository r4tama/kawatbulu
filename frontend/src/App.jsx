import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Navbar from "./components/Navbar";
import Hero3D from "./components/Hero3D";
import About from "./components/About";
import FeatureGrid from "./components/FeatureGrid";
import ScrollArticle from "./components/ScrollArticle";
import Gallery from "./components/Gallery";
import OrderWidget from "./components/OrderWidget";
import Footer from "./components/Footer";
import Preloader from "./components/Preloader";

// Dijalankan sekali di module scope
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
}

function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-base-950 pointer-events-none">
      <div className="absolute inset-0 bg-grid-overlay opacity-30" />

      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-pink/20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-accent-mint/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full bg-accent-gold/10 blur-3xl" />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-grain-glow">
      <Hero3D />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest border border-white/15 rounded-full px-4 py-2 mb-6 text-white/80">
          <Sparkles size={14} className="text-accent-gold" />
          Handmade &amp; Custom
        </span>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl">
          Keychain Kawat Bulu,
          <br />
          <span className="text-gradient">Dibentuk Sesuai Kamu</span>
        </h1>

        <p className="text-white/60 mt-6 max-w-lg text-base md:text-lg">
          Chenille stem lembut, warna-warni, dan 100% custom — jadi aksesoris
          kecil yang benar-benar punya cerita.
        </p>

        <a
          href="#customizer"
          className="pointer-events-auto mt-8 inline-flex items-center gap-2 bg-accent-pink text-white font-semibold rounded-full px-7 py-4 hover:bg-accent-pink/90 transition"
        >
          Mulai Custom <ArrowRight size={18} />
        </a>
      </div>

      <div className="absolute bottom-8 inset-x-0 flex justify-center text-white/30 text-xs tracking-widest uppercase">
        Scroll untuk lihat proses
      </div>
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative">
      <AmbientBackground />
      {loading && <Preloader onFinish={() => setLoading(false)} />}

      <div className="noise-overlay" />
      <Navbar />
      <Hero />
      <div id="about">
        <About />
      </div>
      <div id="features">
        <FeatureGrid />
      </div>
      <div id="article">
        <ScrollArticle />
      </div>
      <Gallery />
      <OrderWidget />
      <Footer />
    </div>
  );
}