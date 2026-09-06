import { WORK_SCHEDULE, SHIFT_SCHEDULE, WEEKLY_TARGET_HOURS, STATUS_CODES } from '../utils/constants';
import { formatDateDMY, formatDateYMD, formatDuration, formatHumanHours } from '../utils/formatters';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Parses time string "HH:mm:ss" or "HH:mm" on a given base date into Date object
 */
export function parseTimeToDate(timeStr, baseDate = new Date()) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  return d;
}

/**
 * Evaluates Standard Check-In (Schedule vs Actual)
 */
export function evaluateCheckIn(checkInTime, date = new Date()) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const schedule = WORK_SCHEDULE[dayOfWeek];

  if (!schedule || !schedule.start) {
    return { status: STATUS_CODES.ON_TIME, lateMinutes: 0, lateFormatted: '00:00:00', isLate: false, note: 'Libur / Di luar jadwal' };
  }

  const scheduledStart = parseTimeToDate(schedule.start, d);
  const actualCheckIn = parseTimeToDate(checkInTime, d);

  const diffMs = actualCheckIn.getTime() - scheduledStart.getTime();
  if (diffMs > 60 * 1000) {
    const lateMinutes = Math.floor(diffMs / (60 * 1000));
    const lateSecs = Math.floor(diffMs / 1000);
    return {
      status: `${STATUS_CODES.LATE} ${lateMinutes} Menit`,
      lateMinutes,
      lateFormatted: formatDuration(lateSecs),
      isLate: true
    };
  }

  // Datang lebih awal (negatif)
  const earlyDiffSecs = Math.floor(diffMs / 1000);
  return {
    status: STATUS_CODES.ON_TIME,
    lateMinutes: 0,
    lateFormatted: earlyDiffSecs < 0 ? `-${formatDuration(Math.abs(earlyDiffSecs))}` : '00:00:00',
    isLate: false
  };
}

/**
 * Evaluates 3-Shift Check-In (PAGI, SORE, MALAM)
 */
export function evaluateShiftCheckIn(checkInTime, shiftId = 'PAGI', date = new Date()) {
  const d = new Date(date);
  const shift = SHIFT_SCHEDULE[shiftId] || SHIFT_SCHEDULE.PAGI;

  const scheduledStart = parseTimeToDate(shift.start, d);
  const actualCheckIn = parseTimeToDate(checkInTime, d);

  const diffMs = actualCheckIn.getTime() - scheduledStart.getTime();
  if (diffMs > 60 * 1000) {
    const lateMinutes = Math.floor(diffMs / (60 * 1000));
    const lateSecs = Math.floor(diffMs / 1000);
    return {
      status: `${STATUS_CODES.LATE} ${lateMinutes} Menit`,
      lateMinutes,
      lateFormatted: formatDuration(lateSecs),
      isLate: true,
      shiftName: shift.name
    };
  }

  const earlyDiffSecs = Math.floor(diffMs / 1000);
  return {
    status: STATUS_CODES.ON_TIME,
    lateMinutes: 0,
    lateFormatted: earlyDiffSecs < 0 ? `-${formatDuration(Math.abs(earlyDiffSecs))}` : '00:00:00',
    isLate: false,
    shiftName: shift.name
  };
}

/**
 * Evaluates Standard Check-Out (Schedule vs Actual)
 */
export function evaluateCheckOut(checkOutTime, date = new Date()) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const schedule = WORK_SCHEDULE[dayOfWeek];

  if (!schedule || !schedule.end) {
    return { status: STATUS_CODES.COMPLIANT, earlyMinutes: 0, earlyFormatted: '00:00:00', isEarly: false, note: 'Libur / Di luar jadwal' };
  }

  const scheduledEnd = parseTimeToDate(schedule.end, d);
  const actualCheckOut = parseTimeToDate(checkOutTime, d);

  const diffMs = scheduledEnd.getTime() - actualCheckOut.getTime();
  if (diffMs > 60 * 1000) {
    const earlyMinutes = Math.floor(diffMs / (60 * 1000));
    const earlySecs = Math.floor(diffMs / 1000);
    return {
      status: `${STATUS_CODES.EARLY_LEAVE} ${earlyMinutes} Menit`,
      earlyMinutes,
      earlyFormatted: `-${formatDuration(earlySecs)}`,
      isEarly: true
    };
  }

  // Pulang lebih lambat / lembur (positif)
  const extraSecs = Math.floor((actualCheckOut.getTime() - scheduledEnd.getTime()) / 1000);
  return {
    status: STATUS_CODES.COMPLIANT,
    earlyMinutes: 0,
    earlyFormatted: extraSecs > 0 ? `+${formatDuration(extraSecs)}` : '00:00:00',
    isEarly: false
  };
}

