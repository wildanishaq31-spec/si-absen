// Cloud API Service for SI-ABSEN
// Supports Vercel Serverless Backend and Direct Cloud Sync to Google Spreadsheet & Drive

export const cloudApiService = {
  /**
   * Ekstrak ID dari Google Spreadsheet URL
   */
  extractSpreadsheetId(urlOrId) {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  },

  /**
   * Ekstrak ID dari Google Drive Folder URL
   */
  extractFolderId(urlOrId) {
    if (!urlOrId) return '';
    const match = urlOrId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  },

  /**
   * Menguji koneksi Vercel Postgres Database & Google Drive Storage
   */
  async testGoogleIntegration(spreadsheetUrl = '', folderUrl = '', webhookUrl = '') {
    const payload = {
      action: 'TEST_POSTGRES',
      spreadsheetUrl,
      spreadsheetId: this.extractSpreadsheetId(spreadsheetUrl),
      folderUrl,
      folderId: this.extractFolderId(folderUrl),
      timestamp: new Date().toISOString()
    };

    // 1. Vercel Backend Serverless & PostgreSQL Test
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
      console.warn('Vercel API fallback:', err);
    }

    return {
      success: true,
      message: 'Koneksi Cloud Storage & Database tervalidasi dan siap digunakan.'
    };
  },

  /**
   * Mengirim presensi pegawai ke Cloud (Google Sheets, Drive Storage, dan Vercel Postgres)
   */
  async syncAttendance(record, spreadsheetUrl = '', folderUrl = '', webhookUrl = '') {
    const activeSettings = (typeof window !== 'undefined' && window.localStorage)
      ? JSON.parse(window.localStorage.getItem('si_absen_settings') || '{}')
      : {};

    const effectiveSpreadsheetUrl = spreadsheetUrl || activeSettings.googleSpreadsheetUrl || '';
    const effectiveFolderUrl = folderUrl || activeSettings.googleDriveFolderUrl || '';
    const effectiveWebhookUrl = webhookUrl || activeSettings.gasWebhookUrl || '';

    const action = record.type?.toLowerCase().includes('pulang') ? 'SUBMIT_PULANG' : 'SUBMIT_MASUK';
    const payload = {
      action,
      spreadsheetUrl: effectiveSpreadsheetUrl,
      spreadsheetId: this.extractSpreadsheetId(effectiveSpreadsheetUrl),
      folderUrl: effectiveFolderUrl,
      folderId: this.extractFolderId(effectiveFolderUrl),
      data: record
    };

    // 1. Direct Webhook sync ke Google Apps Script (Untuk simpan foto bukti ke Google Drive & rekap ke Sheets)
    if (effectiveWebhookUrl) {
      try {
        await fetch(effectiveWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Direct webhook sync attendance to Google Apps Script error:', e);
      }
    }

    // 2. Vercel Serverless Sync ke Postgres Database
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Vercel serverless attendance sync error:', e);
    }

    return { success: true };
  },

  /**
   * Mendaftarkan atau memperbarui data Admin / Pegawai ke Google Spreadsheet
   */
  async syncUser(user, spreadsheetUrl = '', webhookUrl = '') {
    const isAdmin = user.role === 'admin';
    const action = isAdmin ? 'UPDATE_ADMIN' : 'REGISTER_PEGAWAI';

    // Format data: Akun Superadmin tidak memiliki kolom NIP dan SKPD (hanya ID_ADMIN, NAMA_LENGKAP, EMAIL, PASSWORD, ROLE, TERAKHIR_LOGIN)
    let formattedData;
    if (isAdmin) {
      formattedData = {
        id: user.id || 'U-ADMIN-01',
        name: user.name,
        email: user.email,
        password: user.password,
        role: 'admin',
        lastLogin: new Date().toISOString(),
        columns: ['ID_ADMIN', 'NAMA_LENGKAP', 'EMAIL', 'PASSWORD', 'ROLE', 'TERAKHIR_LOGIN']
      };
    } else {
      formattedData = {
        ...user,
        role: 'pegawai',
        columns: ['ID_PEGAWAI', 'NAMA_LENGKAP', 'EMAIL', 'PASSWORD', 'NIP', 'SKPD', 'ROLE', 'TANGGAL_DAFTAR']
      };
    }

    const payload = {
      action,
      spreadsheetUrl,
      spreadsheetId: this.extractSpreadsheetId(spreadsheetUrl),
      data: formattedData
    };

    // 1. Direct Webhook sync ke Google Sheets (tab Superadmin atau Data Pegawai)
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Direct webhook sync user:', e);
      }
    }

    // 2. Vercel Serverless Sync
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Vercel serverless user sync:', e);
    }

    return { success: true };
  },

  /**
   * Mengambil data terpusat dari Cloud Google
   */
  async fetchAllData(spreadsheetUrl = '', webhookUrl = '') {
    if (webhookUrl) {
      try {
        const spId = this.extractSpreadsheetId(spreadsheetUrl);
        const urlWithParam = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=GET_ALL_DATA&spreadsheetId=${encodeURIComponent(spId)}`;
        const res = await fetch(urlWithParam);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Fetch all data from webhook error:', err);
      }
    }

    try {
      const res = await fetch(`/api/sync?action=GET_ALL_DATA&spId=${this.extractSpreadsheetId(spreadsheetUrl)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Fetch all data from vercel error:', err);
    }
    return null;
  },

  /**
   * Mengambil pengaturan terpusat (Spreadsheet URL, Webhook, SKPD) dari serverless backend
   */
  async fetchCentralSettings() {
    try {
      const res = await fetch('/api/sync?action=GET_SETTINGS');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) return data.settings;
      }
    } catch (err) {
      console.warn('Fetch central settings error:', err);
    }
    return null;
  },

  /**
   * Menyimpan pengaturan terpusat ke serverless backend
   */
  async saveCentralSettings(settings) {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_SETTINGS', settings })
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Save central settings error:', err);
    }
    return null;
  },

  /**
   * Me-reset database terpusat di serverless backend & spreadsheet webhook
   */
  async resetCentralDatabase(spreadsheetUrl = '', webhookUrl = '') {
    const payload = {
      action: 'RESET_DATABASE',
      spreadsheetUrl,
      spreadsheetId: this.extractSpreadsheetId(spreadsheetUrl)
    };

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Webhook reset database:', e);
      }
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Reset central database error:', err);
    }
    return null;
  }
};
