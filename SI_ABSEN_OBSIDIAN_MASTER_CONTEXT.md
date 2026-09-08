---
title: "SI-ABSEN Master Project & Obsidian Documentation"
date: 2026-09-08
project: "SI-ABSEN (Sistem Informasi Presensi Online Kepegawaian)"
theme: "SIPP v5.6"
author: "Google DeepMind / Antigravity AI"
tags:
  - si-absen
  - sipp-v5-6
  - vercel-postgres
  - neon-database
  - vercel-serverless
  - google-drive-storage
  - rustfs-storage
  - mediapipe-facemesh
  - blink-detection
  - react-vite
  - google-maps-geofencing
  - shift-management
  - excel-recap-multitab
  - obsidian-vault
---

# 📌 SI-ABSEN: Master Context & Obsidian Documentation

Dokumentasi komprehensif ini merangkum seluruh spesifikasi produk, arsitektur cloud serverless, skema database **Vercel Postgres (Neon)**, integrasi penyimpanan foto **Google Drive & RustFS**, modul verifikasi biometrik **FaceID MediaPipe Liveness**, desain antarmuka (*UI/UX*) bertema **SIPP v5.6**, aturan jam kerja (Dinas Harian 41 Jam & Dinas Muter 3-Shift), laporan rekapitulasi multi-tab Excel, serta panduan operasional administrator.

---

## 🏗️ 1. Arsitektur Cloud & Tech Stack

```mermaid
graph TD
    ClientPegawai["📱 HP Pegawai (PWA / Browser)"] -->|Presensi Masuk/Pulang & Foto FaceID| VercelAPI["⚡ Vercel Serverless API (/api/sync)"]
    ClientAdmin["💻 Laptop / PC Admin"] -->|Monitoring & Export Excel (.xlsx)| VercelAPI
    
    subgraph Cloud Storage & Database
        VercelAPI -->|Data Akun, Absensi & Settings| PostgresNeon[("🐘 Vercel Postgres (Neon)")]
        VercelAPI -->|URL Bukti Foto Presensi| GoogleDrive["📁 Google Drive Storage"]
        VercelAPI -.->|Opsi Server Mandiri| RustFS["🖥️ RustFS Storage Server"]
    end
```

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | **React.js 18 + Vite** | SPA modern responsif dengan PWA support (*offline-ready*). |
| **UI/UX Styling** | **Vanilla CSS + Lucide Icons** | Mengadopsi visual resmi **SIPP v5.6** (Puskesmas Cermee). |
| **Biometrik & FaceID** | **MediaPipe FaceMesh** | Deteksi kontur wajah akurat & validasi kedipan mata 1x (*liveness test*). |
| **Database Cloud** | **Vercel Postgres (Neon Serverless)** | Driver `@neondatabase/serverless`, auto-migration tabel, bebas kuota Apps Script. |
| **Serverless API** | **Vercel Serverless Functions (`/api/sync`)** | Menyediakan endpoint CRUD terpusat untuk sinkronisasi akun & presensi. |
| **Storage Foto Bukti** | **Google Drive & RustFS** | Foto bukti kehadiran diarahkan dan dikelola via URL folder Google Drive atau RustFS. |
| **Export Engine** | **SheetJS (xlsx)** | Menghasilkan file laporan `.xlsx` multi-sheet (Presensi, M1-M5, Rekap Total, Bulanan). |
| **Geofencing & Peta** | **Leaflet + Google Maps** | Validasi radius presensi kantor dengan deteksi GPS live. |

---

## 📁 2. Hierarki Struktur Folder Penyimpanan Google Drive

Penyimpanan foto bukti presensi dan foto profil pegawai dirancang otomatis tersusun rapi berdasarkan hierarki bertingkat:

```text
📁 [Folder Induk Google Drive] (ID Folder Utama di Pengaturan Admin)
   │
   ├── 📁 Profil pegawai/                            <-- Direktori Khusus Foto Profil Pegawai
   │   ├── 📷 AGUNG_SISWOYO_19940731202522093.jpg
   │   └── 📷 PEGAWAI_LAIN_NIP.jpg
   │
   └── 📁 2026/                                      <-- Level 1: Tahun (Bukti Kehadiran)
       │
       └── 📁 09-September/                          <-- Level 2: Bulan (Format: MM-NamaBulan)
           │
           └── 📁 2026-09-08/                        <-- Level 3: Tanggal (Format: YYYY-MM-DD)
               │
               ├── 📁 Absen Masuk/                   <-- Level 4: Kategori Masuk / Izin / Sakit
               │   ├── 📷 AGUNG_SISWOYO_46273_Masuk.jpg
               │   └── 📷 PEGAWAI_LAIN_46274_Masuk.jpg
               │
               └── 📁 Absen Pulang/                  <-- Level 4: Kategori Pulang
                   ├── 📷 AGUNG_SISWOYO_46273_Pulang.jpg
                   └── 📷 PEGAWAI_LAIN_46274_Pulang.jpg
```

