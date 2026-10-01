/**
 * Ready-to-use Google Apps Script Template for SI-ABSEN
 * Allows 100% free database & storage using Google Spreadsheet & Google Drive.
 */

export const GAS_CODE_TEMPLATE = `/**
 * ================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SI-ABSEN
 * Database: Google Spreadsheet (Terstruktur Lengkap Sesuai Menu SI-ABSEN)
 * Storage: Google Drive Folder (Penyimpanan Foto Bukti Presensi)
 * ================================================================
 * 
 * DAFTAR SHEET YANG DIKELOLA SECARA OTOMATIS:
 * 1. Super Admin         -> Khusus Akun Super Administrator (Terpisah)
 * 2. Data Pegawai        -> Khusus Akun Pegawai (Tanpa Super Admin)
 * 3. Absen Masuk         -> Log Presensi Masuk (Harian, Shift, D3)
 * 4. Absen Pulang        -> Log Presensi Pulang (Harian, Shift, D3)
 * 5. Daftar Dinas Luar   -> Log Khusus Dinas Luar
 * 6. Daftar Izin & Cuti  -> Log Pengajuan Izin, Sakit, & Cuti
 * 7. Daftar D3           -> Log Presensi Khusus Dinas 3 (D3)
 * 8. Rekap Semua Jenis   -> Log Lengkap Semua Jenis Transaksi Presensi
 * 9. Rekap Perminggu     -> Ringkasan Jam Kerja Mingguan Pegawai (Target 41 Jam)
 * 10. Rekap Bulanan      -> Statistik Akumulasi Bulanan (Target 164 Jam)
 * 11. Pengaturan SKPD    -> Konfigurasi Titik Lokasi, Radius, & Instansi
 * ================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'GET_ALL_DATA';
  var result = {};

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);

    if (action === 'GET_ALL_DATA') {
      var adminList = getFormattedAdmins(ss.getSheetByName('Super Admin'));
      var employeeList = getFormattedEmployees(ss.getSheetByName('Data Pegawai'));
      var allUsers = adminList.concat(employeeList);
      
      var allAttendance = getFormattedAttendance(ss.getSheetByName('Rekap Semua Jenis') || ss.getSheetByName('Attendance'));

      result = {
        success: true,
        users: allUsers,
        attendance: allAttendance,
        settings: getSettingsData(ss.getSheetByName('Pengaturan SKPD') || ss.getSheetByName('Settings')),
        engine: 'GOOGLE_SPREADSHEET_GAS',
        timestamp: new Date().toISOString()
      };
    } else if (action === 'TEST_CONNECTION' || action === 'TEST_GOOGLE') {
      result = {
        success: true,
        message: '✅ Google Spreadsheet & Apps Script Berhasil Terhubung!',
        databaseEngine: 'GOOGLE_SPREADSHEET_GAS',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = {};
  try {
    var contents = e.postData ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || 'INFO';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);

    // 1. SUBMIT ATTENDANCE (MASUK / PULANG / DINAS LUAR / IZIN)
    if (action === 'SUBMIT_ATTENDANCE' || action === 'SUBMIT_MASUK' || action === 'SUBMIT_PULANG') {
      var record = contents.data || contents.record || contents;
      var photoUrl = '';

      // Upload foto ke Google Drive dengan struktur folder bertingkat (STORAGE > Bulan > Tanggal)
      if (record.evidenceSnapshot && contents.folderId) {
        try {
          photoUrl = saveImageToDrive(record.evidenceSnapshot, contents.folderId, record.userName, record.type, record.date, record.time);
          record.evidenceUrl = photoUrl;
        } catch (errDrive) {
          Logger.log('Drive upload err: ' + errDrive);
        }
      }

      // Simpan ke sheet yang sesuai
      distributeAttendanceRecord(ss, record);

      result = {
        success: true,
        message: 'Presensi (' + record.userName + ') berhasil dicatat ke Google Spreadsheet & Drive.',
        evidenceUrl: record.evidenceUrl || '',
        timestamp: new Date().toISOString()
      };
    }
    // 2. REGISTER / SYNC USER (SUPER ADMIN VS PEGAWAI TERPISAH)
    else if (action === 'REGISTER_USER' || action === 'SYNC_USER' || action === 'REGISTER_PEGAWAI' || action === 'UPDATE_ADMIN' || action === 'UPDATE_USER') {
      var user = contents.data || contents.user || contents;
      
      if (user.role === 'admin') {
        appendOrUpdateAdmin(ss.getSheetByName('Super Admin'), user);
      } else {
        appendOrUpdateEmployee(ss.getSheetByName('Data Pegawai'), user);
      }

      result = {
        success: true,
        message: 'Akun ' + (user.name || '') + ' (' + (user.role || 'pegawai') + ') berhasil disimpan.',
        user: user,
        timestamp: new Date().toISOString()
      };
    }
    // 3. DELETE ATTENDANCE
    else if (action === 'DELETE_ATTENDANCE_BULK') {
      var ids = contents.recordIds || [];
      deleteRowsById(ss.getSheetByName('Rekap Semua Jenis'), ids, 0);
      deleteRowsById(ss.getSheetByName('Absen Masuk'), ids, 0);
      deleteRowsById(ss.getSheetByName('Absen Pulang'), ids, 0);
      deleteRowsById(ss.getSheetByName('Daftar Dinas Luar'), ids, 0);
      deleteRowsById(ss.getSheetByName('Daftar Izin & Cuti'), ids, 0);
      deleteRowsById(ss.getSheetByName('Daftar D3'), ids, 0);
      result = { success: true, message: ids.length + ' data presensi dihapus.' };
    }
    // 4. TEST CONNECTION
    else if (action === 'TEST_CONNECTION' || action === 'TEST_GOOGLE') {
      result = {
        success: true,
        message: '✅ Google Spreadsheet & Apps Script Berhasil Terhubung!',
        databaseEngine: 'GOOGLE_SPREADSHEET_GAS',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// INSIALISASI SELURUH SHEET SESUAI DENGAN MENU DI DASHBOARD SI-ABSEN
function initSheetsIfNeeded(ss) {
  var requiredSheets = [
    {
      name: 'Super Admin',
      headers: ['ID_ADMIN', 'NAMA_LENGKAP', 'EMAIL', 'PASSWORD', 'ROLE', 'STATUS', 'TERAKHIR_LOGIN', 'TANGGAL_DIBUAT'],
      initRow: ['U-ADMIN-01', 'Administrator SI-ABSEN', 'admin@siabsen.go.id', 'admin', 'admin', 'Aktif', '-', new Date().toISOString()]
    },
    {
      name: 'Data Pegawai',
      headers: ['ID_PEGAWAI', 'NAMA_LENGKAP', 'NIP', 'EMAIL', 'PASSWORD', 'SKPD', 'STATUS_AKUN', 'TANGGAL_DAFTAR']
    },
    {
      name: 'Absen Masuk',
      headers: ['ID_LOG', 'WAKTU_SUBMIT', 'NIP', 'NAMA_PEGAWAI', 'SKPD', 'TANGGAL', 'JAM_MASUK', 'JENIS_PRESENSI', 'KATEGORI_SHIFT', 'STATUS', 'BUKTI_FOTO', 'LOKASI_GPS']
    },
    {
      name: 'Absen Pulang',
      headers: ['ID_LOG', 'WAKTU_SUBMIT', 'NIP', 'NAMA_PEGAWAI', 'SKPD', 'TANGGAL', 'JAM_PULANG', 'JENIS_PRESENSI', 'KATEGORI_SHIFT', 'STATUS', 'JUMLAH_JAM_KERJA', 'BUKTI_FOTO']
    },
    {
      name: 'Daftar Dinas Luar',
      headers: ['ID_LOG', 'WAKTU_SUBMIT', 'NIP', 'NAMA_PEGAWAI', 'SKPD', 'TANGGAL', 'JAM_PENGAJUAN', 'LOKASI_TUJUAN', 'KETERANGAN_TUGAS', 'BUKTI_FOTO_LAPANGAN', 'STATUS']
    },
    {
      name: 'Daftar Izin & Cuti',
      headers: ['ID_LOG', 'WAKTU_SUBMIT', 'NIP', 'NAMA_PEGAWAI', 'SKPD', 'JENIS_PENGAJUAN', 'TANGGAL_MULAI', 'TANGGAL_SELESAI', 'ALASAN_KETERANGAN', 'BUKTI_SURAT_DOKTER', 'STATUS']
    },
    {
      name: 'Daftar D3',
      headers: ['ID_LOG', 'WAKTU_SUBMIT', 'NIP', 'NAMA_PEGAWAI', 'SKPD', 'TANGGAL', 'JAM', 'TIPE_PRESENSI', 'JUMLAH_JAM_KERJA', 'LOKASI', 'BUKTI_FOTO', 'STATUS']
    },
    {
      name: 'Rekap Semua Jenis',
      headers: ['ID_LOG', 'TIMESTAMP', 'NIP', 'NAMA_PEGAWAI', 'EMAIL', 'SKPD', 'TANGGAL', 'JAM', 'JENIS', 'KATEGORI', 'STATUS', 'DURASI_JAM', 'BUKTI_FOTO', 'LOKASI']
    },
    {
      name: 'Pengaturan SKPD',
      headers: ['KUNCI_PENGATURAN', 'NILAI', 'TERAKHIR_DIPERBARUI']
    }
  ];

  for (var i = 0; i < requiredSheets.length; i++) {
    var def = requiredSheets[i];
    var sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
        .setBackground('#004D40')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
      
      if (def.initRow) {
        sheet.appendRow(def.initRow);
      }
    }
  }

  // Hapus Sheet1 default kosong jika ada
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch(e) {}
  }
}

// DISTRIBUSI TRANSAKSI PRESENSI KE SHEET-SHEET SESUAI KATEGORI
function distributeAttendanceRecord(ss, rec) {
  var id = rec.id || ('ATT-' + Date.now());
  var timestamp = rec.timestamp || (rec.date + ' ' + rec.time);
  var type = rec.type || 'Masuk';
  var category = rec.category || 'HARIAN';
  var shiftLabel = rec.shiftName || rec.shiftType || (category === 'D3' ? 'D3' : 'Harian');

  // 1. Catat ke Master Sheet: Rekap Semua Jenis
  var rekapSheet = ss.getSheetByName('Rekap Semua Jenis');
  if (rekapSheet) {
    rekapSheet.appendRow([
      id,
      timestamp,
      rec.nip || '-',
      rec.userName || '',
      rec.email || '',
      rec.skpd || 'UPTD Puskesmas Cermee',
      rec.date || '',
      rec.time || '',
      type,
      category,
      rec.status || 'Tepat Waktu',
      rec.workDuration || '-',
      rec.evidenceUrl || '',
      rec.location || ''
    ]);
  }

  // 2. Jika Presensi Masuk (Harian, Shift, D3 Masuk)
  if (type === 'Masuk' || type === 'HARIAN_MASUK' || type === 'Shift Masuk' || type === 'SHIFT_MASUK' || type === 'D3 Masuk' || type === 'D3') {
    var masukSheet = ss.getSheetByName('Absen Masuk');
    if (masukSheet) {
      masukSheet.appendRow([
        id,
        timestamp,
        rec.nip || '-',
        rec.userName || '',
        rec.skpd || 'UPTD Puskesmas Cermee',
        rec.date || '',
        rec.time || '',
        type,
        shiftLabel,
        rec.status || 'Tepat Waktu',
        rec.evidenceUrl || '',
        rec.location || ''
      ]);
    }
  }

  // 3. Jika Presensi Pulang (Harian, Shift, D3 Pulang)
  if (type === 'Pulang' || type === 'HARIAN_PULANG' || type === 'Shift Pulang' || type === 'SHIFT_PULANG' || type === 'D3 Pulang') {
    var pulangSheet = ss.getSheetByName('Absen Pulang');
    if (pulangSheet) {
      pulangSheet.appendRow([
        id,
        timestamp,
        rec.nip || '-',
        rec.userName || '',
        rec.skpd || 'UPTD Puskesmas Cermee',
        rec.date || '',
        rec.time || '',
        type,
        shiftLabel,
        rec.status || 'Tepat Waktu',
        rec.workDuration || '-',
        rec.evidenceUrl || ''
      ]);
    }
  }

  // 4. Jika Dinas Luar
  if (type === 'Dinas Luar' || category === 'DINAS_LUAR') {
    var dlSheet = ss.getSheetByName('Daftar Dinas Luar');
    if (dlSheet) {
      dlSheet.appendRow([
        id,
        timestamp,
        rec.nip || '-',
        rec.userName || '',
        rec.skpd || 'UPTD Puskesmas Cermee',
        rec.date || '',
        rec.time || '',
        rec.location || 'Luar Instansi',
        rec.notes || rec.reason || 'Dinas Luar',
        rec.evidenceUrl || '',
        'Terverifikasi'
      ]);
    }
  }

  // 5. Jika Izin / Sakit / Cuti
  if (type === 'Izin' || type === 'Sakit' || type === 'Cuti') {
    var izinSheet = ss.getSheetByName('Daftar Izin & Cuti');
    if (izinSheet) {
      izinSheet.appendRow([
        id,
        timestamp,
        rec.nip || '-',
        rec.userName || '',
        rec.skpd || 'UPTD Puskesmas Cermee',
        type,
        rec.startDate || rec.date || '',
        rec.endDate || rec.date || '',
        rec.reason || rec.notes || '-',
        rec.evidenceUrl || '',
        'Disetujui'
      ]);
    }
  }

  // 6. Jika Presensi D3
  if (type === 'D3' || type === 'D3 Masuk' || type === 'D3 Pulang' || category === 'D3') {
    var d3Sheet = ss.getSheetByName('Daftar D3');
    if (d3Sheet) {
      d3Sheet.appendRow([
        id,
        timestamp,
        rec.nip || '-',
        rec.userName || '',
        rec.skpd || 'UPTD Puskesmas Cermee',
        rec.date || '',
        rec.time || '',
        type,
        rec.workDuration || '-',
        rec.location || '',
        rec.evidenceUrl || '',
        rec.status || 'Hadir (D3)'
      ]);
    }
  }
}

// FORMATTER: AMBIL DATA SUPER ADMIN KHUSUS
function getFormattedAdmins(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (r[0] || r[2]) {
      result.push({
        id: String(r[0] || 'U-ADMIN-01'),
        name: String(r[1] || 'Administrator'),
        email: String(r[2] || 'admin@siabsen.go.id').toLowerCase().trim(),
        password: String(r[3] || 'admin'),
        role: 'admin',
        nip: '-',
        skpd: 'Pusat',
        status: String(r[5] || 'Aktif'),
        lastLogin: r[6] || null,
        createdAt: r[7] || new Date().toISOString()
      });
    }
  }
  return result;
}

// FORMATTER: AMBIL DATA PEGAWAI KHUSUS (MURNI PEGAWAI)
function getFormattedEmployees(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (r[0] || r[3]) {
      result.push({
        id: String(r[0] || ('U-' + Date.now())),
        name: String(r[1] || ''),
        nip: String(r[2] || ''),
        email: String(r[3] || '').toLowerCase().trim(),
        password: String(r[4] || '12345678'),
        role: 'pegawai',
        skpd: String(r[5] || 'UPTD Puskesmas Cermee'),
        status: String(r[6] || 'Aktif'),
        createdAt: r[7] || new Date().toISOString()
      });
    }
  }
  return result;
}

// FORMATTER: AMBIL DATA PRESENSI
function getFormattedAttendance(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (r[0] || r[3]) {
      result.push({
        id: String(r[0]),
        timestamp: String(r[1]),
        nip: String(r[2]),
        userName: String(r[3]),
        email: String(r[4]),
        skpd: String(r[5]),
        date: String(r[6]),
        time: String(r[7]),
        type: String(r[8]),
        category: String(r[9]),
        status: String(r[10]),
        workDuration: String(r[11]),
        evidenceUrl: String(r[12]),
        location: String(r[13])
      });
    }
  }
  return result;
}

function appendOrUpdateAdmin(sheet, admin) {
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === admin.id || (admin.email && data[i][2] === admin.email)) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    admin.id || 'U-ADMIN-01',
    admin.name || 'Administrator SI-ABSEN',
    (admin.email || 'admin@siabsen.go.id').toLowerCase().trim(),
    admin.password || 'admin',
    'admin',
    admin.status || 'Aktif',
    admin.lastLogin || new Date().toISOString(),
    admin.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function appendOrUpdateEmployee(sheet, emp) {
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === emp.id || (emp.email && data[i][3] === emp.email) || (emp.nip && data[i][2] === emp.nip)) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    emp.id || ('U-' + Date.now()),
    emp.name || '',
    emp.nip || '',
    (emp.email || '').toLowerCase().trim(),
    emp.password || '12345678',
    emp.skpd || 'UPTD Puskesmas Cermee',
    emp.status || 'Aktif',
    emp.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteRowsById(sheet, idList, colIndex) {
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var idSet = {};
  for (var k = 0; k < idList.length; k++) idSet[idList[k]] = true;

  for (var i = data.length - 1; i >= 1; i--) {
    if (idSet[data[i][colIndex || 0]]) {
      sheet.deleteRow(i + 1);
    }
  }
}

function getSettingsData(sheet) {
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < rows.length; i++) {
    try {
      out[rows[i][0]] = JSON.parse(rows[i][1]);
    } catch(e) {
      out[rows[i][0]] = rows[i][1];
    }
  }
  return out;
}

function getOrCreateSubFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newFolder = parentFolder.createFolder(folderName);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

function saveImageToDrive(base64Data, rootFolderId, userName, type, dateStr, timeStr) {
  var rootFolder = DriveApp.getFolderById(rootFolderId);

  var now = new Date();
  var day = String(now.getDate()).padStart(2, '0');
  var monthNum = String(now.getMonth() + 1).padStart(2, '0');
  var monthIndex = now.getMonth();
  var year = now.getFullYear();

  var MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  if (dateStr) {
    var matchDMY = String(dateStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (matchDMY) {
      day = String(parseInt(matchDMY[1], 10)).padStart(2, '0');
      var m = parseInt(matchDMY[2], 10);
      monthNum = String(m).padStart(2, '0');
      monthIndex = Math.max(0, Math.min(11, m - 1));
      year = matchDMY[3];
    } else {
      var matchYMD = String(dateStr).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (matchYMD) {
        year = matchYMD[1];
        var m2 = parseInt(matchYMD[2], 10);
        monthNum = String(m2).padStart(2, '0');
        monthIndex = Math.max(0, Math.min(11, m2 - 1));
        day = String(parseInt(matchYMD[3], 10)).padStart(2, '0');
      }
    }
  }

  // 1. Folder Bulan (Contoh: "Oktober")
  var monthFolderName = MONTH_NAMES[monthIndex];
  var monthFolder = getOrCreateSubFolder(rootFolder, monthFolderName);

  // 2. Folder Tanggal format dd-mm-yyyy (Contoh: "01-10-2026")
  var dateFolderName = day + "-" + monthNum + "-" + year;
  var dateFolder = getOrCreateSubFolder(monthFolder, dateFolderName);

  // 3. Simpan File Foto Bukti Presensi
  var cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  var decoded = Utilities.base64Decode(cleanBase64);

  var cleanName = (userName || 'Pegawai').replace(/[^a-zA-Z0-9_-]/g, '_');
  var cleanType = (type || 'Absen').replace(/[^a-zA-Z0-9_-]/g, '_');
  var timeClean = (timeStr || '').replace(/:/g, '-');
  var fileName = cleanName + '_' + cleanType + (timeClean ? '_' + timeClean : '_' + Date.now()) + '.jpg';

  var blob = Utilities.newBlob(decoded, 'image/jpeg', fileName);
  var file = dateFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// FUNGSI KHUSUS UNTUK MEMPERSIAPKAN / MERAPIKAN STRUKTUR SPREADSHEET MANUAL SATU KALI KLIK
function setupSpreadsheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNeeded(ss);
  Logger.log('✅ Struktur Database Spreadsheet SI-ABSEN Berhasil Dibuat Lengkap!');
}
`;
