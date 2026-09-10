import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Preloader — layar loading yang tampil sebelum Hero section.
 *
 * Cara kerja:
 * 1. Progress 0 -> 100 disimulasikan dengan gsap.to pada sebuah object
 *    ({ value: 0 }), bukan langsung animasi CSS width, supaya angka
 *    persen di layar dan lebar progress bar selalu sinkron sempurna
 *    (satu sumber kebenaran: `progressObj.value`).
 * 2. Begitu progress sampai 100, jalankan timeline "exit": brand text +
 *    ikon naik/fade duluan, lalu seluruh overlay slide-up & fade-out,
 *    baru setelah selesai `onFinish()` dipanggil supaya parent bisa
 *    unmount komponen ini (dan misal, baru inisialisasi ScrollTrigger).
 * 3. `document.body.style.overflow = "hidden"` dikunci selama preloader
 *    tampil supaya user tidak bisa scroll duluan sebelum Hero muncul.
 */
export default function Preloader({ onFinish }) {
  const containerRef = useRef(null);
  const wireRef = useRef(null);
  const brandRef = useRef(null);
  const barRef = useRef(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      // Spin ikon "kawat" terus menerus selama loading
      gsap.to(wireRef.current, {
        rotate: 360,
        duration: 2.2,
        repeat: -1,
        ease: "linear",
      });

      const progressObj = { value: 0 };
      const tl = gsap.timeline();

      tl.to(progressObj, {
        value: 100,
        duration: 2,
        ease: "power1.inOut",
        onUpdate: () => {
          const val = Math.round(progressObj.value);
          setPercent(val);
          if (barRef.current) {
            barRef.current.style.width = `${val}%`;
          }
        },
        onComplete: () => {
          // Timeline exit: teks & ikon dulu, baru overlay penuh
          const exitTl = gsap.timeline({
            onComplete: () => {
              document.body.style.overflow = "";
              onFinish?.();
            },
          });

          exitTl
            .to([brandRef.current, wireRef.current], {
              y: -20,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in",
            })
            .to(
              containerRef.current,
              {
                yPercent: -100,
                duration: 0.7,
                ease: "power3.inOut",
              },
              "-=0.1"
            );
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [onFinish]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-base-950"
    >
      <div className="bg-grain-glow absolute inset-0 opacity-60" />

      <div className="relative flex flex-col items-center">
        {/* Ikon "kawat" berputar — SVG sederhana, bukan model 3D, supaya
            preloader ringan dan tidak nunggu Three.js siap duluan */}
        <svg
          ref={wireRef}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          className="mb-6"
        >
          <circle
            cx="28"
            cy="28"
            r="20"
            stroke="url(#wireGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="70 55"
          />
          <defs>
            <linearGradient id="wireGradient" x1="0" y1="0" x2="56" y2="56">
              <stop offset="0%" stopColor="#FF3B6E" />
              <stop offset="100%" stopColor="#F6C453" />
            </linearGradient>
          </defs>
        </svg>

        <h1
          ref={brandRef}
          className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white"
          style={{ textShadow: "0 0 24px rgba(255,59,110,0.5)" }}
        >
          ByElveee Studio
        </h1>

        <div className="mt-8 w-48 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="h-full bg-gradient-to-r from-accent-pink to-accent-gold"
            style={{ width: "0%" }}
          />
        </div>

        <span className="mt-3 text-xs tracking-widest text-white/40 tabular-nums">
          {percent}%
        </span>
      </div>
    </div>
  );
}