### Format Standar Penamaan File Foto (.jpg):
1. **Foto Profil Pegawai**:
   - **Lokasi Folder**: `[Folder Utama] / Profil pegawai/`
   - **Formula**: `{NAMA_PEGAWAI}_{NIP}.jpg`
   - **Contoh**: `AGUNG_SISWOYO_19940731202522093.jpg`
2. **Foto Bukti Presensi (Masuk & Pulang)**:
   - **Lokasi Folder**: `[Folder Utama] / {TAHUN} / {BULAN} / {TANGGAL} / {KATEGORI}/`
   - **Formula**: `[NAMA_PEGAWAI]_[TIMESTAMP/COMPOSITE_KEY]_[TIPE].jpg`
   - **Contoh Masuk**: `AGUNG_SISWOYO_46273_Masuk.jpg`
   - **Contoh Pulang**: `AGUNG_SISWOYO_46273_Pulang.jpg`

### Mekanisme Kolom Bukti Kehadiran (`evidence_url`):
1. **Link File Langsung**: Dihasilkan saat file foto berhasil diunggah ke storage cloud fisik (Google Drive API / RustFS Dedicated Server). Format URL: `https://drive.google.com/file/d/{fileId}/view` atau `https://rustfs.server/.../foto.jpg`.
2. **Link Folder Induk (Fallback)**: Jika presensi tersimpan langsung ke Vercel Postgres tanpa storage gateway pihak ketiga, sistem menyimpan link folder induk Google Drive untuk memudahkan admin mengakses direktori penyimpanan.

---

## 👁️ 3. Modul FaceID & Liveness Blink Detection (MediaPipe)

Fitur verifikasi kamera wajah mengadopsi standar biometrik keamanan:
- **Deteksi Kontur Wajah**: Menampilkan titik hijau (*green mesh landmarks*) presisi tinggi pada area mata, alis, bibir, dan garis rahang.
- **Kalibrasi Baseline Mata Terbuka**: Sistem secara dinamis mengukur rasio bukaan kelopak mata (*eyelid landmarks* 159/145 dan 386/374) saat mata terbuka normal.
- **Validasi 1x Kedipan Mata Alami**: Terverifikasi sukses saat terjadi penurunan rasio bukaan mata minimal **40%** dari baseline mata terbuka (*relative drop*), lalu mata terbuka kembali.
- **Strict Frontal Head Pose Alignment**: Mencegah lolos verifikasi jika wajah menghadap ke samping atau posisi miring ekstrim.
- **Single Native Modal**: Setelah terverifikasi, otomatis mengambil snapshot dan menampilkan modal sukses bawaan SI-ABSEN.

---

## 🗄️ 4. Skema Database PostgreSQL (Vercel Postgres / Neon)

Database PostgreSQL mengelola 3 tabel utama secara otomatis saat API `/api/sync` dipanggil:

### A. Tabel `users` (Manajemen Akun)
```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(32) NOT NULL,       -- 'admin' | 'pegawai'
  nip VARCHAR(64),
  skpd VARCHAR(255),
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

### B. Tabel `attendance` (Transaksi Presensi)
```sql
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  user_name VARCHAR(255) NOT NULL,
  nip VARCHAR(64),
  email VARCHAR(255),
  skpd VARCHAR(255),
  date VARCHAR(32) NOT NULL,       -- Format: DD/MM/YYYY
  time VARCHAR(32) NOT NULL,       -- Format: HH:mm:ss
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type VARCHAR(64) NOT NULL,       -- 'Masuk' | 'Pulang' | 'Izin' | 'Sakit' | 'Dinas Luar'
  category VARCHAR(32) DEFAULT 'HARIAN', -- 'HARIAN' | 'SHIFT'
  shift_type VARCHAR(32),          -- 'PAGI' | 'SORE' | 'MALAM'
  schedule_in VARCHAR(16),
  schedule_out VARCHAR(16),
  is_late BOOLEAN DEFAULT FALSE,
  late_minutes INT DEFAULT 0,
  is_early_leave BOOLEAN DEFAULT FALSE,
  early_leave_minutes INT DEFAULT 0,
  work_duration_minutes INT DEFAULT 0,
  status VARCHAR(64),              -- 'Tepat Waktu' | 'Terlambat X Menit'
  evidence_url TEXT,
  notes TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  distance_meters NUMERIC(10, 2)
);
```

### C. Tabel `settings` (Konfigurasi Aplikasi)
```sql
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🌐 5. Struktur URL & Routing Aplikasi

