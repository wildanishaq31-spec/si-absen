/**
 * Ready-to-use Google Apps Script Template for SI-ABSEN
 * Allows 100% free database & storage using Google Spreadsheet & Google Drive.
 */

export const GAS_CODE_TEMPLATE = `/**
 * ================================================================
 * BACKEND GOOGLE APPS SCRIPT (GAS) - SI-ABSEN
 * Database: Google Spreadsheet (Sheet: Users, Attendance, Settings)
 * Storage: Google Drive Folder (Penyimpanan Foto Bukti Presensi)
 * ================================================================
 * 
 * CARA PAKAI:
 * 1. Buka Google Spreadsheet baru (Beri nama: "Database SI-ABSEN").
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default, lalu paste seluruh isi file ini.
 * 4. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 * 5. Pilih jenis: "Aplikasi Web" (Web App).
 * 6. Set "Jalankan sebagai": "Saya" (Me).
 * 7. Set "Siapa yang memiliki akses": "Siapa saja" (Anyone).
 * 8. Klik "Terapkan", salin URL Web App yang dihasilkan, dan paste ke SI-ABSEN Admin.
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'GET_ALL_DATA';
  var result = {};

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);

    if (action === 'GET_ALL_DATA') {
      result = {
        success: true,
        users: getSheetData(ss.getSheetByName('Users')),
        attendance: getSheetData(ss.getSheetByName('Attendance')),
        settings: getSettingsData(ss.getSheetByName('Settings')),
        engine: 'GOOGLE_SPREADSHEET_GAS',
        timestamp: new Date().toISOString()
      };
    } else if (action === 'TEST_CONNECTION') {
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

    var usersSheet = ss.getSheetByName('Users');
    var attSheet = ss.getSheetByName('Attendance');
    var settingsSheet = ss.getSheetByName('Settings');

    // 1. SUBMIT ATTENDANCE (MASUK / PULANG)
    if (action === 'SUBMIT_ATTENDANCE' || action === 'SUBMIT_MASUK' || action === 'SUBMIT_PULANG') {
      var record = contents.data || contents.record || contents;
      var photoUrl = '';      // Upload photo snapshot to Google Drive if provided
      if (record.evidenceSnapshot && contents.folderId) {
        try {
          photoUrl = saveImageToDrive(record.evidenceSnapshot, contents.folderId, record.userName, record.type, record.date, record.time);
          record.evidenceUrl = photoUrl;
        } catch (errDrive) {
          Logger.log('Drive upload err: ' + errDrive);
        }
      }

      appendOrUpdateAttendance(attSheet, record);
      result = {
        success: true,
        message: 'Presensi (' + record.userName + ') berhasil dicatat ke Google Spreadsheet.',
        evidenceUrl: record.evidenceUrl || '',
        timestamp: new Date().toISOString()
      };
    }
    // 2. REGISTER / SYNC USER
    else if (action === 'REGISTER_USER' || action === 'SYNC_USER' || action === 'REGISTER_PEGAWAI' || action === 'UPDATE_ADMIN') {
      var user = contents.data || contents.user || contents;
      appendOrUpdateUser(usersSheet, user);
      result = {
        success: true,
        message: 'User ' + (user.name || '') + ' berhasil disimpan ke Google Spreadsheet.',
        user: user,
        timestamp: new Date().toISOString()
      };
    }
    // 3. DELETE ATTENDANCE
    else if (action === 'DELETE_ATTENDANCE_BULK') {
      var ids = contents.recordIds || [];
      deleteRowsById(attSheet, ids);
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

// HELPER: Auto-create Sheets
function initSheetsIfNeeded(ss) {
  var sheets = ['Users', 'Attendance', 'Settings'];
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (name === 'Users') {
        sheet.appendRow(['id', 'name', 'email', 'password', 'role', 'nip', 'skpd', 'photo', 'face_descriptor', 'created_at']);
        sheet.appendRow(['U-ADMIN-01', 'Administrator SI-ABSEN', 'admin@siabsen.go.id', 'admin', 'admin', '-', 'Pusat', '', '', new Date().toISOString()]);
      } else if (name === 'Attendance') {
        sheet.appendRow(['id', 'userId', 'userName', 'nip', 'email', 'skpd', 'date', 'time', 'type', 'category', 'status', 'evidenceUrl', 'notes', 'latitude', 'longitude', 'timestamp']);
      } else if (name === 'Settings') {
        sheet.appendRow(['key', 'value', 'updated_at']);
      }
    }
  }
}

function getSheetData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function getSettingsData(sheet) {
  var rows = getSheetData(sheet);
  var out = {};
  for (var i = 0; i < rows.length; i++) {
    try {
      out[rows[i].key] = JSON.parse(rows[i].value);
    } catch(e) {
      out[rows[i].key] = rows[i].value;
    }
  }
  return out;
}

function appendOrUpdateUser(sheet, user) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === user.id || (user.email && data[i][2] === user.email)) {
      rowIndex = i + 1;
      break;
    }
  }

  var faceDescStr = user.faceDescriptor ? (typeof user.faceDescriptor === 'string' ? user.faceDescriptor : JSON.stringify(user.faceDescriptor)) : (user.face_descriptor || '');
  var rowData = [
    user.id || ('U-' + Date.now()),
    user.name || '',
    user.email || '',
    user.password || 'admin',
    user.role || 'pegawai',
    user.nip || '',
    user.skpd || '',
    user.photo || '',
    faceDescStr,
    user.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function appendOrUpdateAttendance(sheet, rec) {
  sheet.appendRow([
    rec.id || ('ATT-' + Date.now()),
    rec.userId || '',
    rec.userName || '',
    rec.nip || '',
    rec.email || '',
    rec.skpd || '',
    rec.date || '',
    rec.time || '',
    rec.type || 'Masuk',
    rec.category || 'HARIAN',
    rec.status || 'Tepat Waktu',
    rec.evidenceUrl || '',
    rec.notes || '',
    rec.latitude || '',
    rec.longitude || '',
    new Date().toISOString()
  ]);
}

function deleteRowsById(sheet, idList) {
  var data = sheet.getDataRange().getValues();
  var idSet = {};
  for (var k = 0; k < idList.length; k++) idSet[idList[k]] = true;

  for (var i = data.length - 1; i >= 1; i--) {
    if (idSet[data[i][0]]) {
      sheet.deleteRow(i + 1);
    }
  }
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
`;
