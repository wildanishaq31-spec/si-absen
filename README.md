# SI-ABSEN (Sistem Informasi Presensi Online Kepegawaian)

Aplikasi Web Presensi Kepegawaian berbasis **Progressive Web App (PWA)** dengan verifikasi biometrik wajah (*FaceID liveness detection* & kedip mata), kunci lokasi Google Maps (*strict geofencing*), dinas harian (41 jam) & dinas muter 3-shift, dashboard administrator modern dengan sidebar, serta arsitektur **Vercel Postgres (Neon) & Google Drive Storage / RustFS Storage Server**.

---

## 🚀 Fitur Utama

- 📸 **FaceID Biometrik Wajah & AI Liveness**: Deteksi kontur wajah dan validasi kedip mata alami (1x blink) menggunakan MediaPipe FaceMesh sebelum pengambilan foto otomatis presensi.
- 🗺️ **Kunci Lokasi Google Maps (Geofencing)**: Titik koordinat kantor dan radius toleransi absensi yang dapat dikunci atau dinonaktifkan (Bebas Lokasi / WFH).
- 🕒 **Dukungan Dinas Ganda**:
  - Dinas Harian (Akumulasi Target 41 Jam/Minggu)
  - Dinas Muter 3-Shift (Shift Pagi: 07:00-14:00, Shift Sore: 14:00-21:00, Shift Malam: 21:00-07:00).
- 📊 **Portal Administrator Modern**:
  - Tampilan Left Sidebar responsif untuk laptop & desktop.
  - Dashboard statistik kehadiran, rekapitulasi mingguan (M1 - M5), rekap bulanan, dan ekspor file Excel multi-sheet (.xlsx).
  - Manajemen akun pegawai dengan aturan penulisan otomatis (*Auto-capitalization* & format SKPD).
- 💾 **Dual Storage Database & File System**:
  - **Mode Vercel Postgres & Google Drive**: Sinkronisasi data realtime langsung ke database cloud PostgreSQL (Neon) via Vercel Serverless `/api/sync` dan penyimpanan tautan foto bukti di Google Drive.
  - **Mode Server RustFS**: Penyimpanan foto langsung ke file server terdistribusi RustFS berkecepatan tinggi.

---

## 🛠️ Teknologi & Stack

- **Frontend**: React 18, Vite, Lucide Icons, Leaflet Maps, MediaPipe FaceMesh
- **PWA**: vite-plugin-pwa, Service Worker, Web Manifest
- **Backend / Database**: Vercel Serverless Functions (`/api/sync`), Vercel Postgres (Neon Database)
- **File Storage**: Google Drive Folder URL / RustFS Storage Server
- **Excel Engine**: SheetJS (`xlsx`) multi-sheet generator
- **Deployment**: Vercel (Auto Serverless Functions & Postgres Integration)

---

## 📦 Instalasi & Pengujian Lokal

```bash
# 1. Clone repository
git clone https://github.com/wildanishaq31-spec/si-absen.git
cd si-absen

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev
```

---

## ⚙️ Konfigurasi Cloud Database (Vercel Postgres & Google Drive)

1. Hubungkan repository ke proyek **Vercel**.
2. Tambahkan integrasi **Vercel Postgres (Neon)** pada dashboard Vercel (variabel `POSTGRES_URL` akan terisi otomatis).
3. Buat Folder di **Google Drive** untuk penyimpanan foto presensi, salin tautan foldernya dan tempelkan pada menu **Pengaturan API & Cloud Storage** di Portal Admin SI-ABSEN.
4. Presensi dan rekapitulasi data langsung tersimpan secara aman dan realtime di PostgreSQL. Laporan multi-sheet dapat diunduh kapan saja melalui tombol **Unduh Excel Rekap**.
