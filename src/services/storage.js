// Local Storage Database & Clean Initial Data for SI-ABSEN

const STORAGE_KEYS = {
  USERS: 'si_absen_users_v2',
  ATTENDANCE: 'si_absen_attendance_v2',
  SETTINGS: 'si_absen_settings_v2',
  ACTIVE_SESSION: 'si_absen_session_v2'
};

// Clean Default Users: ONLY Administrator (No dummy employees)
export const INITIAL_USERS = [
  {
    id: 'U-ADMIN-01',
    name: 'Administrator SI-ABSEN',
    email: 'admin@siabsen.go.id',
    password: 'admin',
    role: 'admin',
    nip: '198501012010011001',
    skpd: 'Dinas Kesehatan Kab. Bondowoso',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

// Clean Attendance: Completely Empty []
export const INITIAL_ATTENDANCE = [];

// Settings with Dual Storage Configuration (Google Cloud via Vercel Serverless vs Dedicated RustFS Server)
export const INITIAL_SETTINGS = {
  storageProvider: 'GOOGLE', // 'GOOGLE' (Google Sheets & Drive via Vercel API) vs 'SERVER' (Dedicated RustFS Storage Server)
  googleSpreadsheetUrl: '', // Link Google Spreadsheet (https://docs.google.com/spreadsheets/d/...)
  googleDriveFolderUrl: '', // Link Folder Google Drive (https://drive.google.com/drive/folders/...)
  
  rustfsEndpoint: '', // URL Endpoint Server RustFS (contoh: https://rustfs.pkmcermee.my.id)
  rustfsBucket: 'bukti-presensi', // Folder / Bucket foto di RustFS
  rustfsApiKey: '', // Token API RustFS (opsional)
  rustfsEnabled: false, // Toggle penyimpanan foto ke RustFS
  
  enableFaceCamera: true,
  requireGps: true,
  strictLocationLock: true,
  skpdName: 'UPTD Puskesmas Cermee',
  officeName: 'UPTD Puskesmas Cermee',
  officeLatitude: -7.780344,
  officeLongitude: 114.030344,
  officeRadiusMeters: 100,
  institutionName: 'UPTD Puskesmas Cermee',
  appVersion: 'v5.6'
};

export const storageService = {
  getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  updateUser(userId, updatedData) {
    let users = this.getUsers();
    let updatedUser = null;
    users = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, ...updatedData };
        return updatedUser;
      }
      return u;
    });
    this.saveUsers(users);
    return updatedUser;
  },

  deleteUser(userId) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
  },

  getAttendance() {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    return JSON.parse(raw);
  },

  saveAttendance(records) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  addAttendance(record) {
    const records = this.getAttendance();
    records.unshift(record);
    this.saveAttendance(records);
    return record;
  },

  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_SETTINGS, ...parsed };
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  },

  saveSession(user) {
    if (!user) localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    else localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    return { users: INITIAL_USERS, attendance: INITIAL_ATTENDANCE };
  }
};
