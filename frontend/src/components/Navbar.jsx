export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 px-6 md:px-10 py-5 flex items-center justify-between backdrop-blur-md bg-base-950/40 border-b border-white/5">
      <span className="font-display font-bold tracking-tight text-lg">
        by.elveee<span className="text-accent-pink">.</span>
      </span>
      <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
        <a href="#about" className="hover:text-white transition">
          Tentang
        </a>
        <a href="#features" className="hover:text-white transition">
          Kenapa Kami
        </a>
        <a href="#article" className="hover:text-white transition">
          Proses
        </a>
        <a href="#customizer" className="hover:text-white transition">
          Custom Order
        </a>
      </div>
      <a
        href="#customizer"
        className="text-sm font-medium bg-white text-base-950 rounded-full px-4 py-2 hover:bg-accent-gold transition"
      >
        Mulai Custom
      </a>
    </nav>
  );
}