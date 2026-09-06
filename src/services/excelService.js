import * as XLSX from 'xlsx';
import { buildWeeklyRecap, buildMonthlyRecap } from './attendanceCore';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Generates and downloads a multi-tab Excel (.xlsx) file matching the Google Spreadsheet format
 * Supports category separation: 'HARIAN' vs 'SHIFT'
 */
export function exportAttendanceExcel(users, attendanceRecords, year = 2026, monthIndex = 8, category = 'HARIAN') {
  const wb = XLSX.utils.book_new();
  const monthName = MONTH_NAMES[monthIndex] || 'Bulan';
  const isShiftMode = category === 'SHIFT';
  const prefix = isShiftMode ? 'SHIFT' : 'HARIAN';

  const isShiftRecord = (r) => r.category === 'SHIFT' || Boolean(r.shiftType) || r.type?.includes('Shift');
  const filteredRecords = (attendanceRecords || []).filter(r => isShiftMode ? isShiftRecord(r) : !isShiftRecord(r));

  // 1. Sheet "Absen Masuk" / "Shift Masuk"
  const masukRows = filteredRecords
    .filter(r => r.type === 'Masuk' || r.type === 'HARIAN_MASUK' || r.type === 'Shift Masuk' || ['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].includes(r.type))
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Email Address': r.email || '',
      'Nama': r.userName || '',
      'Kehadiran': r.type || 'Masuk',
      'Kategori': isShiftMode ? (r.shiftName || r.shiftType || 'Shift') : 'Harian',
      'Bukti Kehadiran/Surat/Izin': r.evidenceUrl || '',
      'Nama-Tanggal-Keterangan': r.compositeKey || '',
      'Tanggal': r.date || '',
      'Jam': r.time || '',
      'Status': r.status || '',
      'Lokasi': r.location || ''
    }));

  const wsMasuk = XLSX.utils.json_to_sheet(masukRows);
  XLSX.utils.book_append_sheet(wb, wsMasuk, isShiftMode ? 'Absen Masuk Shift' : 'Absen Masuk');

  // 2. Sheet "Absen Pulang" / "Shift Pulang"
  const pulangRows = filteredRecords
    .filter(r => r.type === 'Pulang' || r.type === 'HARIAN_PULANG' || r.type === 'Shift Pulang')
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Email Address': r.email || '',
      'Nama': r.userName || '',
      'Kategori': isShiftMode ? (r.shiftName || r.shiftType || 'Shift') : 'Harian',
      'Bukti Pulang': r.evidenceUrl || '',
      'Nama-Tanggal-Keterangan': r.compositeKey || '',
      'Tanggal': r.date || '',
      'Jam': r.time || '',
      'Status': r.status || '',
      'Jumlah Jam Kerja': r.workDuration || ''
    }));

  const wsPulang = XLSX.utils.json_to_sheet(pulangRows);
  XLSX.utils.book_append_sheet(wb, wsPulang, isShiftMode ? 'Absen Pulang Shift' : 'Absen Pulang');

  // 3. Weekly Recap Sheets (REKAP MO1 s/d REKAP M5)
  const weeklyRecap = buildWeeklyRecap(users, attendanceRecords, year, monthIndex, category);

  weeklyRecap.forEach((week) => {
    const detailTableRows = [];

    week.users.forEach(u => {
      u.dailyDetails.forEach(d => {
        detailTableRows.push({
          'NAMA': u.user.name,
          'Hari / Tanggal': `${d.dayName} (${d.date})`,
          'Sesi / Shift': d.shiftLabel || (isShiftMode ? 'Shift' : 'Harian Standar'),
          'Jadwal Masuk': d.scheduleIn,
          'Jadwal Pulang': d.scheduleOut,
          'Jam Masuk': d.checkIn,
          'Terlambat': d.lateText,
          'Jam Pulang': d.checkOut,
          'Pulang Awal': d.earlyText,
          'Bukti Masuk': d.checkInEvidence || '',
          'Bukti Pulang': d.checkOutEvidence || '',
          'Cuti': d.isCuti ? '✓' : '',
          'Izin': d.isIzin ? '✓' : '',
          'Sakit': d.isSakit ? '✓' : '',
          'Jumlah Jam Kerja': d.durationFormatted,
          'Total Jam Mingguan': `${u.totalHours} Jam`,
          'Status Target (41 Jam)': u.targetStatus
        });
      });
    });

    const wsWeek = XLSX.utils.json_to_sheet(detailTableRows);
    XLSX.utils.book_append_sheet(wb, wsWeek, `${week.key} ${prefix}`);
  });

  // 4. Sheet "REKAP TOTAL PERMINGGU"
  const totalPerMingguRows = users.map(user => {
    const row = {
      'Nama Pegawai': user.name,
      'NIP': user.nip || '-',
      'Email': user.email,
      'Kategori': isShiftMode ? 'Dinas 3-Shift' : 'Harian'
    };

    let grandHours = 0;
    weeklyRecap.forEach((week, idx) => {
      const uSummary = week.users.find(u => u.user.email === user.email) || {};
      const hrs = uSummary.totalHours || 0;
      grandHours += hrs;
      row[`M${idx + 1} (${week.label})`] = `${hrs} Jam (${uSummary.isTargetMet ? 'Tercapai' : 'Kurang'})`;
    });

    row['TOTAL JAM 1 BULAN'] = `${parseFloat(grandHours.toFixed(2))} Jam`;
    row['RATA-RATA JAM / MINGGU'] = `${parseFloat((grandHours / 5).toFixed(2))} Jam`;
    return row;
  });

  const wsTotalMinggu = XLSX.utils.json_to_sheet(totalPerMingguRows);
  XLSX.utils.book_append_sheet(wb, wsTotalMinggu, `REKAP TOTAL ${prefix}`);

  // 5. Sheet "REKAP BULANAN"
  const monthlyRecap = buildMonthlyRecap(users, weeklyRecap);
  const monthlyRows = monthlyRecap.map(m => ({
    'Nama Pegawai': m.user.name,
    'NIP': m.user.nip || '-',
    'Email': m.user.email,
    'Unit Kerja': m.user.skpd || 'UPTD Puskesmas Cermee',
    'Kategori': isShiftMode ? 'Dinas 3-Shift' : 'Harian',
    'Total Jam Kerja Sebulan': `${m.grandTotalHours} Jam`,
    'Target Bulanan (164 Jam)': m.isMonthlyTargetMet ? 'Tercapai' : 'Kurang Target',
    'Total Hari Hadir': m.grandPresentDays,
    'Total Terlambat': m.grandLateDays,
    'Total Pulang Cepat': m.grandEarlyDays,
    'Total Izin': m.grandLeaveDays,
    'Total Sakit': m.grandSickDays,
    'Total Cuti': m.grandCutiDays || 0
  }));

  const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
  XLSX.utils.book_append_sheet(wb, wsMonthly, `REKAP BULANAN ${prefix}`);

  // Trigger File Download
  const filename = `REKAP_SI_ABSEN_${prefix}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
}

