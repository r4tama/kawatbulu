import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PipeCleanerWire3D from "./3d/PipeCleanerWire3D";

gsap.registerPlugin(ScrollTrigger);

// Teks tiap step sengaja disamakan urutannya dengan 4 fase animasi di
// <PipeCleanerWire3D>: Bahan Kawat -> Pembentukan -> Detail & Aksesoris
// -> Hasil Jadi, supaya narasi teks & visual 3D-nya nyambung 1:1.
const STEPS = [
  {
    title: "1. Bahan Kawat",
    body: "Semua bermula dari batang chenille premium: lembut di tangan, lentur, dan masih polos lurus — siap dibentuk jadi apa pun.",
  },
  {
    title: "2. Pembentukan (Twisting)",
    body: "Kawat mulai dipilin dan ditekuk manual, melingkar sedikit demi sedikit, sampai membentuk lekukan dasar keychain kamu.",
  },
  {
    title: "3. Detail & Aksesoris",
    body: "Ring gantungan kunci logam dipasang di ujung atas kawat yang sudah terbentuk — siap menggantung di tas, dompet, atau koleksi kamu.",
  },
  {
    title: "4. Hasil Jadi",
    body: "Keychain kawat bulu kamu resmi jadi. Kita putar 360° biar kelihatan detail warna & bentuknya dari segala sisi.",
  },
];

export default function ScrollArticle() {
  const sectionRef = useRef(null);
  const stepRefs = useRef([]);
  const progressRef = useRef(0); // dibaca tiap frame oleh <PipeCleanerWire3D>, tidak perlu re-render React
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const totalSteps = STEPS.length;

      // Pin section ini selama panjang scroll = totalSteps layar penuh,
      // supaya tiap step (dan tiap fase animasi 3D-nya) punya "jatah"
      // scroll yang sama besar (0.25 progress per step, karena 4 steps).
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${window.innerHeight * (totalSteps - 1)}`,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          progressRef.current = self.progress;

          const idx = Math.min(
            totalSteps - 1,
            Math.floor(self.progress * totalSteps)
          );
          setActiveStep((prev) => (prev !== idx ? idx : prev));
        },
      });

      return () => st.kill();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Fade in/out teks step aktif setiap kali activeStep berubah
  useEffect(() => {
    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        opacity: i === activeStep ? 1 : 0,
        y: i === activeStep ? 0 : 20,
        duration: 0.5,
        ease: "power2.out",
        pointerEvents: i === activeStep ? "auto" : "none",
      });
    });
  }, [activeStep]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-transparent flex items-center"
    >
      <div className="max-w-6xl mx-auto w-full px-6 md:px-12 grid md:grid-cols-2 gap-10 items-center">
        {/* Kolom teks: semua step ditumpuk absolute, yang aktif saja opacity 1 */}
        <div className="relative h-64">
          <p className="font-display text-sm tracking-widest text-accent-gold mb-4 uppercase">
            Dari Kawat Fleksibel Menjadi Karya Seni
          </p>
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              ref={(el) => (stepRefs.current[i] = el)}
              className="absolute inset-0 top-8"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <h3 className="font-display text-2xl md:text-4xl font-bold mb-4">
                {step.title}
              </h3>
              <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-md">
                {step.body}
              </p>
            </div>
          ))}

          {/* Progress dots */}
          <div className="absolute -bottom-4 left-0 flex gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeStep ? "w-8 bg-accent-pink" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Kolom 3D: kawat bulu prosedural, dibungkus glass card biar nyatu
            dengan aesthetic overhaul (backdrop-blur + border glow saat hover) */}
        <div className="glass-card relative h-80 md:h-[26rem] overflow-hidden">
          <div className="absolute inset-0 bg-grain-glow opacity-60 pointer-events-none" />
          <Canvas camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 1.8]}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[3, 4, 3]} intensity={1.3} />
            <pointLight position={[-3, -1, 2]} intensity={0.6} color="#FF3B6E" />
            <PipeCleanerWire3D progressRef={progressRef} />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