/**
 * Evaluates 3-Shift Check-Out (PAGI, SORE, MALAM)
 */
export function evaluateShiftCheckOut(checkOutTime, shiftId = 'PAGI', date = new Date()) {
  const d = new Date(date);
  const shift = SHIFT_SCHEDULE[shiftId] || SHIFT_SCHEDULE.PAGI;

  let scheduledEnd = parseTimeToDate(shift.end, d);
  let actualCheckOut = parseTimeToDate(checkOutTime, d);

  // If overnight shift (MALAM 21:00 - 07:00), end time is next morning
  if (shift.isOvernight && actualCheckOut.getHours() <= 12) {
    // If checking out in morning, compare with morning 07:00 of the same day
    scheduledEnd = parseTimeToDate(shift.end, d);
  }

  const diffMs = scheduledEnd.getTime() - actualCheckOut.getTime();
  if (diffMs > 60 * 1000) {
    const earlyMinutes = Math.floor(diffMs / (60 * 1000));
    const earlySecs = Math.floor(diffMs / 1000);
    return {
      status: `${STATUS_CODES.EARLY_LEAVE} ${earlyMinutes} Menit`,
      earlyMinutes,
      earlyFormatted: `-${formatDuration(earlySecs)}`,
      isEarly: true,
      shiftName: shift.name
    };
  }

  const extraSecs = Math.floor((actualCheckOut.getTime() - scheduledEnd.getTime()) / 1000);
  return {
    status: STATUS_CODES.COMPLIANT,
    earlyMinutes: 0,
    earlyFormatted: extraSecs > 0 ? `+${formatDuration(extraSecs)}` : '00:00:00',
    isEarly: false,
    shiftName: shift.name
  };
}

/**
 * Calculates work duration in seconds and formatted text (handles shift & overnight)
 */
export function calculateWorkDuration(checkInTime, checkOutTime, date = new Date(), isOvernight = false) {
  if (!checkInTime || !checkOutTime) return { seconds: 0, decimalHours: 0, formatted: '00:00:00' };

  const d = new Date(date);
  const inDate = parseTimeToDate(checkInTime, d);
  let outDate = parseTimeToDate(checkOutTime, d);

  // If overnight or outDate is earlier than inDate, add 24 hours
  if (isOvernight || outDate.getTime() < inDate.getTime()) {
    outDate = new Date(outDate.getTime() + 24 * 60 * 60 * 1000);
  }

  let diffMs = outDate.getTime() - inDate.getTime();
  if (diffMs < 0) diffMs = 0;

  const seconds = Math.floor(diffMs / 1000);
  const decimalHours = parseFloat((seconds / 3600).toFixed(2));

  return {
    seconds,
    decimalHours,
    formatted: formatDuration(seconds)
  };
}

/**
 * Gets the total days in a month (28..31)
 */
export function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Generates Weekly Batches (M1 - M5) with dynamic realtime dates for selected Year & Month
 * Supports category filtering ('HARIAN' vs 'SHIFT')
 */
