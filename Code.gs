// =========================================================================================
// SI-ABSEN GOOGLE APPS SCRIPT BACKEND (GOOGLE SPREADSHEET & GOOGLE DRIVE STORAGE)
// =========================================================================================
// Panduan Singkat Pemasangan:
// 1. Buat Spreadsheet baru di Google Drive (atau gunakan yang sudah ada).
// 2. Buat Folder baru di Google Drive untuk bukti foto (atau biarkan dibuat otomatis).
// 3. Pada Spreadsheet, buka menu: Extensions (Ekstensi) > Apps Script.
// 4. Hapus seluruh kode yang ada, lalu salin dan tempel (paste) seluruh kode di bawah ini.
// 5. Jalankan fungsi 'setupSpreadsheetDatabase()' satu kali untuk membuat sheet & header otomatis.
// 6. Klik 'Deploy' (Terapkan) > 'New Deployment' (Penerapan Baru) > Pilih 'Web App' (Aplikasi Web).
// 7. Konfigurasi:
//    - Description: SI-ABSEN Backend v2.0
//    - Execute as (Jalankan sebagai): Me (Email Google Anda)
//    - Who has access (Siapa yang memiliki akses): Anyone (Siapa saja)
// 8. Klik 'Deploy', izinkan akses (Authorize Access), lalu salin URL Web App (.exec).
// 9. Tempelkan URL Web App, Link Spreadsheet, dan Link Folder Drive pada Pengaturan SI-ABSEN.
// =========================================================================================

const DEFAULT_ROOT_FOLDER_NAME = "SI_ABSEN_EVIDENCES";

const MONTH_NAMES = [
  "01-Januari", "02-Februari", "03-Maret", "04-April",
  "05-Mei", "06-Juni", "07-Juli", "08-Agustus",
  "09-September", "10-Oktober", "11-November", "12-Desember"
];

/**
 * Ekstrak ID dari URL Google Spreadsheet atau kembalikan ID mentah
 */
function extractSpreadsheetId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Ekstrak ID dari URL Google Drive Folder atau kembalikan ID mentah
 */
function extractFolderId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Mendapatkan Spreadsheet aktif atau berdasarkan ID/URL
 */
