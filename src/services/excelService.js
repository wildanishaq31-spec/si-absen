import * as XLSX from 'xlsx';
import { buildWeeklyRecap, buildMonthlyRecap } from './attendanceCore';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Generates and downloads a multi-tab Excel (.xlsx) file for complete attendance recaps
 * Supports all attendance types: Harian, 3-Shift, D3, Dinas Luar, Izin/Sakit/Cuti
 */
export function exportAttendanceExcel(users, attendanceRecords, year = 2026, monthIndex = 8, category = 'SEMUA') {
  const wb = XLSX.utils.book_new();
  const monthName = MONTH_NAMES[monthIndex] || 'Bulan';
  const prefix = category || 'SEMUA';
  const records = attendanceRecords || [];

  // 1. Sheet "Absen Masuk"
  const masukRows = records
    .filter(r => r.type === 'Masuk' || r.type === 'HARIAN_MASUK' || r.type === 'Shift Masuk' || r.type === 'SHIFT_MASUK' || r.type === 'D3' || r.type === 'D3 Masuk' || (r.category === 'D3' && r.type?.includes('Masuk')))
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Email Address': r.email || '',
      'Nama Pegawai': r.userName || '',
      'Jenis Presensi': r.type || 'Masuk',
      'Kategori/Shift': r.shiftName || r.shiftType || (r.type?.includes('D3') || r.category === 'D3' ? 'D3' : 'Harian'),
      'Bukti Foto': r.evidenceUrl || '',
      'Tanggal': r.date || '',
      'Jam': r.time || '',
      'Status': r.status || '',
      'Lokasi': r.location || ''
    }));

  if (masukRows.length > 0) {
    const wsMasuk = XLSX.utils.json_to_sheet(masukRows);
    XLSX.utils.book_append_sheet(wb, wsMasuk, 'Absen Masuk');
  }

  // 2. Sheet "Absen Pulang"
  const pulangRows = records
    .filter(r => r.type === 'Pulang' || r.type === 'HARIAN_PULANG' || r.type === 'Shift Pulang' || r.type === 'SHIFT_PULANG' || r.type === 'D3 Pulang' || (r.category === 'D3' && r.type?.includes('Pulang')))
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Email Address': r.email || '',
      'Nama Pegawai': r.userName || '',
      'Jenis Presensi': r.type || 'Pulang',
      'Kategori/Shift': r.shiftName || r.shiftType || (r.type?.includes('D3') || r.category === 'D3' ? 'D3' : 'Harian'),
      'Bukti Foto': r.evidenceUrl || '',
      'Tanggal': r.date || '',
      'Jam': r.time || '',
      'Status': r.status || '',
      'Jumlah Jam Kerja': r.workDuration || ''
    }));

  if (pulangRows.length > 0) {
    const wsPulang = XLSX.utils.json_to_sheet(pulangRows);
    XLSX.utils.book_append_sheet(wb, wsPulang, 'Absen Pulang');
  }

  // 3. Sheet "Daftar Dinas Luar"
  const dinasLuarRows = records
    .filter(r => r.type === 'Dinas Luar')
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Nama Pegawai': r.userName || '',
      'NIP': r.nip || '-',
      'Unit Kerja': r.skpd || '',
      'Tanggal': r.date || '',
      'Jam Pengajuan': r.time || '',
      'Lokasi Tujuan': r.location || '',
      'Keterangan / Tugas': r.reason || r.notes || 'Dinas Luar Instansi',
      'Bukti Foto Lapangan': r.evidenceUrl || '',
      'Status': 'Terverifikasi'
    }));

  if (dinasLuarRows.length > 0) {
    const wsDinasLuar = XLSX.utils.json_to_sheet(dinasLuarRows);
    XLSX.utils.book_append_sheet(wb, wsDinasLuar, 'Daftar Dinas Luar');
  }

  // 4. Sheet "Daftar Izin & Cuti"
  const izinCutiRows = records
    .filter(r => ['Izin', 'Sakit', 'Cuti'].includes(r.type))
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Nama Pegawai': r.userName || '',
      'NIP': r.nip || '-',
      'Jenis Pengajuan': r.type,
      'Tanggal Mulai': r.startDate || r.date || '',
      'Tanggal Selesai': r.endDate || r.date || '',
      'Alasan / Keterangan': r.reason || r.notes || '-',
      'Bukti Surat Dokter / Izin': r.evidenceUrl || '',
      'Status': 'Disetujui'
    }));

  if (izinCutiRows.length > 0) {
    const wsIzinCuti = XLSX.utils.json_to_sheet(izinCutiRows);
    XLSX.utils.book_append_sheet(wb, wsIzinCuti, 'Daftar Izin & Cuti');
  }

  // 5. Sheet "Daftar Presensi D3"
  const d3Rows = records
    .filter(r => r.type === 'D3' || r.type === 'D3 Masuk' || r.type === 'D3 Pulang' || r.category === 'D3')
    .map(r => ({
      'Timestamp': r.timestamp || '',
      'Nama Pegawai': r.userName || '',
      'NIP': r.nip || '-',
      'Tipe Presensi': r.type || (r.category === 'D3' ? 'D3' : 'D3'),
      'Tanggal': r.date || '',
      'Jam': r.time || '',
      'Jumlah Jam Kerja': r.workDuration || '-',
      'Lokasi': r.location || '',
      'Bukti Foto': r.evidenceUrl || '',
      'Status': r.status || 'Hadir (D3)'
    }));

  if (d3Rows.length > 0) {
    const wsD3 = XLSX.utils.json_to_sheet(d3Rows);
    XLSX.utils.book_append_sheet(wb, wsD3, 'Daftar D3');
  }

  // 6. Weekly Recap Sheets (REKAP M1 s/d REKAP M5)
  const weeklyRecap = buildWeeklyRecap(users, records, year, monthIndex, category);

  weeklyRecap.forEach((week) => {
    const detailTableRows = [];

    week.users?.forEach(u => {
      u.dailyDetails?.forEach(d => {
        detailTableRows.push({
          'NAMA': u.user.name,
          'Hari / Tanggal': `${d.dayName} (${d.date})`,
          'Jenis / Shift': d.shiftLabel || (d.isDinasLuar ? 'Dinas Luar' : d.isD3 ? 'D3' : 'Harian Standar'),
          'Jadwal Masuk': d.scheduleIn,
          'Jadwal Pulang': d.scheduleOut,
          'Jam Masuk': d.checkIn,
          'Terlambat': d.lateText,
          'Jam Pulang': d.checkOut,
          'Pulang Awal': d.earlyText,
          'Bukti Masuk': d.checkInEvidence || '',
          'Bukti Pulang': d.checkOutEvidence || '',
          'Dinas Luar': d.isDinasLuar ? '✓' : '',
          'D3': d.isD3 ? '✓' : '',
          'Cuti': d.isCuti ? '✓' : '',
          'Izin': d.isIzin ? '✓' : '',
          'Sakit': d.isSakit ? '✓' : '',
          'Jumlah Jam Kerja': d.durationFormatted,
          'Total Jam Mingguan': `${u.totalHours} Jam`,
          'Status Target (41 Jam)': u.targetStatus
        });
      });
    });

    if (detailTableRows.length > 0) {
      const wsWeek = XLSX.utils.json_to_sheet(detailTableRows);
      XLSX.utils.book_append_sheet(wb, wsWeek, `${week.key}`);
    }
  });

  // 7. Sheet "REKAP TOTAL SEMUA JENIS" (Perbandingan Lengkap Per Pegawai)
  const totalSemuaJenisRows = users.map(user => {
    const userRecs = records.filter(r => r.email === user.email || r.userName === user.name);
    const hadirHarian = userRecs.filter(r => (r.type === 'Masuk' || r.type === 'HARIAN_MASUK') && r.category !== 'SHIFT').length;
    const hadirShift = userRecs.filter(r => r.type === 'Shift Masuk' || r.type === 'SHIFT_MASUK' || r.category === 'SHIFT').length;
    const hadirD3 = userRecs.filter(r => r.type === 'D3' || r.type === 'D3 Masuk' || (r.category === 'D3' && !r.type?.includes('Pulang'))).length;
    const dinasLuar = userRecs.filter(r => r.type === 'Dinas Luar').length;
    const izin = userRecs.filter(r => r.type === 'Izin').length;
    const sakit = userRecs.filter(r => r.type === 'Sakit').length;
    const cuti = userRecs.filter(r => r.type === 'Cuti').length;

    let grandHours = 0;
    weeklyRecap.forEach(w => {
      const uSummary = w.users?.find(u => u.user.email === user.email) || {};
      grandHours += (uSummary.totalHours || 0);
    });

    return {
      'Nama Pegawai': user.name,
      'NIP': user.nip || '-',
      'Unit Kerja': user.skpd || 'UPTD Puskesmas Cermee',
      'Hadir Harian (Pagi)': hadirHarian,
      'Hadir 3-Shift': hadirShift,
      'Hadir D3': hadirD3,
      'Dinas Luar (DL)': dinasLuar,
      'Izin (I)': izin,
      'Sakit (S)': sakit,
      'Cuti (C)': cuti,
      'Total Jam 1 Bulan': `${parseFloat(grandHours.toFixed(2))} Jam`,
      'Target Bulanan (164 Jam)': grandHours >= 164 ? 'Tercapai' : 'Kurang Target'
    };
  });

  const wsTotalSemua = XLSX.utils.json_to_sheet(totalSemuaJenisRows);
  XLSX.utils.book_append_sheet(wb, wsTotalSemua, 'REKAP SEMUA JENIS');

  // 8. Sheet "REKAP BULANAN"
  const monthlyRecap = buildMonthlyRecap(users, weeklyRecap);
  const monthlyRows = monthlyRecap.map(m => ({
    'Nama Pegawai': m.user.name,
    'NIP': m.user.nip || '-',
    'Email': m.user.email,
    'Unit Kerja': m.user.skpd || 'UPTD Puskesmas Cermee',
    'Total Jam Kerja Sebulan': `${m.grandTotalHours} Jam`,
    'Target Bulanan (164 Jam)': m.isMonthlyTargetMet ? 'Tercapai' : 'Kurang Target',
    'Total Hari Hadir': m.grandPresentDays,
    'Total Terlambat': m.grandLateDays,
    'Total Pulang Cepat': m.grandEarlyDays,
    'Total Dinas Luar': m.grandDinasLuarDays || 0,
    'Total D3': m.grandD3Days || 0,
    'Total Izin': m.grandLeaveDays,
    'Total Sakit': m.grandSickDays,
    'Total Cuti': m.grandCutiDays || 0
  }));

  const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
  XLSX.utils.book_append_sheet(wb, wsMonthly, 'REKAP BULANAN');

  // Trigger File Download
  const filename = `REKAP_SI_ABSEN_${prefix}_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
}


