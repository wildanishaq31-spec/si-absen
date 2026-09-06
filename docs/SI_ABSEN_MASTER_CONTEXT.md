---
title: "SI-ABSEN Master Project & Conversation Context"
date: 2026-09-06
project: "SI-ABSEN (Sistem Informasi Absensi Pegawai & Administrator)"
theme: "SIPP v5.6"
tags:
  - si-absen
  - sipp-v5-6
  - react-vite
  - google-maps
  - face-scan
  - 3-shift
  - google-sheets
  - rustfs-storage
  - vercel-deployment
  - pwa-installer
---

# 📌 SI-ABSEN: Master Context & Obsidian Documentation

Dokumentasi ini merangkum seluruh spesifikasi produk, arsitektur teknis, desain antarmuka (*UI/UX*), aturan jam kerja (Harian 41 Jam & Dinas 3-Shift), integrasi penyimpanan (Google Spreadsheet & RustFS), pemisahan portal login, dan status kesiapan rilis online aplikasi **SI-ABSEN**.

---

## 🎯 1. Ringkasan Proyek & Tujuan
**SI-ABSEN** adalah aplikasi sistem presensi pegawai dan portal administrator modern berbasis **React.js + Vite** yang mengadopsi tampilan antarmuka resmi **SIPP v5.6** (Mobile ASN PPPKPW UPTD Puskesmas Cermee). Dilengkapi verifikasi kamera wajah biometrik, GPS Geofencing Google Maps, dukungan dinas harian (target 41 jam/minggu) serta dinas muter (3 Shift: Pagi, Sore, Malam), penyimpanan data rekap di Google Spreadsheet, dan penyimpanan foto bukti di server RustFS.

---

## 🌐 2. Struktur URL & Routing Aplikasi

| URL Path | Halaman / Fungsi | Keterangan |
| :--- | :--- | :--- |
| **`/pegawai/login`** atau **`/`** | **Portal Login Pegawai** | Halaman login bersih khusus pegawai dengan logo statis SI-ABSEN dan tautan pendaftaran akun. Bebas dari banner pop-up instalasi. |
| **`/administrator/login`** | **Portal Login Administrator** | Halaman login khusus Super Admin (`admin@siabsen.go.id`) dengan tema keamanan `🛡️ PORTAL ADMINISTRATOR`. Terisolasi tanpa tautan kembali ke pegawai. |
| **`/download`** (atau `/unduh`) | **Installer Aplikasi PWA** | Landing page resmi untuk mengunduh & memasang aplikasi PWA di HP Android (Chrome) dan iPhone (Safari). |
| **`/pegawai/dashboard`** | **Dashboard Pegawai (SIPP v5.6)** | Antarmuka presensi mobile pegawai: GPS Maps, scan wajah, riwayat, dan monitoring kedisiplinan. |
| **`/administrator/dashboard`** | **Dashboard Administrator** | Portal monitoring rekapitulasi, switcher kategori Harian vs 3-Shift, Data Pegawai, kunci lokasi GPS, pengaturan API/Storage, dan modal Pengaturan Akun Admin (Ubah Nama, Email, Sandi, & Pemulihan). |
| **`/pegawai/register`** | **Pendaftaran Akun Pegawai** | Formulir registrasi pegawai baru (Nama, NIP, SKPD kosong/placeholder, Email, Kata Sandi dengan validator keamanan tersembunyi yang muncul otomatis saat diketik, animasi transisi halus). |

---

## 🔄 3. Skema Presensi: Harian vs Dinas Muter (3-Shift)

### A. Presensi Dinas Harian (Dinas Pagi / Target 41 Jam)
- **Aturan Jam Kerja**:
  - **Senin – Kamis**: `07:30 – 15:00` (7.5 Jam)
  - **Jumat**: `07:00 – 11:30` (4.5 Jam)
  - **Sabtu**: `07:00 – 13:00` (6.0 Jam)
  - **Minggu**: Libur Rutin
- **Target Jam Kerja**: **41 Jam / Minggu**.

