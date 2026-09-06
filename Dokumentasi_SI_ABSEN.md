# Dokumentasi Sistem SI-ABSEN

*Aplikasi Absensi & Monitoring Pegawai Berbasis PWA*

## 1. Arsitektur & Lingkungan Aplikasi
- **Framework:** React + Vite (Mode SPA - Single Page Application)
- **Desain UI:** Vanilla CSS (`index.css`) & Lucide React Icons.
- **Progressive Web App (PWA):** Menggunakan `vite-plugin-pwa`. Aplikasi siap di-install menjadi *Full Screen* (WebAPK) di Android **dengan syarat** harus menggunakan protokol koneksi yang aman (`HTTPS` / Domain Publik yang valid).
- **Penyimpanan Database Sementara:** `localStorage` browser. *(Data akan hilang jika pengguna melakukan Clear Data/Cache pada browser).*
- **Integrasi GPS & Maps:** Menggunakan `react-leaflet` & Leaflet.js. 

## 2. Fitur Utama yang Tersedia
### 👨‍💼 Panel Admin (Mode Administrator)
- **Akses:** Email: `admin@siabsen.go.id` / Password: `admin`
- **Dashboard Metrik:** Memantau jumlah total pegawai, kehadiran tepat waktu, terlambat, dan cuti/izin secara *real-time*.
- **Data Karyawan (CRUD):** 
  - Validasi ketat pendaftaran ganda (1 NIP hanya untuk 1 Akun).
  - Admin dapat Menambahkan, Mengedit (Password, Email, NIP, SKPD), dan Menghapus akun pegawai.
- **Rekap Absensi (Target 41 Jam):** Menampilkan rincian hari-per-hari jam masuk, jam pulang, akumulasi durasi, serta status ketuntasan target 41 jam seminggu. 
- **Export Data:** Dapat diekspor langsung ke `.xlsx` (Excel).
- **Geofencing & Setting:** Admin bisa menggeser Pin di Peta (Leaflet) untuk mengunci titik ordinat Puskesmas / Kantor, mengatur radius absensi (meter), dan menautkan *Webhook Google Apps Script*.

### 👷‍♂️ Panel Pegawai
- **Kunci Sesi (Persistent Login):** Saat pegawai masuk, sistem menahan memori login tersebut, sehingga pegawai **tidak perlu login berulang kali** setiap kali membuka aplikasi dari HP.
- **Kamera Presensi:** Terintegrasi dengan webcam/kamera HP.
- **Geolokasi Presensi:** 
  - Wajib menghidupkan GPS.
  - Jika berada di luar jangkauan (radius) yang ditetapkan Admin, tombol absen dikunci.
- **Catatan & Bukti (G-Drive):** Pegawai yang sedang Dinas Luar, Sakit, Izin, atau Cuti wajib mencentang opsi Keterangan dan menautkan Link G-Drive (URL Foto/Surat) agar terekam oleh sistem admin.

## 3. Langkah Rencana Deployment
Karena sistem Android mewajibkan akses HTTPS (SSL Valid) agar PWA dapat menjadi *Full Screen* layaknya aplikasi `.apk` (menyembunyikan bar URL Chrome), maka alur peluncuran yang direncanakan adalah:

1. **Commit ke GitHub:** 
   Menyimpan *source code* secara *online* dan *version control*.
2. **Hosting ke Vercel:** 
   Menggunakan *platform* Vercel untuk menarik kode dari GitHub. Vercel otomatis memberikan SSL (`HTTPS`) secara gratis.
3. **Pengujian PWA di HP:** 
   Pegawai membuka link Vercel tersebut di Android. Ketika di-install ke *Home Screen*, PWA akan 100% *Full Screen*.

## 4. Rencana Pengembangan Selanjutnya (To-Do)
- [ ] Mengganti `localStorage` dengan Database permanen seperti **Firebase** (Firestore) atau **Supabase**, karena `localStorage` tidak dapat membagikan data absensi pegawai ke HP/komputer Admin (hanya tersimpan lokal di perangkat pegawai).
- [ ] Implementasi autentikasi *backend* (Auth).
- [ ] *[Tambahkan rencana lain di sini]*
