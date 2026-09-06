# SI-ABSEN (Sistem Informasi Presensi Online Kepegawaian)

Aplikasi Web Presensi Kepegawaian berbasis **Progressive Web App (PWA)** dengan verifikasi kamera wajah (*face verification*), kunci lokasi Google Maps (*strict geofencing*), jadwal dinas harian (41 jam) & dinas muter 3-shift, dashboard administrator modern dengan sidebar, serta arsitektur **Dual Storage (Google Spreadsheet & Google Drive vs Dedicated Server RustFS)**.

---

## 🚀 Fitur Utama

- 📸 **Presensi Wajah & Kamera AI**: Verifikasi foto selfie saat melakukan presensi masuk, pulang, atau izin/sakit/cuti.
- 🗺️ **Kunci Lokasi Google Maps (Geofencing)**: Titik koordinat kantor dan radius toleransi absensi yang dapat dikunci atau dinonaktifkan (Bebas Lokasi / WFH).
- 🕒 **Dukungan Dinas Ganda**:
  - Dinas Harian (Akumulasi Target 41 Jam/Minggu)
  - Dinas Muter 3-Shift (Shift Pagi: 07:00-14:00, Shift Sore: 14:00-21:00, Shift Malam: 21:00-07:00).
- 📊 **Portal Administrator Modern**:
  - Tampilan Left Sidebar responsif untuk laptop & desktop.
  - Dashboard statistik kehadiran, rekapitulasi mingguan (M1 - M5), rekap bulanan, dan ekspor file Excel.
  - Manajemen akun pegawai dengan aturan penulisan otomatis (*Auto-capitalization* & format SKPD).
- 💾 **Dual Storage Database & File System**:
  - **Mode Google Cloud**: Sinkronisasi data ke Google Spreadsheet & penyimpanan foto otomatis terstruktur di Google Drive: `Tahun / Bulan / Tanggal / [Absen Masuk | Absen Pulang]`.
  - **Mode Server RustFS**: Penyimpanan foto ke file server terdistribusi RustFS berkecepatan tinggi.

---

## 🛠️ Teknologi & Stack

- **Frontend**: React 18, Vite, Lucide Icons, Leaflet Maps
- **PWA**: vite-plugin-pwa, Service Worker, Web Manifest
- **Backend / Cloud Storage**: Google Apps Script Web App, Google Spreadsheet, Google Drive, RustFS Storage Server
- **Deployment**: Mendukung Vercel, Netlify, Cloudflare Pages, atau VPS

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

## 📝 Konfigurasi Google Apps Script
1. Buat Google Spreadsheet baru.
2. Buka **Extensions > Apps Script**, lalu salin seluruh isi file `backend-gas/Code.gs` ke editor Apps Script.
3. Jalankan fungsi `setupSpreadsheetDatabase()`.
4. Deploy sebagai Web App (`Execute as: Me`, `Who has access: Anyone`).
5. Masukkan URL Web App pada menu **Pengaturan API & Lokasi** di portal admin.
