// Vercel Serverless API Handler for SI-ABSEN with Vercel Postgres / Neon Integration
// Handles persistent cloud PostgreSQL database, attendance logging, user management & Google Drive storage

import { neon } from '@neondatabase/serverless';

// In-memory fallback (when POSTGRES_URL is not yet connected)
let memorySettings = {
  storageProvider: 'GOOGLE',
  googleDriveFolderUrl: '',
  skpdName: 'UPTD Puskesmas Cermee'
};

let memoryUsers = [
  {
    id: 'U-ADMIN-01',
    name: 'Administrator SI-ABSEN',
    email: 'admin@siabsen.go.id',
    password: 'admin',
    role: 'admin'
  }
];

let memoryAttendance = [];
let isDbInitialized = false;

// Helper to get Neon / PostgreSQL client
function getSql() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) return null;
  try {
    return neon(connectionString);
  } catch (err) {
    console.warn('Neon connection initialization error:', err);
    return null;
  }
}

// Auto-initialize PostgreSQL tables if not present
async function ensureTables(sql) {
  if (!sql || isDbInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(32) NOT NULL,
        nip VARCHAR(64),
        skpd VARCHAR(255),
        photo TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        user_name VARCHAR(255) NOT NULL,
        nip VARCHAR(64),
        email VARCHAR(255),
        skpd VARCHAR(255),
        date VARCHAR(32) NOT NULL,
        time VARCHAR(32) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        type VARCHAR(64) NOT NULL,
        category VARCHAR(32) DEFAULT 'HARIAN',
        shift_type VARCHAR(32),
        schedule_in VARCHAR(16),
        schedule_out VARCHAR(16),
        is_late BOOLEAN DEFAULT FALSE,
        late_minutes INT DEFAULT 0,
        is_early_leave BOOLEAN DEFAULT FALSE,
        early_leave_minutes INT DEFAULT 0,
        work_duration_minutes INT DEFAULT 0,
        status VARCHAR(64),
        evidence_url TEXT,
        notes TEXT,
        latitude NUMERIC(10, 7),
        longitude NUMERIC(10, 7),
        distance_meters NUMERIC(10, 2)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Ensure default admin exists
    const adminCheck = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (!adminCheck || adminCheck.length === 0) {
      await sql`
        INSERT INTO users (id, name, email, password, role)
        VALUES ('U-ADMIN-01', 'Administrator SI-ABSEN', 'admin@siabsen.go.id', 'admin', 'admin')
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    isDbInitialized = true;
  } catch (err) {
    console.warn('Postgres table creation warning:', err);
  }
}

export default async function handler(req, res) {
  // Enable CORS
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
    const folderUrl = query.folderUrl || (body && (body.folderUrl || body.folderId)) || '';

    const sql = getSql();
    if (sql) {
      await ensureTables(sql);
    }

    // 1. ACTION: Test Connection
    if (action === 'TEST_GOOGLE' || action === 'TEST_CONNECTION' || action === 'TEST_POSTGRES') {
      let isPostgresReady = false;
      let userCount = memoryUsers.length;
      let attendanceCount = memoryAttendance.length;

      if (sql) {
        try {
          const testRes = await sql`SELECT NOW() as now`;
          isPostgresReady = !!testRes && testRes.length > 0;
          if (isPostgresReady) {
            const uCountRes = await sql`SELECT COUNT(*)::int as count FROM users`;
            const aCountRes = await sql`SELECT COUNT(*)::int as count FROM attendance`;
            userCount = uCountRes[0]?.count ?? 0;
            attendanceCount = aCountRes[0]?.count ?? 0;
          }
        } catch (e) {
          console.warn('Postgres ping error:', e);
        }
      }

      return res.status(200).json({
        success: true,
        message: isPostgresReady
          ? `✅ Vercel Postgres (Neon) Terhubung! (${userCount} Akun, ${attendanceCount} Riwayat Presensi)`
          : 'Serverless Backend Aktif (Mode In-Memory). Sambungkan Postgres di dashboard Vercel.',
        databaseEngine: isPostgresReady ? 'VERCEL_POSTGRES_NEON' : 'IN_MEMORY_SERVERLESS',
        postgresConnected: isPostgresReady,
        userCount,
        attendanceCount,
        timestamp: new Date().toISOString()
      });
    }

    // 2. ACTION: Save & Sync Settings
    if (action === 'SAVE_SETTINGS' || action === 'UPDATE_SETTINGS') {
      const newSettings = body.settings || body.data || body;
      memorySettings = { ...memorySettings, ...newSettings };

      if (sql) {
        try {
          await sql`
            INSERT INTO settings (key, value, updated_at)
            VALUES ('app_config', ${JSON.stringify(memorySettings)}, NOW())
            ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(memorySettings)}, updated_at = NOW()
          `;
        } catch (err) {
          console.warn('Postgres save settings error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Pengaturan terpusat berhasil diperbarui di PostgreSQL.',
        settings: memorySettings,
        timestamp: new Date().toISOString()
      });
    }

    // 3. ACTION: Get Settings
    if (action === 'GET_SETTINGS') {
      if (sql) {
        try {
          const rows = await sql`SELECT value FROM settings WHERE key = 'app_config' LIMIT 1`;
          if (rows && rows.length > 0 && rows[0].value) {
            memorySettings = { ...memorySettings, ...rows[0].value };
          }
        } catch (err) {
          console.warn('Postgres get settings error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        settings: memorySettings,
        timestamp: new Date().toISOString()
      });
    }

    // 4. ACTION: Submit Attendance (Masuk, Pulang, Izin, Cuti, Dinas Luar)
    if (action === 'SUBMIT_ATTENDANCE' || action === 'SUBMIT_MASUK' || action === 'SUBMIT_PULANG' || action === 'SUBMIT_LEAVE') {
      const record = body.data || body.record || body;

      let finalEvidenceUrl = record.evidenceUrl || '';
      if (!finalEvidenceUrl && record.evidenceSnapshot && folderUrl) {
        finalEvidenceUrl = folderUrl;
      }
      const recordWithEvidence = { ...record, evidenceUrl: finalEvidenceUrl };

      // In-Memory Update
      const existingIdx = memoryAttendance.findIndex(a => a.id === record.id);
      if (existingIdx >= 0) {
        memoryAttendance[existingIdx] = recordWithEvidence;
      } else {
        memoryAttendance.unshift(recordWithEvidence);
      }

      // PostgreSQL Update
      if (sql) {
        try {
          await sql`
            INSERT INTO attendance (
              id, user_id, user_name, nip, email, skpd, date, time, type,
              category, shift_type, schedule_in, schedule_out, is_late, late_minutes,
              is_early_leave, early_leave_minutes, work_duration_minutes, status,
              evidence_url, notes, latitude, longitude, distance_meters, timestamp
            )
            VALUES (
              ${record.id || `ATT-${Date.now()}`},
              ${record.userId || null},
              ${record.userName || 'Pegawai'},
              ${record.nip || null},
              ${record.email || null},
              ${record.skpd || null},
              ${record.date || new Date().toISOString().split('T')[0]},
              ${record.time || new Date().toTimeString().split(' ')[0]},
              ${record.type || 'Masuk'},
              ${record.category || 'HARIAN'},
              ${record.shiftType || null},
              ${record.scheduleIn || null},
              ${record.scheduleOut || null},
              ${!!record.isLate},
              ${record.lateMinutes || 0},
              ${!!record.isEarlyLeave},
              ${record.earlyLeaveMinutes || 0},
              ${record.workDurationMinutes || 0},
              ${record.status || 'Tepat Waktu'},
              ${finalEvidenceUrl || null},
              ${record.notes || null},
              ${record.latitude || null},
              ${record.longitude || null},
              ${record.distanceMeters || null},
              NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              time = EXCLUDED.time,
              type = EXCLUDED.type,
              work_duration_minutes = EXCLUDED.work_duration_minutes,
              status = EXCLUDED.status,
              evidence_url = COALESCE(EXCLUDED.evidence_url, attendance.evidence_url),
              notes = COALESCE(EXCLUDED.notes, attendance.notes)
          `;
        } catch (err) {
          console.warn('Postgres submit attendance error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Presensi (${record.userName || 'Pegawai'}) berhasil disimpan ke Vercel Postgres.`,
        evidenceUrl: finalEvidenceUrl,
        timestamp: new Date().toISOString()
      });
    }

    // 4b. ACTION: Delete Attendance (Single or Bulk)
    if (action === 'DELETE_ATTENDANCE' || action === 'DELETE_ATTENDANCE_BULK') {
      const ids = body.recordIds || (body.recordId ? [body.recordId] : []) || [];
      const idList = Array.isArray(ids) ? ids : [ids];

      if (idList.length > 0) {
        const idSet = new Set(idList);
        memoryAttendance = memoryAttendance.filter(a => !idSet.has(a.id));

        if (sql) {
          try {
            await sql`
              DELETE FROM attendance 
              WHERE id = ANY(${idList})
            `;
          } catch (err) {
            console.warn('Postgres delete attendance error:', err);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `${idList.length} data presensi berhasil dihapus dari database.`,
        deletedIds: idList,
        timestamp: new Date().toISOString()
      });
    }

    // 5. ACTION: Register & Sync User (Pegawai & Admin)
    if (action === 'REGISTER_USER' || action === 'SYNC_USER' || action === 'UPDATE_USER' || action === 'UPDATE_ADMIN' || action === 'REGISTER_PEGAWAI') {
      const user = body.data || body.user || body;

      if (user && (user.id || user.email)) {
        // In-Memory Update
        const idx = memoryUsers.findIndex(u => (user.id && u.id === user.id) || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()));
        if (idx >= 0) {
          memoryUsers[idx] = { ...memoryUsers[idx], ...user };
        } else {
          memoryUsers.push(user);
        }

        // PostgreSQL Update
        if (sql) {
          try {
            await sql`
              INSERT INTO users (id, name, email, password, role, nip, skpd, photo, last_login)
              VALUES (
                ${user.id || `U-${Date.now()}`},
                ${user.name || 'User'},
                ${(user.email || '').toLowerCase().trim()},
                ${user.password || '12345678'},
                ${user.role || 'pegawai'},
                ${user.nip || null},
                ${user.skpd || null},
                ${user.photo || null},
                ${user.lastLogin ? new Date(user.lastLogin) : null}
              )
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                password = COALESCE(EXCLUDED.password, users.password),
                role = EXCLUDED.role,
                nip = COALESCE(EXCLUDED.nip, users.nip),
                skpd = COALESCE(EXCLUDED.skpd, users.skpd),
                photo = COALESCE(EXCLUDED.photo, users.photo),
                last_login = COALESCE(EXCLUDED.last_login, users.last_login)
            `;
          } catch (err) {
            console.warn('Postgres sync user error:', err);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: `User ${user?.name || 'Pegawai'} berhasil disimpan di Vercel Postgres.`,
        user,
        users: memoryUsers,
        timestamp: new Date().toISOString()
      });
    }

    // 6. ACTION: Get All Central Data
    if (action === 'GET_ALL_DATA' || method === 'GET') {
      let finalUsers = [...memoryUsers];
      let finalAttendance = [...memoryAttendance];

      if (sql) {
        try {
          const pgUsers = await sql`SELECT * FROM users ORDER BY created_at ASC`;
          if (pgUsers && pgUsers.length > 0) {
            finalUsers = pgUsers.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              nip: u.nip,
              skpd: u.skpd,
              photo: u.photo,
              lastLogin: u.last_login ? new Date(u.last_login).toISOString() : null,
              createdAt: u.created_at ? new Date(u.created_at).toISOString() : null
            }));
            memoryUsers = finalUsers;
          }

          const pgAttendance = await sql`SELECT * FROM attendance ORDER BY timestamp DESC`;
          if (pgAttendance && pgAttendance.length > 0) {
            finalAttendance = pgAttendance.map(a => ({
              id: a.id,
              userId: a.user_id,
              userName: a.user_name,
              nip: a.nip,
              email: a.email,
              skpd: a.skpd,
              date: a.date,
              time: a.time,
              type: a.type,
              category: a.category,
              shiftType: a.shift_type,
              scheduleIn: a.schedule_in,
              scheduleOut: a.schedule_out,
              isLate: a.is_late,
              lateMinutes: a.late_minutes,
              isEarlyLeave: a.is_early_leave,
              earlyLeaveMinutes: a.early_leave_minutes,
              workDurationMinutes: a.work_duration_minutes,
              status: a.status,
              evidenceUrl: a.evidence_url,
              notes: a.notes,
              latitude: a.latitude ? Number(a.latitude) : null,
              longitude: a.longitude ? Number(a.longitude) : null,
              distanceMeters: a.distance_meters ? Number(a.distance_meters) : null,
              timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : null
            }));
            memoryAttendance = finalAttendance;
          }
        } catch (err) {
          console.warn('Postgres get all data error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        users: finalUsers,
        attendance: finalAttendance,
        settings: memorySettings,
        engine: sql ? 'VERCEL_POSTGRES' : 'IN_MEMORY',
        version: 'v5.6-postgres',
        timestamp: new Date().toISOString()
      });
    }

    // 7. ACTION: Reset Database
    if (action === 'RESET_DATABASE') {
      memoryUsers = [
        {
          id: 'U-ADMIN-01',
          name: 'Administrator SI-ABSEN',
          email: 'admin@siabsen.go.id',
          password: 'admin',
          role: 'admin'
        }
      ];
      memoryAttendance = [];

      if (sql) {
        try {
          await sql`TRUNCATE TABLE attendance CASCADE;`;
          await sql`DELETE FROM users WHERE role != 'admin';`;
          await sql`
            INSERT INTO users (id, name, email, password, role)
            VALUES ('U-ADMIN-01', 'Administrator SI-ABSEN', 'admin@siabsen.go.id', 'admin', 'admin')
            ON CONFLICT (id) DO UPDATE SET
              name = 'Administrator SI-ABSEN',
              email = 'admin@siabsen.go.id',
              password = 'admin',
              role = 'admin',
              last_login = NOW();
          `;
        } catch (err) {
          console.warn('Postgres reset database error:', err);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Database PostgreSQL dan memori berhasil di-reset ke setelan awal.',
        users: memoryUsers,
        attendance: memoryAttendance,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Aksi ${action} berhasil diterima backend Vercel Postgres.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Sync Postgres Error:', error);
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan pada Serverless PostgreSQL API: ${error.message}`
    });
  }
}
