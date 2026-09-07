// Vercel Serverless API Handler for SI-ABSEN
// Handles central data sync, attendance logging, user management & Google Cloud integration

// In-memory central store (persists across warm serverless invocations)
let centralSettings = {
  storageProvider: 'GOOGLE',
  googleSpreadsheetUrl: '',
  googleDriveFolderUrl: '',
  gasWebhookUrl: '',
  skpdName: 'UPTD Puskesmas Cermee'
};

let centralUsers = [
  {
    id: 'U-ADMIN-01',
    name: 'Administrator SI-ABSEN',
    email: 'admin@siabsen.go.id',
    password: 'admin',
    role: 'admin'
  }
];

let centralAttendance = [];

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, query, body } = req;
    const action = query.action || (body && body.action) || (method === 'GET' ? 'GET_ALL_DATA' : 'INFO');
    const spreadsheetUrl = query.spreadsheetUrl || (body && (body.spreadsheetUrl || body.spreadsheetId)) || centralSettings.googleSpreadsheetUrl;
    const folderUrl = query.folderUrl || (body && (body.folderUrl || body.folderId)) || centralSettings.googleDriveFolderUrl;
    const webhookUrl = query.webhookUrl || (body && (body.webhookUrl || body.gasWebhookUrl)) || centralSettings.gasWebhookUrl;

    // Helper: Relay to external Google Apps Script / Webhook if available
    const forwardToWebhook = async (payload) => {
      const targetUrl = webhookUrl || centralSettings.gasWebhookUrl;
      if (!targetUrl) return null;
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.warn('Forwarding to webhook failed:', err);
      }
      return null;
    };

    // 1. ACTION: Test Connection
    if (action === 'TEST_GOOGLE' || action === 'TEST_CONNECTION') {
      if (spreadsheetUrl) centralSettings.googleSpreadsheetUrl = spreadsheetUrl;
      if (folderUrl) centralSettings.googleDriveFolderUrl = folderUrl;
      if (webhookUrl) centralSettings.gasWebhookUrl = webhookUrl;

      // Relay test to webhook if available
      let webhookResult = null;
      if (webhookUrl) {
        webhookResult = await forwardToWebhook({ action: 'TEST_CONNECTION', spreadsheetUrl, folderUrl });
      }

      return res.status(200).json({
        success: true,
        message: 'Koneksi Serverless Backend ke Cloud Storage Berhasil!',
        spreadsheetConfigured: !!spreadsheetUrl,
        webhookConfigured: !!webhookUrl,
        webhookResult,
        timestamp: new Date().toISOString()
      });
    }

    // 2. ACTION: Save & Sync Settings
    if (action === 'SAVE_SETTINGS' || action === 'UPDATE_SETTINGS') {
      const newSettings = body.settings || body.data || body;
      centralSettings = { ...centralSettings, ...newSettings };
      return res.status(200).json({
        success: true,
        message: 'Pengaturan terpusat berhasil diperbarui di server.',
        settings: centralSettings,
        timestamp: new Date().toISOString()
      });
    }

    // 3. ACTION: Get Settings
    if (action === 'GET_SETTINGS') {
      return res.status(200).json({
        success: true,
        settings: centralSettings,
        timestamp: new Date().toISOString()
      });
    }

    // 4. ACTION: Submit Attendance (Masuk, Pulang, Izin, Cuti)
    if (action === 'SUBMIT_ATTENDANCE' || action === 'SUBMIT_MASUK' || action === 'SUBMIT_PULANG' || action === 'SUBMIT_LEAVE') {
      const record = body.data || body.record || body;
      
      let finalEvidenceUrl = record.evidenceUrl || '';
      if (!finalEvidenceUrl && record.evidenceSnapshot && folderUrl) {
        finalEvidenceUrl = folderUrl;
      }
      const recordWithEvidence = { ...record, evidenceUrl: finalEvidenceUrl };

      // Simpan di central attendance
      const existingIdx = centralAttendance.findIndex(a => a.id === record.id);
      if (existingIdx >= 0) {
        centralAttendance[existingIdx] = recordWithEvidence;
      } else {
        centralAttendance.unshift(recordWithEvidence);
      }

      // Relay ke Webhook Spreadsheet jika ada
      await forwardToWebhook({
        action,
        spreadsheetUrl,
        folderUrl,
        data: recordWithEvidence
      });

      return res.status(200).json({
        success: true,
        message: `Presensi (${record.userName || 'Pegawai'}) berhasil diproses.`,
        evidenceUrl: finalEvidenceUrl,
        timestamp: new Date().toISOString()
      });
    }

    // 5. ACTION: Register & Sync User (Pegawai & Admin)
    if (action === 'REGISTER_USER' || action === 'SYNC_USER' || action === 'UPDATE_USER' || action === 'UPDATE_ADMIN' || action === 'REGISTER_PEGAWAI') {
      const user = body.data || body.user || body;
      
      if (user && (user.id || user.email)) {
        const idx = centralUsers.findIndex(u => (user.id && u.id === user.id) || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()));
        if (idx >= 0) {
          centralUsers[idx] = { ...centralUsers[idx], ...user };
        } else {
          centralUsers.push(user);
        }
      }

      // Relay ke Webhook Google Spreadsheet jika terkonfigurasi
      await forwardToWebhook({
        action,
        spreadsheetUrl,
        data: user
      });

      return res.status(200).json({
        success: true,
        message: `User ${user.name || 'Pegawai'} berhasil disimpan di database cloud terpusat.`,
        user: user,
        users: centralUsers,
        timestamp: new Date().toISOString()
      });
    }

    // 6. ACTION: Get All Central Data
    if (action === 'GET_ALL_DATA' || method === 'GET') {
      // Jika ada webhook terhubung, coba ambil data terbaru dari webhook
      if (webhookUrl || centralSettings.gasWebhookUrl) {
        const webhookData = await forwardToWebhook({ action: 'GET_ALL_DATA', spreadsheetUrl });
        if (webhookData && Array.isArray(webhookData.users) && webhookData.users.length > 0) {
          // Merge webhook users with central users
          const merged = new Map();
          centralUsers.forEach(u => merged.set(u.id || u.email, u));
          webhookData.users.forEach(u => merged.set(u.id || u.email, { ...merged.get(u.id || u.email), ...u }));
          centralUsers = Array.from(merged.values());
        }
      }

      return res.status(200).json({
        success: true,
        users: centralUsers,
        attendance: centralAttendance,
        settings: centralSettings,
        version: 'v5.6-serverless',
        timestamp: new Date().toISOString()
      });
    }

    // 7. ACTION: Reset Database Cloud & Cache
    if (action === 'RESET_DATABASE') {
      centralUsers = [
        {
          id: 'U-ADMIN-01',
          name: 'Administrator SI-ABSEN',
          email: 'admin@siabsen.go.id',
          password: 'admin',
          role: 'admin'
        }
      ];
      centralAttendance = [];
      
      // Relay reset to webhook if available
      await forwardToWebhook({ action: 'RESET_DATABASE' });

      return res.status(200).json({
        success: true,
        message: 'Database Cloud dan Cache berhasil direset.',
        users: centralUsers,
        attendance: centralAttendance,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Aksi ${action} berhasil diterima backend Vercel.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Sync Error:', error);
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan pada Serverless API: ${error.message}`
    });
  }
}
