import { Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-base-950 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-display font-bold text-lg">
            by.elveee<span className="text-accent-pink">.</span>
          </span>
          <p className="text-white/40 text-sm mt-1">
            Keychain Kawat Bulu — Handmade &amp; Custom.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/by.elveee"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-accent-pink/50 hover:text-accent-pink transition"
            aria-label="Instagram"
          >
            <Instagram size={18} />
          </a>
          <a
            href="#customizer"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 hover:border-accent-mint/50 hover:text-accent-mint transition"
            aria-label="WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>

      <p className="text-center text-white/25 text-xs mt-8">
        © {new Date().getFullYear()} by.elveee. All rights reserved.
      </p>
    </footer>
  );
}
