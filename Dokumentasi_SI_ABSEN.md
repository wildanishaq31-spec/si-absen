# Dokumentasi Sistem SI-ABSEN

*Aplikasi Presensi Kepegawaian Berbasis Progressive Web App (PWA) & Cloud Serverless*

---

## 1. Arsitektur & Lingkungan Aplikasi
- **Frontend Framework:** React 18 + Vite (Mode SPA & PWA).
- **Desain UI/UX:** SIPP v5.6 Puskesmas Cermee Style (Vanilla CSS & Lucide Icons).
- **Biometrik & FaceID:** MediaPipe FaceMesh dengan deteksi kontur wajah dan validasi 1x kedipan mata (*relative drop >= 40%* dari baseline terbuka).
- **Database Cloud Utama:** Vercel Postgres (Neon Serverless via `/api/sync`).
- **Cloud Storage:** Google Drive Storage (Hierarki Bertingkat: Tahun/Bulan/Tanggal/Tipe) & Dedicated RustFS Server.
- **Geolokasi & Maps:** Leaflet.js + Google Maps Radius Geofencing.
- **Ekspor Laporan:** SheetJS (`xlsx`) multi-sheet generator lokal di browser.

---

## 2. Hierarki Folder Google Drive & Format File
```text
📁 Folder Induk Google Drive
   └── 📁 2026/ (Tahun)
       └── 📁 09-September/ (Bulan)
           └── 📁 2026-09-08/ (Tanggal)
               ├── 📁 Absen Masuk/
               │   └── 📷 [NAMA]_[TIMESTAMP]_Masuk.jpg
               └── 📁 Absen Pulang/
                   └── 📷 [NAMA]_[TIMESTAMP]_Pulang.jpg
```

---

## 3. Fitur Utama
### 👨‍💼 Panel Administrator
- **Akses:** Email `admin@siabsen.go.id` / Password `admin`
- **Dashboard Live:** Monitoring kehadiran harian, switch kategori Harian vs 3-Shift.
- **Manajemen Pegawai:** CRUD akun pegawai terhubung ke tabel `users` PostgreSQL.
- **Unduh Excel Rekap:** Download file `.xlsx` berisi Absen Masuk, Absen Pulang, Rekap M1-M5, Rekap Total, dan Rekap Bulanan.
- **Geofencing & Storage Setting:** Pengaturan koordinat kantor, radius lock, link Google Drive, dan Dedicated Server RustFS.

### 👷‍♂️ Panel Pegawai
- **Persistent Login:** Sesi login aman dan tersimpan di HP.
- **FaceID Scanner:** Kamera presensi dengan deteksi wajah dan verifikasi kedip mata alami sebelum submit.
- **Geolokasi Valid:** Verifikasi GPS dalam radius kantor yang ditentukan.
- **Dukungan Shift:** Dinas Harian (41 Jam/Minggu) dan Dinas Muter 3-Shift (Pagi, Sore, Malam).

---

## 4. Kredensial Default
- **Admin Email:** `admin@siabsen.go.id`
- **Admin Password:** `admin`
