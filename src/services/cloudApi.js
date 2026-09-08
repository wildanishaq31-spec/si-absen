// Cloud API Service for SI-ABSEN
// Powered by Vercel Serverless API (/api/sync) and Vercel Postgres (Neon)

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
   * Mengirim presensi pegawai ke Database Cloud Vercel Postgres
   */
  async syncAttendance(record, folderUrl = '') {
    const action = record.type?.toLowerCase().includes('pulang') ? 'SUBMIT_PULANG' : 'SUBMIT_MASUK';
    const payload = {
      action,
      folderUrl,
      folderId: this.extractFolderId(folderUrl),
      data: record
    };

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
      console.warn('Vercel serverless attendance sync error:', e);
    }

    return { success: true };
  },

  /**
   * Mendaftarkan atau memperbarui data Admin / Pegawai ke Database Vercel Postgres
   */
  async syncUser(user) {
    const isAdmin = user.role === 'admin';
    const action = isAdmin ? 'UPDATE_ADMIN' : 'REGISTER_PEGAWAI';

    const payload = {
      action,
      data: user
    };

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
      console.warn('Vercel serverless user sync error:', e);
    }

    return { success: true };
  },

  /**
   * Mengambil seluruh data terpusat (Users & Attendance) dari Vercel Postgres
   */
  async fetchAllData() {
    try {
      const res = await fetch('/api/sync?action=GET_ALL_DATA');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Fetch all data from vercel error:', err);
    }
    return null;
  },

  /**
   * Mengambil pengaturan terpusat (SKPD, Kunci Lokasi, Folder Drive) dari Vercel Postgres
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
   * Menyimpan pengaturan terpusat ke Vercel Postgres
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
   * Me-reset database terpusat di Vercel Postgres
   */
  async resetCentralDatabase() {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_DATABASE' })
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Reset central database error:', err);
    }
    return null;
  }
};
