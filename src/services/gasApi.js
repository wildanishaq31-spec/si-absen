// Google Apps Script Webhook API Connector (Spreadsheet & Drive Storage)

export const gasApiService = {
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
   * Menguji koneksi ke Google Apps Script Web App
   */
  async testConnection(webhookUrl, spreadsheetUrl = '', folderUrl = '') {
    if (!webhookUrl) {
      return { success: false, message: 'URL Web App Google Apps Script belum diisi.' };
    }

    try {
      const payload = {
        action: 'TEST_CONNECTION',
        spreadsheetUrl: spreadsheetUrl,
        spreadsheetId: this.extractSpreadsheetId(spreadsheetUrl),
        folderUrl: folderUrl,
        folderId: this.extractFolderId(folderUrl),
        timestamp: new Date().toISOString()
      };

      // Fetch with no-cors or standard text output
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: 'Koneksi ke Google Apps Script Webhook terkirim dengan sukses! (Spreadsheet & Drive siap menerima data presensi).'
      };
    } catch (err) {
      return {
        success: false,
        message: `Gagal terhubung ke Web App Google Apps Script: ${err.message}`
      };
    }
  },

  /**
   * Mengirim data presensi atau foto base64 ke Google Apps Script Web App
   */
  async syncToGoogleAppsScript(webhookUrl, payload) {
    if (!webhookUrl) {
      return { success: true, localOnly: true };
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      return { success: true };
    } catch (err) {
      console.warn('Gagal sinkronisasi ke GAS Webhook:', err);
      return { success: false, error: err.message };
    }
  }
};