| URL Path | Halaman / Fungsi | Keterangan |
| :--- | :--- | :--- |
| **`/pegawai/login`** atau **`/`** | **Portal Login Pegawai** | Halaman login khusus pegawai dengan validasi Postgres & auto-cache kredensial. |
| **`/administrator/login`** | **Portal Login Administrator** | Halaman login aman khusus Super Admin (`admin@siabsen.go.id`). |
| **`/download`** (atau `/unduh`) | **Installer Aplikasi PWA** | Panduan instalasi PWA di smartphone Android (Chrome) dan iPhone (Safari). |
| **`/pegawai/dashboard`** | **Dashboard Pegawai (SIPP v5.6)** | Antarmuka presensi mobile: scan wajah biometrik, radar GPS, riwayat presensi harian & shift, monitoring jam kerja. |
| **`/administrator/dashboard`** | **Dashboard Administrator** | Monitoring presensi real-time, switcher Harian vs 3-Shift, Data Pegawai, Geofencing, Uji Koneksi Database Postgres, dan Unduh Excel Rekap. |
| **`/pegawai/register`** | **Pendaftaran Akun Pegawai** | Form registrasi pegawai baru terhubung langsung ke Vercel Postgres. |

---

## ⏱️ 6. Aturan Jam Kerja & Klasifikasi Kehadiran

### A. Dinas Harian (Target 41 Jam / Minggu)
- **Senin – Kamis**: `07:30 – 15:00` (7.5 Jam)
- **Jumat**: `07:00 – 11:30` (4.5 Jam)
- **Sabtu**: `07:00 – 13:00` (6.0 Jam)
- **Minggu**: Libur Rutin
- **Total Target**: **41 Jam / Minggu**

### B. Dinas Muter (3 Shift)
- **Dinas Pagi**: `07:00 – 14:00` (7.0 Jam)
- **Dinas Sore**: `14:00 – 21:00` (7.0 Jam)
- **Dinas Malam**: `21:00 – 07:00` (10.0 Jam, mendukung perhitungan lintas pergantian hari / *cross-midnight*).

### C. Klasifikasi Khusus
- **D3 (Dinas Luar 3 Hari / Tugas Khusus)**: Dicatat dengan akumulasi jam kerja otomatis.
- **Dinas Luar (DL)**: Presensi tugas luar kantor dengan radius GPS fleksibel.
- **Izin & Sakit**: Upload surat dokter / bukti keterangan yang disimpan ke storage cloud.

---

## 📊 7. Modul Laporan & Export Multi-Tab Excel

Dashboard Admin menyediakan tombol **"Unduh Excel Rekap"** yang menghasilkan file `.xlsx` berisi lembar kerja (sheet) lengkap via SheetJS:

1. **Sheet 1: Absen Masuk** (Log presensi masuk & izin harian).
2. **Sheet 2: Absen Pulang** (Log presensi pulang & durasi jam kerja).
3. **Sheet 3: Rekap Mingguan M1 - M5** (Matriks kehadiran mingguan per pegawai).
4. **Sheet 4: Rekap Total Perminggu** (Akumulasi target jam kerja 41 jam).
5. **Sheet 5: Rekap Bulanan** (Statistik kehadiran, keterlambatan, dan rekapitulasi akhir).

---

## ⚙️ 8. Panduan Menghubungkan Vercel Postgres

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) ➔ Pilih project **`SI-ABSEN`**.
2. Masuk ke tab **Storage** ➔ Klik **Create Database** ➔ Pilih **Postgres (Neon)**.
3. Klik **Connect to Project** (Vercel otomatis menyediakan environment variable `POSTGRES_URL`).
4. Pada Dashboard Admin ➔ Tab **Pengaturan** ➔ Klik **"🧪 Uji Koneksi Vercel Postgres & Drive"** untuk memastikan database cloud aktif.

---

## 🔒 9. Kredensial Default Administrator

- **Email**: `admin@siabsen.go.id`
- **Password**: `admin`
