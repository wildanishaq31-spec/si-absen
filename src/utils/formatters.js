// Formatting utilities for dates, times, durations, and numbers

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date to Indonesian full date: "Kamis, 03 September 2026"
 */
export function formatIndonesianDate(date = new Date()) {
  const d = new Date(date);
  const dayName = DAYS_ID[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Format date to standard format "DD/MM/YYYY"
 */
export function formatDateDMY(date = new Date()) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date to ISO string Date only "YYYY-MM-DD"
 */
export function formatDateYMD(date = new Date()) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Format time to "HH:mm:ss"
 */
export function formatTimeHMS(date = new Date()) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format duration in seconds to "HH:mm:ss" or human readable
 */
export function formatDuration(seconds = 0) {
  if (isNaN(seconds) || seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format duration to human text: e.g. "7 Jam 30 Menit"
 */
export function formatHumanHours(decimalHours = 0) {
  if (isNaN(decimalHours) || decimalHours <= 0) return '0 Jam 0 Menit';
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs} Jam ${mins} Menit`;
}

/**
 * Generate string identifier like "Agung Siswoyo-46235-Masuk"
 */
export function generateCompositeKey(userName, date, type) {
  const d = new Date(date);
  // Serial excel date day offset approximation
  const excelEpoch = new Date(1899, 11, 30);
  const diffTime = Math.abs(d - excelEpoch);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `${userName || 'Pegawai'}-${diffDays}-${type}`;
}

const UPPERCASE_ACRONYMS = new Set([
  'UPTD', 'RSUD', 'PKM', 'BKPSDM', 'DINKES', 'PNS', 'PPPK', 'ASN', 'UPT', 'BLUD', 'BPBD', 'TNI', 'POLRI', 'KTP', 'NIP', 'SKPD', 'PUSDALOPS', 'PBD', 'II', 'III', 'IV', 'V'
]);

/**
 * Otomatis mengubah nama menjadi HURUF KAPITAL (Uppercase)
 */
export function formatAutoUppercase(val = '') {
  return val ? val.toUpperCase() : '';
}

/**
 * Otomatis memformat Unit Kerja:
 * Akronim (UPTD, RSUD, PKM, DINKES, dll) menjadi KAPITAL
 * Kata lainnya menjadi Capitalize Each Word (Puskesmas Cermee)
 */
export function formatAutoUnitKerja(val = '') {
  if (!val) return '';
  return val.split(/(\s+)/).map(part => {
    if (!part || /^\s+$/.test(part)) return part;
    const upperPart = part.toUpperCase();
    if (UPPERCASE_ACRONYMS.has(upperPart)) {
      return upperPart;
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join('');
}

/**
 * Otomatis memformat email menjadi huruf kecil (lowercase)
 */
export function formatAutoLowercase(val = '') {
  return val ? val.toLowerCase() : '';
}