### B. Presensi Dinas Muter (3 Shift)
Disediakan opsi presensi khusus pegawai shift dengan perhitungan jam kerja fleksibel:
- **Dinas Pagi**: `07:00 – 14:00` (7.0 Jam Kerja)
- **Dinas Sore**: `14:00 – 21:00` (7.0 Jam Kerja)
- **Dinas Malam**: `21:00 – 07:00` (10.0 Jam Kerja, mendukung kalkulasi lintas hari / *overnight crossing midnight*).

---

## 📊 4. Dashboard Administrator & Pemisahan Rekap

Di Dashboard Admin, terdapat tombol switcher kategori:
1. **🏢 Absen Harian (Dinas Pagi / 41 Jam)**
2. **🔄 Absen Shift (Dinas Muter 3-Shift)**

Saat kategori dipilih, seluruh komponen otomatis terfilter secara terpisah:
- **Kartu Statistik**: Total Pegawai, Tepat Waktu, Terlambat, Izin/Sakit.
- **Tabel Absen Masuk & Pulang**: Dilengkapi tag status shift (Pagi, Sore, Malam).
- **Tabel Rekap Absensi (M1 – M5)**: Mode *Tabel Rinci* dan *Matriks Hari*.
- **Tabel Rekap Total Perminggu**: Akumulasi jam kerja M1 s/d M5 & rata-rata per minggu.
- **Tabel Rekap Bulanan**: Total jam kerja, status target, hari hadir, izin, sakit, dan terlambat.
- **Download Excel (.xlsx)**: Mengunduh file laporan multi-sheet yang terpisah untuk kategori Harian dan Shift.

---

## ☁️ 5. Penyimpanan Data: Google Spreadsheet & RustFS Server

### A. Google Spreadsheet Webhook (Data Rekap Presensi)
- Terhubung via Google Apps Script (GAS) Web App (`backend-gas/Code.gs`).
- Setiap kali presensi masuk, pulang, atau izin diajukan, payload data langsung tercatat ke sheet Google Spreadsheet secara *real-time*.

### B. RustFS Cloud Storage (Penyimpanan Foto Bukti Absensi)
- Layanan terintegrasi `src/services/rustfsService.js` untuk mengunggah foto wajah dan bukti izin langsung ke server penyimpanan terdistribusi RustFS.
- Dilengkapi pengaturan di panel Admin:
  - **URL Endpoint RustFS**: (contoh: `https://rustfs.pkmcermee.my.id` atau `http://localhost:8000`)
  - **Nama Bucket/Folder**: `bukti-presensi`
  - **API Key / Token**: Akses otentikasi RustFS (opsional)
  - **Tombol Uji Koneksi**: Memvalidasi kesiapan server RustFS sebelum digunakan.
- URL foto dari RustFS otomatis dicatat ke kolom *Bukti Kehadiran* di Google Spreadsheet.

---

## 🧹 6. Manajemen Data & Pembersihan Data Dummy

- **Mulai dari Nol**: Seluruh 14 data karyawan dummy telah dibersihkan.
- **Akun Bawaan**: Hanya akun **Administrator** yang tersimpan secara *default*:
  - **Email**: `admin@siabsen.go.id`
  - **Password**: `admin`
- **Fitur Reset Database**: Tombol *"Kosongkan Seluruh Data Dummy"* pada tab Pengaturan Admin untuk mereset sistem sewaktu-waktu.

---

## 🚀 7. Konfigurasi Deployment Online (GitHub & Vercel)

1. **`vercel.json`**:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   *Memastikan semua rute SPA (`/administrator/login`, `/pegawai/login`, `/download`) tidak menghasilkan 404 saat diakses langsung di Vercel.*

2. **`.gitignore`**:
   Mengabaikan `node_modules`, `dist`, logs, dan file lokal sebelum diunggah ke GitHub.

---

*Catatan: Dokumen Obsidian ini diperbarui otomatis sebagai catatan master arsitektur proyek SI-ABSEN.*
