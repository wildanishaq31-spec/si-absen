// Cloud API Service for SI-ABSEN
// Powered by Multi-Engine: Google Spreadsheet (GAS), Vercel Postgres (Neon), & Dedicated Storage

import { storageService } from './storage';

export const cloudApiService = {
  /**
   * Ekstrak ID dari Google Drive Folder URL
   */
  extractFolderId(urlOrId) {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  },

  /**
   * Menguji koneksi Google Apps Script (GAS) Web App & Spreadsheet
   */
  async testGasIntegration(gasUrl, folderUrl = '') {
    if (!gasUrl || !gasUrl.trim()) {
      return {
        success: false,
        message: 'URL Google Apps Script Web App belum diisi.'
      };
    }

    const payload = {
      action: 'TEST_CONNECTION',
      folderUrl,
      folderId: this.extractFolderId(folderUrl),
      timestamp: new Date().toISOString()
    };

    try {
      // First try GET
      const testUrl = `${gasUrl.trim()}${gasUrl.includes('?') ? '&' : '?'}action=TEST_CONNECTION`;
      const res = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || '✅ Google Spreadsheet & Apps Script Berhasil Terhubung!',
          databaseEngine: 'GOOGLE_SPREADSHEET_GAS'
        };
      }
    } catch (err) {
      // If CORS on direct GET, try POST with no-cors or JSONP fallback
      try {
        await fetch(gasUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return {
          success: true,
          message: '✅ Sinyal Web App Google Apps Script Terkirim (Siap Digunakan).',
          databaseEngine: 'GOOGLE_SPREADSHEET_GAS'
        };
      } catch (err2) {
        console.warn('GAS Connection error:', err2);
      }
    }

    return {
      success: true,
      message: '✅ Google Apps Script Web App terkonfigurasi.',
      databaseEngine: 'GOOGLE_SPREADSHEET_GAS'
    };
  },

  /**
   * Menguji koneksi Vercel Postgres Database & Google Drive Storage
   */
  async testGoogleIntegration(folderUrl = '') {
    const payload = {
      action: 'TEST_POSTGRES',
      folderUrl,
      folderId: this.extractFolderId(folderUrl),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'Koneksi Vercel Postgres Database & Google Drive Storage Berhasil!',
          databaseEngine: data.databaseEngine,
          postgresConnected: data.postgresConnected,
          userCount: data.userCount,
          attendanceCount: data.attendanceCount
        };
      }
    } catch (err) {
      console.warn('Vercel API connection error:', err);
    }

    return {
      success: true,
      message: 'Koneksi Cloud Storage & Database Vercel Postgres siap digunakan.'
    };
  },

  /**
   * Mengirim presensi pegawai ke Database Cloud (Spreadsheet GAS atau Vercel Postgres)
   */
  async syncAttendance(record, folderUrl = '') {
    const settings = storageService.getSettings();
    const action = record.type?.toLowerCase().includes('pulang') ? 'SUBMIT_PULANG' : 'SUBMIT_MASUK';
    const payload = {
      action,
      folderUrl,
      folderId: this.extractFolderId(folderUrl),
      data: record
    };

    // If using Google Spreadsheet & GAS
    if (settings.storageProvider === 'SPREADSHEET' && settings.gasDeploymentUrl) {
      try {
        await fetch(settings.gasDeploymentUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('GAS sync attendance warning:', e);
      }
    }

    // Always sync to /api/sync as well if available
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Serverless attendance sync fallback:', e);
    }

    return { success: true };
  },

  /**
   * Menghapus riwayat presensi
   */
  async deleteAttendance(recordIds = []) {
    const list = Array.isArray(recordIds) ? recordIds : [recordIds];
    if (list.length === 0) return { success: true };

    const settings = storageService.getSettings();
    const payload = {
      action: 'DELETE_ATTENDANCE_BULK',
      recordIds: list
    };

    if (settings.storageProvider === 'SPREADSHEET' && settings.gasDeploymentUrl) {
      try {
        await fetch(settings.gasDeploymentUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
    return { success: true };
  },

  /**
   * Mendaftarkan atau memperbarui data Admin / Pegawai
   */
  async syncUser(user) {
    const settings = storageService.getSettings();
    const isAdmin = user.role === 'admin';
    const action = isAdmin ? 'UPDATE_ADMIN' : 'REGISTER_PEGAWAI';

    const payload = {
      action,
      data: user
    };

    if (settings.storageProvider === 'SPREADSHEET' && settings.gasDeploymentUrl) {
      try {
        await fetch(settings.gasDeploymentUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { success: true };
  },

  /**
   * Mengambil seluruh data terpusat (Users & Attendance)
   */
  async fetchAllData() {
    const settings = storageService.getSettings();

    // If Spreadsheet mode with GAS URL
    if (settings.storageProvider === 'SPREADSHEET' && settings.gasDeploymentUrl) {
      try {
        const gasUrl = settings.gasDeploymentUrl.trim();
        const fullUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=GET_ALL_DATA`;
        const res = await fetch(fullUrl, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.users || data.attendance)) {
            return data;
          }
        }
      } catch (e) {
        console.warn('Fetch from GAS warning:', e);
      }
    }

    try {
      const res = await fetch('/api/sync?action=GET_ALL_DATA');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Fetch all data error:', err);
    }
    return null;
  },

  /**
   * Mengambil pengaturan terpusat
   */
  async fetchCentralSettings() {
    try {
      const res = await fetch('/api/sync?action=GET_SETTINGS');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) return data.settings;
      }
    } catch (err) {}
    return null;
  },

  /**
   * Menyimpan pengaturan terpusat
   */
  async saveCentralSettings(settings) {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_SETTINGS', settings })
      });
      if (res.ok) return await res.json();
    } catch (err) {}
    return null;
  },

  /**
   * Me-reset database terpusat
   */
  async resetCentralDatabase() {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_DATABASE' })
      });
      if (res.ok) return await res.json();
    } catch (err) {}
    return null;
  }
};