function getSpreadsheet(spreadsheetIdOrUrl) {
  if (spreadsheetIdOrUrl) {
    const id = extractSpreadsheetId(spreadsheetIdOrUrl);
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      Logger.log("Gagal membuka spreadsheet by ID, gunakan active: " + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Mendapatkan Root Folder Drive
 */
function getRootDriveFolder(folderIdOrUrl) {
  if (folderIdOrUrl) {
    const id = extractFolderId(folderIdOrUrl);
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      Logger.log("Gagal membuka folder by ID, fallback to name: " + e.toString());
    }
  }
  
  const folders = DriveApp.getFoldersByName(DEFAULT_ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(DEFAULT_ROOT_FOLDER_NAME);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

/**
 * Membuat struktur folder bertingkat di Google Drive:
 * Root Folder / [Tahun] / [Bulan] / [Tanggal] / [Absen Masuk | Absen Pulang]
 */
function getOrCreateNestedFolder(rootFolder, dateObj, categoryType) {
  const year = dateObj.getFullYear().toString();
  const monthName = MONTH_NAMES[dateObj.getMonth()];
  
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const dateStr = yyyy + "-" + mm + "-" + dd;
  
  const typeFolder = (categoryType && categoryType.toLowerCase().includes("pulang")) 
    ? "Absen Pulang" 
    : "Absen Masuk";

  function getOrSubFolder(parent, name) {
    const subs = parent.getFoldersByName(name);
    if (subs.hasNext()) {
      return subs.next();
    }
    const created = parent.createFolder(name);
    created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return created;
  }

  // 1. Level Tahun (contoh: 2026)
  const yearFolder = getOrSubFolder(rootFolder, year);
  // 2. Level Bulan (contoh: 09-September)
  const monthFolder = getOrSubFolder(yearFolder, monthName);
  // 3. Level Tanggal (contoh: 2026-09-06)
  const dateFolder = getOrSubFolder(monthFolder, dateStr);
  // 4. Level Tipe Presensi (Absen Masuk / Absen Pulang)
  const targetFolder = getOrSubFolder(dateFolder, typeFolder);

  return targetFolder;
}

/**
 * Setup Database Awal: Membuat Sheet & Folder Otomatis
 */
function setupSpreadsheetDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet Users
  let userSheet = ss.getSheetByName("Users");
  if (!userSheet) {
    userSheet = ss.insertSheet("Users");
    userSheet.appendRow(["ID_USER", "NAMA_LENGKAP", "EMAIL", "PASSWORD", "ROLE", "NIP", "SKPD", "TANGGAL_DAFTAR"]);
    userSheet.getRange("A1:H1").setFontWeight("bold").setBackground("#00695C").setFontColor("#FFFFFF");
    userSheet.setFrozenRows(1);
    userSheet.appendRow(["U-ADMIN-01", "Administrator SI-ABSEN", "admin@siabsen.go.id", "admin", "admin", "198501012010011001", "UPTD Puskesmas Cermee", new Date().toISOString()]);
  }

  // 2. Sheet Absen Masuk
  let masukSheet = ss.getSheetByName("Absen Masuk");
  if (!masukSheet) {
    masukSheet = ss.insertSheet("Absen Masuk");
    masukSheet.appendRow(["Timestamp", "Email Address", "Nama Pegawai", "Tipe Kehadiran", "Bukti Foto / Surat (Drive URL)", "Nama-Tanggal-Keterangan", "Tanggal", "Jam", "Status Waktu", "Lokasi Koordinat GPS", "Kategori Presensi"]);
    masukSheet.getRange("A1:K1").setFontWeight("bold").setBackground("#00695C").setFontColor("#FFFFFF");
    masukSheet.setFrozenRows(1);
  }

  // 3. Sheet Absen Pulang
  let pulangSheet = ss.getSheetByName("Absen Pulang");
  if (!pulangSheet) {
    pulangSheet = ss.insertSheet("Absen Pulang");
    pulangSheet.appendRow(["Timestamp", "Email Address", "Nama Pegawai", "Bukti Foto Pulang (Drive URL)", "Nama-Tanggal-Keterangan", "Tanggal", "Jam", "Status Pulang", "Jumlah Jam Kerja", "Lokasi Koordinat GPS", "Kategori Presensi"]);
    pulangSheet.getRange("A1:K1").setFontWeight("bold").setBackground("#00695C").setFontColor("#FFFFFF");
    pulangSheet.setFrozenRows(1);
  }

  // 4. Buat Root Folder Drive
  const root = getRootDriveFolder();
  return "Setup Berhasil! Folder Utama Drive: '" + root.getName() + "' (ID: " + root.getId() + ") & Seluruh Sheet Telah Siap.";
}

/**
 * Handle HTTP POST Requests dari Aplikasi React SI-ABSEN
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, message: "Payload kosong." });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data || {};
    const customSpreadsheetId = payload.spreadsheetId || payload.spreadsheetUrl;
    const customFolderId = payload.folderId || payload.folderUrl;

    const ss = getSpreadsheet(customSpreadsheetId);
    const rootFolder = getRootDriveFolder(customFolderId);

    // ACTION: Uji Koneksi
    if (action === "TEST_CONNECTION") {
      return responseJSON({
        success: true,
        message: "Koneksi Google Apps Script, Spreadsheet & Google Drive Berhasil!",
        spreadsheetName: ss ? ss.getName() : "Spreadsheet Aktif",
        spreadsheetId: ss ? ss.getId() : "-",
        rootFolderName: rootFolder ? rootFolder.getName() : "-",
        rootFolderId: rootFolder ? rootFolder.getId() : "-"
      });
    }

    // ACTION: Simpan User Baru / Sinkronisasi Data Pegawai
    if (action === "SYNC_USERS" || action === "REGISTER_USER") {
      let userSheet = ss.getSheetByName("Users");
      if (!userSheet) {
        userSheet = ss.insertSheet("Users");
        userSheet.appendRow(["ID_USER", "NAMA_LENGKAP", "EMAIL", "PASSWORD", "ROLE", "NIP", "SKPD", "TANGGAL_DAFTAR"]);
      }
      
      const user = data;
      userSheet.appendRow([
        user.id || ("U-" + Date.now()),
        user.name,
        user.email,
        user.password,
        user.role || "pegawai",
        user.nip || "",
        user.skpd || "",
        new Date().toISOString()
      ]);
      return responseJSON({ success: true, message: "User berhasil disinkronkan ke Spreadsheet." });
    }

    // Process Foto Base64 -> Simpan ke Struktur Folder Google Drive Bertingkat
    let driveFileUrl = data.evidenceUrl || "";
    if (data.evidenceSnapshot && data.evidenceSnapshot.indexOf("data:image") !== -1) {
      try {
        const now = data.date ? new Date(data.date) : new Date();
        const validDate = isNaN(now.getTime()) ? new Date() : now;
        
        // Buat atau dapatkan folder bertingkat: Tahun / Bulan / Tanggal / [Absen Masuk | Absen Pulang]
        const nestedFolder = getOrCreateNestedFolder(rootFolder, validDate, action === "SUBMIT_PULANG" ? "Absen Pulang" : (data.type || "Absen Masuk"));
        
        const contentType = data.evidenceSnapshot.substring(5, data.evidenceSnapshot.indexOf(';'));
        const base64Data = data.evidenceSnapshot.substring(data.evidenceSnapshot.indexOf(',') + 1);
        
        const cleanName = (data.userName || "PEGAWAI").replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = cleanName + "_" + (data.compositeKey || Date.now()) + ".jpg";
        
        const decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
        const file = nestedFolder.createFile(decodedBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Ambil URL file Drive
        driveFileUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      } catch (errDrive) {
        Logger.log("Gagal simpan ke Google Drive: " + errDrive.toString());
      }
    }

    // ACTION: Presensi Masuk
    if (action === "SUBMIT_MASUK" || action === "SUBMIT_LEAVE") {
      let masukSheet = ss.getSheetByName("Absen Masuk");
      if (!masukSheet) {
        masukSheet = ss.insertSheet("Absen Masuk");
        masukSheet.appendRow(["Timestamp", "Email Address", "Nama Pegawai", "Tipe Kehadiran", "Bukti Foto / Surat (Drive URL)", "Nama-Tanggal-Keterangan", "Tanggal", "Jam", "Status Waktu", "Lokasi Koordinat GPS", "Kategori Presensi"]);
      }
      
      masukSheet.appendRow([
        data.timestamp || new Date().toLocaleString(),
        data.email,
        data.userName,
        data.type || "Masuk",
        driveFileUrl,
        data.compositeKey,
        data.date,
        data.time,
        data.status || "Tepat Waktu",
        data.location || "",
        data.category || "HARIAN"
      ]);
      return responseJSON({ success: true, fileUrl: driveFileUrl, message: "Absen Masuk berhasil dicatat ke Google Sheets & Drive!" });
    }

    // ACTION: Presensi Pulang
    if (action === "SUBMIT_PULANG") {
      let pulangSheet = ss.getSheetByName("Absen Pulang");
      if (!pulangSheet) {
        pulangSheet = ss.insertSheet("Absen Pulang");
        pulangSheet.appendRow(["Timestamp", "Email Address", "Nama Pegawai", "Bukti Foto Pulang (Drive URL)", "Nama-Tanggal-Keterangan", "Tanggal", "Jam", "Status Pulang", "Jumlah Jam Kerja", "Lokasi Koordinat GPS", "Kategori Presensi"]);
      }
      
      pulangSheet.appendRow([
        data.timestamp || new Date().toLocaleString(),
        data.email,
        data.userName,
        driveFileUrl,
        data.compositeKey,
        data.date,
        data.time,
        data.status || "Tepat Waktu",
        data.workDuration || "",
        data.location || "",
        data.category || "HARIAN"
      ]);
      return responseJSON({ success: true, fileUrl: driveFileUrl, message: "Absen Pulang berhasil dicatat ke Google Sheets & Drive!" });
    }

    return responseJSON({ success: false, message: "Aksi '" + action + "' tidak dikenali." });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 24px; text-align: center;">
      <h2 style="color: #00695C;">🟢 SI-ABSEN Google Backend API Online</h2>
      <p style="color: #555;">Webhook siap menerima request sinkronisasi Google Sheets & Google Drive.</p>
    </div>
  `);
}

/**
 * Helper Return JSON Response
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}