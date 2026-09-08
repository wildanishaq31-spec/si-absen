import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { storageService } from '../services/storage';
import { cloudApiService } from '../services/cloudApi';
import { rustfsService } from '../services/rustfsService';
import { exportAttendanceExcel } from '../services/excelService';
import { evaluateCheckIn, evaluateCheckOut, evaluateShiftCheckIn, evaluateShiftCheckOut, calculateWorkDuration } from '../services/attendanceCore';
import { formatDateDMY, formatTimeHMS, generateCompositeKey } from '../utils/formatters';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  const { currentUser, users } = useAuth();
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(storageService.getSettings());
  const [toast, setToast] = useState(null);

  const refreshAttendanceFromCloud = useCallback(async () => {
    try {
      const cloudData = await cloudApiService.fetchAllData();
      if (cloudData && Array.isArray(cloudData.attendance)) {
        // Cloud database is authoritative source: update local storage and state directly
        storageService.saveAttendance(cloudData.attendance);
        setRecords(cloudData.attendance);
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data presensi dari Vercel Postgres:', err);
    }
  }, []);

  useEffect(() => {
    setRecords(storageService.getAttendance());
    refreshAttendanceFromCloud();
  }, [refreshAttendanceFromCloud]);

  const closeToast = () => setToast(null);

  const showToast = (message, type = 'success', options = {}) => {
    const isSuccess = type === 'success' || type === 'sukses';
    if (isSuccess) {
      triggerSuccessAnimation();
    }
    setToast({
      id: Date.now(),
      message,
      type,
      title: options.title,
      confirmText: options.confirmText || (isSuccess ? 'DONE' : type === 'error' ? 'TRY AGAIN' : 'OKE'),
      cancelText: options.cancelText,
      isConfirm: false
    });
  };

  const showAlert = ({ title, message, type = 'info', confirmText = 'OKE', onClose }) => {
    setToast({
      id: Date.now(),
      title,
      message,
      type,
      confirmText,
      isConfirm: false,
      onConfirm: () => {
        setToast(null);
        if (onClose) onClose();
      }
    });
  };

  const showSuccess = (message, title = 'SUCCESS!', confirmText = 'DONE') => {
    triggerSuccessAnimation();
    setToast({
      id: Date.now(),
      title,
      message,
      type: 'success',
      confirmText,
      isConfirm: false,
      onConfirm: () => setToast(null)
    });
  };

  const showError = (message, title = 'OH NO...', confirmText = 'TRY AGAIN') => {
    setToast({
      id: Date.now(),
      title,
      message,
      type: 'error',
      confirmText,
      isConfirm: false,
      onConfirm: () => setToast(null)
    });
  };

  const showWarning = (message, title = 'PERHATIAN!', confirmText = 'MENGERTI') => {
    setToast({
      id: Date.now(),
      title,
      message,
      type: 'warning',
      confirmText,
      isConfirm: false,
      onConfirm: () => setToast(null)
    });
  };

  const showConfirm = ({
    title = 'KONFIRMASI',
    message,
    type = 'warning',
    confirmText = 'YA, LANJUTKAN',
    cancelText = 'BATAL',
    onConfirm,
    onCancel
  }) => {
    setToast({
      id: Date.now(),
      title,
      message,
      type,
      confirmText,
      cancelText,
      isConfirm: true,
      onConfirm: () => {
        setToast(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setToast(null);
        if (onCancel) onCancel();
      }
    });
  };

  const triggerSuccessAnimation = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00838F', '#00ACC1', '#26A69A', '#4CAF50']
      });
    } catch (e) {
      console.log('Confetti not available:', e);
    }
  };

  // Find today's attendance for currently logged in user
  const todayStr = formatDateDMY(new Date());
  const userTodayRecords = records.filter(
    r => currentUser && (r.email === currentUser.email || r.userName === currentUser.name) && r.date === todayStr
  );

  const todayCheckIn = userTodayRecords.find(r => r.type === 'Masuk' || r.type === 'HARIAN_MASUK' || r.type === 'Shift Masuk');
  const todayCheckOut = userTodayRecords.find(r => r.type === 'Pulang' || r.type === 'HARIAN_PULANG' || r.type === 'Shift Pulang');
  const todayLeave = userTodayRecords.find(r => ['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].includes(r.type));

  /**
   * Helper to upload photo to RustFS (Mode Server) or generate Google Drive link
   */
  const processEvidencePhoto = async (evidenceDataUrl, fileNamePrefix) => {
    if (!evidenceDataUrl) return null;

    // 1. Mode Server (RustFS Dedicated Storage)
    if (settings.storageProvider === 'SERVER' && settings.rustfsEndpoint) {
      try {
        const cleanPrefix = (fileNamePrefix || 'presensi').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${cleanPrefix}_${Date.now()}.jpg`;
        const res = await rustfsService.uploadPhoto({
          base64Data: evidenceDataUrl,
          fileName,
          endpoint: settings.rustfsEndpoint,
          bucket: settings.rustfsBucket || 'bukti-presensi',
          apiKey: settings.rustfsApiKey || ''
        });

        if (res && res.url) {
          return res.url;
        }
      } catch (err) {
        console.warn('Gagal upload ke RustFS:', err);
      }
    }

    // 2. Mode Google Drive Storage Folder
    if (settings.googleDriveFolderUrl) {
      return settings.googleDriveFolderUrl;
    }

    return null;
  };

  /**
   * Submit Check-in (Masuk / Shift Masuk)
   */
  const doCheckIn = async ({ 
    evidenceDataUrl, 
    locationInfo, 
    distanceMeters, 
    isInRadius = true, 
    type = 'Masuk',
    category = 'HARIAN',
    shiftType = null 
  }) => {
    if (!currentUser) return { success: false, message: 'Harap login terlebih dahulu.' };

    // Strict Location Lock Check
    if (settings.strictLocationLock && !isInRadius && distanceMeters > (settings.officeRadiusMeters || 100)) {
      showToast(`Gagal Absen! Anda berada di luar radius kantor (${distanceMeters} meter dari titik lokasi yang dikunci). Harap mendekat ke kantor atau ajukan Dinas Luar.`, 'error');
      return { success: false, message: 'Di luar radius lokasi yang dikunci.' };
    }

    const now = new Date();
    const dateStr = formatDateDMY(now);
    const timeStr = formatTimeHMS(now);
    
    let evaluation;
    const isShift = category === 'SHIFT' || Boolean(shiftType);
    
    if (isShift) {
      evaluation = evaluateShiftCheckIn(timeStr, shiftType || 'PAGI', now);
    } else {
      evaluation = evaluateCheckIn(timeStr, now);
    }

    const recordType = isShift ? 'Shift Masuk' : (type || 'Masuk');
    const shiftLabel = isShift ? (shiftType === 'PAGI' ? 'Shift Pagi' : shiftType === 'SORE' ? 'Shift Sore' : 'Shift Malam') : null;
    const compositeKeyStr = generateCompositeKey(currentUser.name, now, recordType);

    // Process photo to RustFS / Drive
    const finalEvidenceUrl = await processEvidencePhoto(evidenceDataUrl, `${currentUser.name}_IN`);

    const newRecord = {
      id: `ATT-IN-${Date.now()}`,
      timestamp: `${dateStr} ${timeStr}`,
      email: currentUser.email,
      userName: currentUser.name,
      nip: currentUser.nip || '',
      skpd: currentUser.skpd || '',
      type: recordType,
      category: isShift ? 'SHIFT' : 'HARIAN',
      shiftType: isShift ? (shiftType || 'PAGI') : null,
      shiftName: shiftLabel,
      shiftTimeStart: isShift ? (shiftType === 'SORE' ? '14:00' : shiftType === 'MALAM' ? '21:00' : '07:00') : null,
      shiftTimeEnd: isShift ? (shiftType === 'SORE' ? '21:00' : shiftType === 'MALAM' ? '07:00' : '14:00') : null,
      evidenceUrl: finalEvidenceUrl,
      evidenceSnapshot: evidenceDataUrl || null,
      compositeKey: compositeKeyStr,
      date: dateStr,
      time: timeStr,
      status: evaluation.status,
      isLate: evaluation.isLate,
      location: locationInfo || `${currentUser.skpd} (${settings.officeLatitude || -7.780344}, ${settings.officeLongitude || 114.030344})`
    };

    const updated = storageService.addAttendance(newRecord);
    setRecords([newRecord, ...records.filter(r => r.id !== newRecord.id)]);

    // Sync directly to Vercel Postgres Cloud Database
    cloudApiService.syncAttendance(newRecord, settings?.googleDriveFolderUrl);

    triggerSuccessAnimation();
    showToast(`Presensi ${isShift ? shiftLabel : 'Masuk'} Berhasil! Status: ${evaluation.status}`, 'success');
    return { success: true, record: newRecord };
  };

  /**
   * Submit Check-out (Pulang / Shift Pulang)
   */
  const doCheckOut = async ({ 
    evidenceDataUrl, 
    locationInfo, 
    distanceMeters, 
    isInRadius = true,
    category = 'HARIAN',
    shiftType = null 
  }) => {
    if (!currentUser) return { success: false, message: 'Harap login terlebih dahulu.' };
    
    // Strict Location Lock Check
    if (settings.strictLocationLock && !isInRadius && distanceMeters > (settings.officeRadiusMeters || 100)) {
      showToast(`Gagal Absen Pulang! Anda berada di luar radius kantor (${distanceMeters} meter dari titik lokasi yang dikunci).`, 'error');
      return { success: false, message: 'Di luar radius lokasi yang dikunci.' };
    }

    const now = new Date();
    const dateStr = formatDateDMY(now);
    const timeStr = formatTimeHMS(now);

    const isShift = category === 'SHIFT' || Boolean(shiftType);
    let evaluation;
    let duration;

    // Find previous check-in for duration calculation
    const matchingCheckIn = userTodayRecords.find(r => 
      isShift 
        ? (r.category === 'SHIFT' && (r.type === 'Shift Masuk' || r.type === 'Masuk'))
        : (r.category !== 'SHIFT' && (r.type === 'Masuk' || r.type === 'HARIAN_MASUK'))
    ) || todayCheckIn;

    const checkInTimeRef = matchingCheckIn ? matchingCheckIn.time : (isShift ? (shiftType === 'SORE' ? '14:00' : shiftType === 'MALAM' ? '21:00' : '07:00') : '07:30');

    if (isShift) {
      const activeShiftId = shiftType || matchingCheckIn?.shiftType || 'PAGI';
      evaluation = evaluateShiftCheckOut(timeStr, activeShiftId, now);
      const isOvernight = activeShiftId === 'MALAM';
      duration = calculateWorkDuration(checkInTimeRef, timeStr, now, isOvernight);
    } else {
      evaluation = evaluateCheckOut(timeStr, now);
      duration = calculateWorkDuration(checkInTimeRef, timeStr, now);
    }

    const recordType = isShift ? 'Shift Pulang' : 'Pulang';
    const shiftLabel = isShift ? (shiftType === 'PAGI' ? 'Shift Pagi' : shiftType === 'SORE' ? 'Shift Sore' : 'Shift Malam') : null;
    const compositeKeyStr = generateCompositeKey(currentUser.name, now, recordType);

    // Process photo to RustFS / Drive
    const finalEvidenceUrl = await processEvidencePhoto(evidenceDataUrl, `${currentUser.name}_OUT`);

    const newRecord = {
      id: `ATT-OUT-${Date.now()}`,
      timestamp: `${dateStr} ${timeStr}`,
      email: currentUser.email,
      userName: currentUser.name,
      nip: currentUser.nip || '',
      skpd: currentUser.skpd || '',
      type: recordType,
      category: isShift ? 'SHIFT' : 'HARIAN',
      shiftType: isShift ? (shiftType || matchingCheckIn?.shiftType || 'PAGI') : null,
      shiftName: shiftLabel,
      shiftTimeStart: isShift ? (shiftType === 'SORE' ? '14:00' : shiftType === 'MALAM' ? '21:00' : '07:00') : null,
      shiftTimeEnd: isShift ? (shiftType === 'SORE' ? '21:00' : shiftType === 'MALAM' ? '07:00' : '14:00') : null,
      evidenceUrl: finalEvidenceUrl,
      evidenceSnapshot: evidenceDataUrl || null,
      compositeKey: compositeKeyStr,
      date: dateStr,
      time: timeStr,
      status: evaluation.status,
      isEarly: evaluation.isEarly,
      workDuration: duration.formatted,
      workDurationHours: duration.decimalHours,
      location: locationInfo || `${currentUser.skpd} (${settings.officeLatitude || -7.780344}, ${settings.officeLongitude || 114.030344})`
    };

    const updated = storageService.addAttendance(newRecord);
    setRecords([newRecord, ...records.filter(r => r.id !== newRecord.id)]);

    // Sync directly to Vercel Postgres Cloud Database
    cloudApiService.syncAttendance(newRecord, settings?.googleDriveFolderUrl);

    triggerSuccessAnimation();
    showToast(`Presensi ${isShift ? shiftLabel : ''} Pulang Berhasil! Durasi: ${duration.formatted}`, 'success');
    return { success: true, record: newRecord };
  };

  /**
   * Submit Leave / Sick / Permission / Official Travel
   */
  const submitLeave = async ({ type, reason, evidenceDataUrl, startDate, endDate }) => {
    if (!currentUser) return { success: false, message: 'Harap login terlebih dahulu.' };

    const now = new Date();
    const dateStr = formatDateDMY(now);
    const timeStr = formatTimeHMS(now);

    const finalEvidenceUrl = await processEvidencePhoto(evidenceDataUrl, `${currentUser.name}_${type}`);

    const newRecord = {
      id: `ATT-LEAVE-${Date.now()}`,
      timestamp: `${dateStr} ${timeStr}`,
      email: currentUser.email,
      userName: currentUser.name,
      nip: currentUser.nip || '',
      skpd: currentUser.skpd || '',
      type: type, // 'Izin', 'Sakit', 'Cuti', 'Dinas Luar'
      category: 'HARIAN',
      evidenceUrl: finalEvidenceUrl,
      evidenceSnapshot: evidenceDataUrl || null,
      compositeKey: generateCompositeKey(currentUser.name, now, type),
      date: dateStr,
      time: timeStr,
      status: type,
      reason: reason || '',
      startDate: startDate || dateStr,
      endDate: endDate || dateStr,
      location: `${currentUser.skpd} (${settings.officeLatitude || -7.780344}, ${settings.officeLongitude || 114.030344})`
    };

    const updated = storageService.addAttendance(newRecord);
    setRecords([newRecord, ...records.filter(r => r.id !== newRecord.id)]);

    cloudApiService.syncAttendance(newRecord, settings?.googleDriveFolderUrl);

    triggerSuccessAnimation();
    showToast(`Pengajuan ${type} Berhasil Terkirim & Tersimpan!`, 'success');
    return { success: true, record: newRecord };
  };

  /**
   * Download multi-tab Excel
   */
  const handleExportExcel = (year = 2026, monthIndex = 8, category = 'HARIAN') => {
    try {
      exportAttendanceExcel(users, records, year, monthIndex, category);
      showToast(`File Excel Rekap Absensi (${category === 'SHIFT' ? 'Shift' : 'Harian'}) berhasil diunduh!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file Excel: ' + err.message, 'error');
    }
  };

  const updateSettings = (newSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Pengaturan sistem berhasil disimpan!', 'success');
  };

  /**
   * Delete attendance records (single or bulk)
   */
  const deleteAttendanceRecords = async (recordIds = []) => {
    const list = Array.isArray(recordIds) ? recordIds : [recordIds];
    if (list.length === 0) return { success: false };

    // 1. Update localStorage and React state
    const updated = storageService.deleteAttendanceRecords(list);
    setRecords(updated);

    // 2. Sync deletion to cloud database
    try {
      await cloudApiService.deleteAttendance(list);
    } catch (err) {
      console.warn('Sync delete attendance error:', err);
    }

    showToast(`${list.length} data presensi berhasil dihapus!`, 'success');
    return { success: true, count: list.length };
  };

  return (
    <AttendanceContext.Provider
      value={{
        records,
        todayCheckIn,
        todayCheckOut,
        todayLeave,
        settings,
        toast,
        showToast,
        closeToast,
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
        triggerSuccessAnimation,
        doCheckIn,
        doCheckOut,
        submitLeave,
        deleteAttendanceRecords,
        handleExportExcel,
        updateSettings,
        refreshAttendanceFromCloud
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within an AttendanceProvider');
  return context;
}
