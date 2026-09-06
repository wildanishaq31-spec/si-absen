import React, { useState } from 'react';
import { 
  Award, ShieldCheck, Clock, Calendar, CheckCircle2, 
  AlertTriangle, X, TrendingUp, UserCheck, CalendarDays,
  FileText, ArrowRight, ChevronRight, Activity, Zap,
  Check, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { buildWeeklyRecap, buildMonthlyRecap } from '../../services/attendanceCore';
import { WEEKLY_TARGET_HOURS } from '../../utils/constants';

export function MonitoringKedisiplinanModal({ isOpen, onClose }) {
  const { currentUser, users } = useAuth();
  const { records } = useAttendance();
  const [activeTab, setActiveTab] = useState('SUMMARY'); // 'SUMMARY' | 'WEEKLY' | 'LOGS'

  if (!isOpen || !currentUser) return null;

  // Build weekly recap & monthly statistics
  const weeklyRecap = buildWeeklyRecap(users, records);
  const myWeeklySummaries = weeklyRecap.map(w => {
    const summary = w.users.find(u => u.user.email === currentUser.email) || {};
    return {
      weekKey: w.key,
      weekLabel: w.label,
      weekDates: w.weekDates,
      totalHours: summary.totalHours || 0,
      totalHoursHuman: summary.totalHoursHuman || '0 Jam 0 Menit',
      isTargetMet: summary.isTargetMet || false,
      targetDifference: summary.targetDifference || 0,
      presentDays: summary.presentDays || 0,
      lateDays: summary.lateDays || 0,
      earlyDays: summary.earlyDays || 0,
      leaveDays: summary.leaveDays || 0,
      sickDays: summary.sickDays || 0,
      cutiDays: summary.cutiDays || 0,
      details: summary.dailyDetails || []
    };
  });

  const monthlyRecap = buildMonthlyRecap(users, weeklyRecap);
  const myMonthly = monthlyRecap.find(m => m.user.email === currentUser.email) || {
    grandTotalHours: 0,
    grandTotalHoursHuman: '0 Jam 0 Menit',
    grandPresentDays: 0,
    grandLateDays: 0,
    grandEarlyDays: 0,
    grandLeaveDays: 0,
    grandSickDays: 0,
    grandCutiDays: 0
  };

  // Current week (e.g. Week 1)
  const currentWeek = myWeeklySummaries[0] || {};
  const currentHours = currentWeek.totalHours || 0;
  const weeklyProgress = Math.min(100, Math.round((currentHours / WEEKLY_TARGET_HOURS) * 100));

  // Discipline Score calculation (100 - penalties)
  const disciplineScore = Math.max(80, Math.min(100, 100 - (myMonthly.grandLateDays * 2) - (myMonthly.grandEarlyDays * 2)));

  // Flat all daily logs for the LOGS tab
  const allDailyLogs = myWeeklySummaries.flatMap(w => w.details).filter(d => d.status !== 'Libur');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-sheet monitoring-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-indicator" />

        {/* Modal Header Card */}
        <div className="monitoring-header-card">
          <button 
            type="button"
            className="monitoring-close-btn" 
            onClick={onClose}
            title="Tutup Modal"
          >
            <X size={18} color="#FFFFFF" />
          </button>

          <div className="monitoring-badge-top">
            <ShieldCheck size={14} color="#00838F" />
            <span>ASN Berintegritas & Disiplin</span>
          </div>

          <h2 className="monitoring-title">Monitoring Kedisiplinan</h2>
          <p className="monitoring-user-name">{currentUser.name || 'AGUNG SISWOYO'}</p>
          <div className="monitoring-user-meta">
            <span>NIP: {currentUser.nip || '199407312025211093'}</span>
            <span>•</span>
            <span>{currentUser.skpd || 'UPTD Puskesmas Cermee'}</span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="monitoring-tabs-bar">
          <button
            type="button"
            className={`monitoring-tab-item ${activeTab === 'SUMMARY' ? 'active' : ''}`}
            onClick={() => setActiveTab('SUMMARY')}
          >
            <Activity size={16} />
            <span>Ringkasan</span>
          </button>
          <button
            type="button"
            className={`monitoring-tab-item ${activeTab === 'WEEKLY' ? 'active' : ''}`}
            onClick={() => setActiveTab('WEEKLY')}
          >
            <Zap size={16} />
            <span>Target 41 Jam</span>
          </button>
          <button
            type="button"
            className={`monitoring-tab-item ${activeTab === 'LOGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOGS')}
          >
            <CalendarDays size={16} />
            <span>Log Harian</span>
          </button>
        </div>

        {/* TAB 1: RINGKASAN KEDISIPLINAN */}
        {activeTab === 'SUMMARY' && (
          <div className="monitoring-tab-content">
            {/* 1. Score & Target Summary Banner */}
            <div className="discipline-hero-card">
              <div className="discipline-score-box">
                <div className="score-circle">
                  <span className="score-num">{disciplineScore}%</span>
                  <span className="score-label">Indeks</span>
                </div>
                <div className="score-info">
                  <div className="score-tag-badge">
                    <Sparkles size={12} />
                    <span>Tingkat Kepatuhan: Sangat Baik</span>
                  </div>
                  <h4 className="score-heading">Presensi Sesuai Ketentuan</h4>
                  <p className="score-desc">Kepatuhan jam kerja, apel pagi, dan kehadiran tepat waktu.</p>
                </div>
              </div>

              {/* Progress Bar Target 41 Jam Minggu Ini */}
              <div className="weekly-target-progress-box">
                <div className="progress-label-row">
                  <span className="progress-title">Capaian Jam Kerja Minggu Ini</span>
                  <span className="progress-val">{currentHours} / {WEEKLY_TARGET_HOURS} Jam</span>
                </div>
                <div className="progress-track-bg">
                  <div 
                    className="progress-fill-bar" 
                    style={{ width: `${weeklyProgress}%` }} 
                  />
                </div>
                <div className="progress-caption-row">
                  <span>{currentWeek.totalHoursHuman || '0 Jam 0 Menit'}</span>
                  <span>Target: 41 Jam / Pekan</span>
                </div>
              </div>
            </div>

            {/* 2. Grid Statistik Kehadiran Bulan Ini */}
            <div className="monitoring-section-title">
              <Calendar size={16} color="#00838F" />
              <span>Statistik Kehadiran Periode Berjalan</span>
            </div>

            <div className="monitoring-stats-grid">
              {/* Hadir Tepat Waktu */}
              <div className="stat-card green">
                <div className="stat-icon-wrap">
                  <UserCheck size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{myMonthly.grandPresentDays || 0} Hari</span>
                  <span className="stat-title">Hadir Tepat Waktu</span>
                </div>
              </div>

              {/* Terlambat (TL) */}
              <div className="stat-card orange">
                <div className="stat-icon-wrap">
                  <Clock size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{myMonthly.grandLateDays || 0}x</span>
                  <span className="stat-title">Terlambat (TL)</span>
                </div>
              </div>

              {/* Pulang Awal (PSW) */}
              <div className="stat-card amber">
                <div className="stat-icon-wrap">
                  <AlertTriangle size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{myMonthly.grandEarlyDays || 0}x</span>
                  <span className="stat-title">Pulang Cepat (PSW)</span>
                </div>
              </div>

              {/* Izin / Cuti */}
              <div className="stat-card blue">
                <div className="stat-icon-wrap">
                  <FileText size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{(myMonthly.grandLeaveDays || 0) + (myMonthly.grandCutiDays || 0)} Hari</span>
                  <span className="stat-title">Izin & Cuti</span>
                </div>
              </div>
            </div>

            {/* 3. Ketentuan Jam Kerja Standar SKPD */}
            <div className="schedule-rules-card">
              <h4 className="rules-card-title">Jadwal Jam Kerja Standar UPTD</h4>
              <div className="rules-list">
                <div className="rule-item">
                  <span className="rule-day">Senin – Kamis</span>
                  <span className="rule-time">07:30 – 15:00 WIB (7.5 Jam)</span>
                </div>
                <div className="rule-item">
                  <span className="rule-day">Jumat</span>
                  <span className="rule-time">07:00 – 11:30 WIB (4.5 Jam)</span>
                </div>
                <div className="rule-item">
                  <span className="rule-day">Sabtu</span>
                  <span className="rule-time">07:00 – 13:00 WIB (6.0 Jam)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REKAP TARGET 41 JAM (M1 - M5) */}
        {activeTab === 'WEEKLY' && (
          <div className="monitoring-tab-content">
            <div className="weekly-intro-note">
              <Award size={18} color="#00838F" />
              <p>Target jam kerja wajib ASN per minggu adalah <strong>41 Jam</strong> sesuai Peraturan Disiplin Pegawai.</p>
            </div>

            <div className="weekly-cards-stack">
              {myWeeklySummaries.map((week, idx) => {
                const diff = week.targetDifference;
                const isMet = week.isTargetMet;
                const progressPct = Math.min(100, Math.round((week.totalHours / WEEKLY_TARGET_HOURS) * 100));

                return (
                  <div key={week.weekKey} className="weekly-summary-item-card">
                    <div className="weekly-item-header">
                      <div>
                        <span className="week-name-label">{week.weekLabel}</span>
                        <h4 className="week-hours-headline">{week.totalHoursHuman}</h4>
                      </div>
                      <span className={`target-status-badge ${isMet ? 'met' : 'unmet'}`}>
                        {isMet ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>{isMet ? `Tercapai (+${diff} Jam)` : `Kurang (${diff} Jam)`}</span>
                      </span>
                    </div>

                    <div className="weekly-progress-mini-track">
                      <div 
                        className={`weekly-progress-mini-fill ${isMet ? 'met' : 'unmet'}`} 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Daily Breakdown Chips */}
                    <div className="weekly-daily-chips-row">
                      {week.details.map((d, dIdx) => (
                        <div 
                          key={dIdx} 
                          className={`daily-chip-pill ${d.status === 'Hadir' ? 'present' : d.status === 'Libur' ? 'holiday' : 'absent'}`}
                          title={`${d.dayName} (${d.date}): ${d.status} - ${d.durationFormatted}`}
                        >
                          <span className="chip-day-name">{d.dayName.substring(0, 3)}</span>
                          <span className="chip-status-text">
                            {d.status === 'Hadir' ? d.durationFormatted.substring(0, 5) : d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LOG DETAIL HARIAN */}
        {activeTab === 'LOGS' && (
          <div className="monitoring-tab-content">
            <div className="monitoring-logs-list">
              {allDailyLogs.length === 0 ? (
                <div className="empty-logs-placeholder">
                  <Clock size={32} color="#94A3B8" />
                  <p>Belum ada rekaman log presensi pada periode ini.</p>
                </div>
              ) : (
                allDailyLogs.map((log, idx) => (
                  <div key={idx} className="monitoring-log-row-card">
                    <div className="log-row-date-badge">
                      <span className="log-row-day">{log.dayName}</span>
                      <span className="log-row-date-num">{log.date}</span>
                    </div>

                    <div className="log-row-times-group">
                      <div className="log-time-col">
                        <span className="log-time-label">Masuk</span>
                        <span className="log-time-val">{log.checkIn}</span>
                        {log.lateText !== '-' && (
                          <span className={`log-diff-pill ${log.lateText.startsWith('-') ? 'early' : 'late'}`}>
                            {log.lateText}
                          </span>
                        )}
                      </div>

                      <div className="log-row-divider" />

                      <div className="log-time-col">
                        <span className="log-time-label">Pulang</span>
                        <span className="log-time-val">{log.checkOut}</span>
                        {log.earlyText !== '-' && (
                          <span className={`log-diff-pill ${log.earlyText.startsWith('+') ? 'early' : 'late'}`}>
                            {log.earlyText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="log-row-status-col">
                      <span className={`log-status-pill ${log.status === 'Hadir' ? 'green' : 'gray'}`}>
                        {log.status}
                      </span>
                      <span className="log-duration-sub">{log.durationFormatted}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
