# Keychain Kawat Bulu by by.elveee

Landing page interaktif 3D + artikel scroll untuk brand custom chenille
stem keychain. Monorepo: `frontend/` (React + R3F + GSAP) dan `backend/`
(Node/Express API).

## Menjalankan secara lokal

**Backend**
```bash
cd backend
cp .env.example .env   # isi WA_ADMIN_NUMBER dengan nomor WhatsApp brand
npm install
npm run dev             # jalan di http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev              # jalan di http://localhost:5173
```
Vite dev server otomatis proxy request `/api/*` ke backend (lihat
`frontend/vite.config.js`), jadi tidak perlu setting CORS tambahan saat dev.

## Cara kerja tiap bagian penting

- **Hero3D.jsx** — Canvas R3F berisi mesh placeholder (plat tag + lilitan
  torus warna-warni). Posisi mouse dilacak lalu di-`lerp` ke rotasi grup 3D
  supaya parallax terasa halus, bukan kaku mengikuti kursor. Auto-rotate
  pelan ditambahkan supaya objek tetap "hidup" walau mouse diam.
- **ScrollArticle.jsx** — Section di-*pin* dengan `ScrollTrigger` selama
  beberapa layar penuh (jumlah step × `innerHeight`). Progress scroll (0–1)
  disimpan di `progressRef` (bukan state) supaya bisa dibaca tiap frame oleh
  `useFrame` di dalam Canvas tanpa memicu re-render React 60x/detik. Step
  teks aktif ditentukan dari progress dan di-*fade* pakai GSAP terpisah.
- **OrderWidget.jsx** — `useEffect` pertama fetch `/api/catalog` untuk isi
  opsi bentuk & warna secara dinamis (jadi katalog bisa diubah dari backend
  tanpa redeploy frontend). Submit form POST ke `/api/order`, backend
  membalas `waLink` siap pakai, lalu frontend `window.open()` ke WhatsApp.
- **backend/routes/order.js** — Validasi payload manual (tanpa library),
  susun teks pesan, encode jadi query string `wa.me` link. Belum menyimpan
  ke database — tinggal tambahkan langkah simpan-ke-DB sebelum generate link
  kalau butuh riwayat order.

## Ganti mesh 3D dengan model asli

`Hero3D.jsx` dan `ScrollArticle.jsx` pakai primitive geometry (RoundedBox +
Torus) sebagai placeholder. Untuk pakai model `.glb` custom:

```jsx
import { useGLTF } from "@react-three/drei";
const { scene } = useGLTF("/models/keychain.glb");
// lalu render <primitive object={scene} /> menggantikan <KeychainMesh />
```

## Deploy ke Vercel

`vercel.json` di root sudah men-setup build frontend (`frontend/dist`) dan
route `backend/server.js` sebagai serverless function untuk `/api/*`. Set
environment variable `WA_ADMIN_NUMBER` di dashboard Vercel (Project
Settings → Environment Variables) — jangan commit file `.env`.
