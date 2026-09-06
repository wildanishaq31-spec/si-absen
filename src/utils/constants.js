// Work schedule & system constants for SI-ABSEN

export const WORK_SCHEDULE = {
  // Day of week: 1 (Monday) to 6 (Saturday), 0 is Sunday
  1: { day: 'Senin', start: '07:30', end: '15:00', targetHours: 7.5, name: 'Senin' },
  2: { day: 'Selasa', start: '07:30', end: '15:00', targetHours: 7.5, name: 'Selasa' },
  3: { day: 'Rabu', start: '07:30', end: '15:00', targetHours: 7.5, name: 'Rabu' },
  4: { day: 'Kamis', start: '07:30', end: '15:00', targetHours: 7.5, name: 'Kamis' },
  5: { day: 'Jumat', start: '07:00', end: '11:30', targetHours: 4.5, name: 'Jumat' },
  6: { day: 'Sabtu', start: '07:00', end: '13:00', targetHours: 6.0, name: 'Sabtu' },
  0: { day: 'Minggu', start: null, end: null, targetHours: 0, name: 'Minggu (Libur)' }
};

export const WEEKLY_TARGET_HOURS = 41.0; // 41 Jam per Minggu

// 3-Shift Schedules (Dinas Muter)
export const SHIFT_SCHEDULE = {
  PAGI: { 
    id: 'PAGI', 
    name: 'Dinas Pagi', 
    label: 'Pagi (07.00 - 14.00)', 
    start: '07:00', 
    end: '14:00', 
    targetHours: 7.0,
    color: '#00838F',
    bg: '#E0F7FA'
  },
  SORE: { 
    id: 'SORE', 
    name: 'Dinas Sore', 
    label: 'Sore (14.00 - 21.00)', 
    start: '14:00', 
    end: '21:00', 
    targetHours: 7.0,
    color: '#D97706',
    bg: '#FEF3C7'
  },
  MALAM: { 
    id: 'MALAM', 
    name: 'Dinas Malam', 
    label: 'Malam (21.00 - 07.00)', 
    start: '21:00', 
    end: '07:00', 
    targetHours: 10.0,
    isOvernight: true,
    color: '#7C3AED',
    bg: '#F3E8FF'
  }
};

export const ATTENDANCE_CATEGORIES = {
  HARIAN: 'HARIAN',
  SHIFT: 'SHIFT'
};

// Default Office Coordinate (UPTD Puskesmas Cermee, Bondowoso)
export const DEFAULT_OFFICE_LOCATION = {
  name: 'UPTD Puskesmas Cermee',
  latitude: -7.780344,
  longitude: 114.030344,
  radiusMeters: 100 // Radius toleransi absen 100 meter
};

export const PRESENCE_TYPES = {
  MASUK: 'Masuk',
  PULANG: 'Pulang',
  SHIFT_MASUK: 'Shift Masuk',
  SHIFT_PULANG: 'Shift Pulang',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  CUTI: 'Cuti',
  DINAS_LUAR: 'Dinas Luar',
  D3: 'D3'
};

export const STATUS_CODES = {
  ON_TIME: 'Tepat Waktu',
  LATE: 'Terlambat',
  EARLY_LEAVE: 'Pulang Awal',
  COMPLIANT: 'Sesuai Jam',
  ABSENT: 'Alpa / Tidak Hadir',
  LEAVE: 'Izin / Cuti / Sakit'
};
