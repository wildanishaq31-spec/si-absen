// Vercel Serverless API for Attendance Management

export default async function handler(req, res) {
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
    if (req.method === 'POST') {
      const record = req.body;
      return res.status(200).json({
        success: true,
        message: `Presensi ${record.type || 'Harian'} untuk ${record.userName || 'Pegawai'} berhasil dicatat.`,
        record: record,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API Presensi SI-ABSEN Aktif',
      records: []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
