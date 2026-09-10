/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          // #0a0a0f = deep dark mode base yang diminta buat overhaul aesthetic
          950: "#0a0a0f",
          900: "#0F0D13",
          800: "#17141D",
          700: "#221E2B",
        },
        accent: {
          pink: "#FF3B6E",
          gold: "#F6C453",
          mint: "#7CE0C6",
        },
      },
      fontFamily: {
        display: ["'Clash Display'", "'Poppins'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        "grain-glow":
          "radial-gradient(circle at 20% 20%, rgba(255,59,110,0.15), transparent 40%), radial-gradient(circle at 80% 70%, rgba(124,224,198,0.12), transparent 45%)",
      },
    },
  },
  plugins: [],
};