export function buildWeeklyRecap(users = [], attendanceRecords = [], year = 2026, monthIndex = 8, category = 'HARIAN') {
  const totalDays = getDaysInMonth(year, monthIndex);

  const weekSlots = [
    { key: 'REKAP MO1', weekNumber: 1, label: 'Minggu Ke-1 (M1)', startDay: 1, endDay: 7 },
    { key: 'REKAP M2', weekNumber: 2, label: 'Minggu Ke-2 (M2)', startDay: 8, endDay: 14 },
    { key: 'REKAP M3', weekNumber: 3, label: 'Minggu Ke-3 (M3)', startDay: 15, endDay: 21 },
    { key: 'REKAP M4', weekNumber: 4, label: 'Minggu Ke-4 (M4)', startDay: 22, endDay: 28 },
    { key: 'REKAP M5', weekNumber: 5, label: 'Minggu Ke-5 (M5)', startDay: 29, endDay: totalDays }
  ];

  const isShiftMode = category === 'SHIFT';

  return weekSlots.map(week => {
    // Generate dates for this week
    const weekDates = [];
    for (let day = week.startDay; day <= Math.min(week.endDay, totalDays); day++) {
      const d = new Date(year, monthIndex, day);
      const dayOfWeek = d.getDay();
      const schedule = WORK_SCHEDULE[dayOfWeek];
      weekDates.push({
        day,
        dateObj: d,
        dateStr: formatDateDMY(d),
        dayName: DAYS_ID[dayOfWeek],
        scheduleStart: isShiftMode ? 'Shift 3 Sesi' : (schedule?.start || '-'),
        scheduleEnd: isShiftMode ? 'Shift 3 Sesi' : (schedule?.end || '-'),
        isSunday: dayOfWeek === 0,
        targetHours: isShiftMode ? 7.0 : (schedule?.targetHours || 0)
      });
    }

    const userSummaries = users.map(user => {
      let totalSeconds = 0;
      let presentDays = 0;
      let lateDays = 0;
      let earlyDays = 0;
      let leaveDays = 0;
      let sickDays = 0;
      let cutiDays = 0;
      let dailyDetails = [];

      weekDates.forEach(wDate => {
        const currentDate = wDate.dateObj;
        const dateStr = wDate.dateStr;
        const dayOfWeek = currentDate.getDay();
        const schedule = WORK_SCHEDULE[dayOfWeek];

        // Find attendance records for this user and date
        const userRecords = attendanceRecords.filter(
          r => (r.email === user.email || r.userName === user.name) && r.date === dateStr
        );

        let checkIn, checkOut, leave;

        if (isShiftMode) {
          // Shift records: has category === 'SHIFT' or shiftType or type contains 'Shift'
          const shiftRecords = userRecords.filter(r => r.category === 'SHIFT' || r.shiftType || r.type?.includes('Shift'));
          checkIn = shiftRecords.find(r => r.type === 'Shift Masuk' || r.type === 'Masuk' || r.type === 'HARIAN_MASUK');
          checkOut = shiftRecords.find(r => r.type === 'Shift Pulang' || r.type === 'Pulang' || r.type === 'HARIAN_PULANG');
          leave = userRecords.find(r => ['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].includes(r.type) && r.category === 'SHIFT');
        } else {
          // Non-shift records: category !== 'SHIFT'
          const harianRecords = userRecords.filter(r => r.category !== 'SHIFT' && !r.shiftType && !r.type?.includes('Shift'));
          checkIn = harianRecords.find(r => r.type === 'Masuk' || r.type === 'HARIAN_MASUK');
          checkOut = harianRecords.find(r => r.type === 'Pulang' || r.type === 'HARIAN_PULANG');
          leave = userRecords.find(r => ['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].includes(r.type) && r.category !== 'SHIFT');
        }

        let dayStatus = '-';
        let durationFormatted = '00:00:00';
        let durationHours = 0;
        let lateText = '-';
        let earlyText = '-';
        let shiftLabel = isShiftMode ? (checkIn?.shiftName || checkIn?.shiftType ? `Shift ${checkIn.shiftType || checkIn.shiftName}` : '-') : '';
        let isCuti = false;
        let isIzin = false;
        let isSakit = false;

        if (dayOfWeek === 0 && !isShiftMode) {
          dayStatus = 'Libur';
        } else if (leave) {
          dayStatus = leave.type;
          if (leave.type === 'Cuti') { isCuti = true; cutiDays++; }
          else if (leave.type === 'Sakit') { isSakit = true; sickDays++; }
          else { isIzin = true; leaveDays++; }
        } else if (checkIn) {
          presentDays++;
          
          if (isShiftMode) {
            const shiftId = checkIn.shiftType || 'PAGI';
            const inEval = evaluateShiftCheckIn(checkIn.time, shiftId, currentDate);
            lateText = inEval.lateFormatted;
            if (inEval.isLate) lateDays++;

            if (checkOut) {
              const isOvernight = shiftId === 'MALAM';
              const duration = calculateWorkDuration(checkIn.time, checkOut.time, currentDate, isOvernight);
              totalSeconds += duration.seconds;
              durationFormatted = duration.formatted;
              durationHours = duration.decimalHours;
              const outEval = evaluateShiftCheckOut(checkOut.time, shiftId, currentDate);
              earlyText = outEval.earlyFormatted;
              if (outEval.isEarly) earlyDays++;
              dayStatus = `Hadir (${checkIn.shiftType || 'Pagi'})`;
            } else {
              dayStatus = 'Belum Pulang';
              totalSeconds += 7 * 3600;
            }
          } else {
            const inEval = evaluateCheckIn(checkIn.time, currentDate);
            lateText = inEval.lateFormatted;
            if (inEval.isLate) lateDays++;

            if (checkOut) {
              const duration = calculateWorkDuration(checkIn.time, checkOut.time, currentDate);
              totalSeconds += duration.seconds;
              durationFormatted = duration.formatted;
              durationHours = duration.decimalHours;
              const outEval = evaluateCheckOut(checkOut.time, currentDate);
              earlyText = outEval.earlyFormatted;
              if (outEval.isEarly) earlyDays++;
              dayStatus = 'Hadir';
            } else {
              dayStatus = 'Belum Pulang';
              totalSeconds += (schedule?.targetHours || 7) * 0.5 * 3600;
            }
          }
        } else {
          const today = new Date();
          if (currentDate < today && (isShiftMode || dayOfWeek !== 0)) {
            dayStatus = isShiftMode ? 'Off / Tidak Hadir' : 'Alpa';
          }
        }

        dailyDetails.push({
          day: wDate.day,
          dayName: wDate.dayName,
          date: dateStr,
          scheduleIn: isShiftMode ? (checkIn?.shiftTimeStart || '07:00') : wDate.scheduleStart,
          scheduleOut: isShiftMode ? (checkOut?.shiftTimeEnd || '14:00') : wDate.scheduleEnd,
          shiftLabel,
          checkIn: checkIn ? checkIn.time : '-',
          checkInEvidence: checkIn ? (checkIn.evidenceUrl || checkIn.evidenceSnapshot) : '',
          checkOut: checkOut ? checkOut.time : '-',
          checkOutEvidence: checkOut ? (checkOut.evidenceUrl || checkOut.evidenceSnapshot) : '',
          lateText,
          earlyText,
          durationFormatted,
          durationHours,
          isCuti,
          isIzin,
          isSakit,
          status: dayStatus
        });
      });

      const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));
      const targetDifference = parseFloat((totalHours - WEEKLY_TARGET_HOURS).toFixed(2));
      const isTargetMet = totalHours >= WEEKLY_TARGET_HOURS;

      return {
        user,
        dailyDetails,
        totalSeconds,
        totalHours,
        totalHoursHuman: formatHumanHours(totalHours),
        targetDifference,
        isTargetMet,
        targetStatus: isTargetMet 
          ? `Tercapai (+${targetDifference} Jam)` 
          : `Kurang (${targetDifference} Jam)`,
        presentDays,
        lateDays,
        earlyDays,
        leaveDays,
        sickDays,
        cutiDays
      };
    });

    return {
      ...week,
      weekDates,
      users: userSummaries
    };
  });
}

/**
 * Builds Monthly Total Recap combining all weeks
 */
export function buildMonthlyRecap(users = [], weeklyRecap = []) {
  return users.map(user => {
    let grandTotalHours = 0;
    let grandPresentDays = 0;
    let grandLateDays = 0;
    let grandEarlyDays = 0;
    let grandLeaveDays = 0;
    let grandSickDays = 0;
    let grandCutiDays = 0;
    let weeklyBreakdown = [];

    weeklyRecap.forEach(week => {
      const userSummary = week.users.find(u => u.user.email === user.email) || {};
      const hours = userSummary.totalHours || 0;
      grandTotalHours += hours;
      grandPresentDays += userSummary.presentDays || 0;
      grandLateDays += userSummary.lateDays || 0;
      grandEarlyDays += userSummary.earlyDays || 0;
      grandLeaveDays += userSummary.leaveDays || 0;
      grandSickDays += userSummary.sickDays || 0;
      grandCutiDays += userSummary.cutiDays || 0;

      weeklyBreakdown.push({
        weekName: week.label,
        totalHours: hours,
        isTargetMet: userSummary.isTargetMet || false
      });
    });

    const targetMonthlyHours = WEEKLY_TARGET_HOURS * 4;
    const isMonthlyTargetMet = grandTotalHours >= targetMonthlyHours;

    return {
      user,
      grandTotalHours: parseFloat(grandTotalHours.toFixed(2)),
      grandTotalHoursHuman: formatHumanHours(grandTotalHours),
      grandPresentDays,
      grandLateDays,
      grandEarlyDays,
      grandLeaveDays,
      grandSickDays,
      grandCutiDays,
      weeklyBreakdown,
      targetMonthlyHours,
      isMonthlyTargetMet
    };
  });
}

