import React, { useState } from 'react';
import { 
  Bell, CheckSquare, Calendar, ChevronDown, 
  LogIn, LogOut, User, Clock, MapPin, Smartphone, 
  ExternalLink, ArrowRight, ArrowLeft, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDateDMY, formatDateYMD } from '../../utils/formatters';

export function UserHistoryPage({ onNavigateBack }) {
  const { currentUser } = useAuth();
  const { records } = useAttendance();

  // Selected date filter (default: current date)
  const [selectedDate, setSelectedDate] = useState(() => formatDateYMD(new Date()));

  // Format YYYY-MM-DD to DD/MM/YYYY
  const parts = selectedDate.split('-');
  const formattedFilterDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '';

  const userRecords = records.filter(
    r => (r.email === currentUser?.email || r.userName === currentUser?.name)
  );

  const filteredRecords = userRecords.filter(r => {
    if (!formattedFilterDate) return true;
    return r.date === formattedFilterDate;
  });

  // Helper function to resolve distinct styling and tags for different attendance types
  const getLogCardInfo = (item) => {
    const rawType = (item.type || '').trim();
    const typeUpper = rawType.toUpperCase();
    const isShift = item.category === 'SHIFT' || typeUpper.includes('SHIFT');
    
    const isPulang = typeUpper.includes('PULANG') || typeUpper === 'OUT';
    const isMasuk = typeUpper.includes('MASUK') || typeUpper === 'IN';
    const isLeave = ['IZIN', 'SAKIT', 'CUTI', 'DINAS LUAR'].includes(typeUpper);

    if (isShift && isPulang) {
      return {
        cardClass: 'card-shift-pulang',
        tagText: 'SHIFT PULANG',
        isEnter: false
      };
    }
    if (isShift && isMasuk) {
      return {
        cardClass: 'card-shift-masuk',
        tagText: 'SHIFT MASUK',
        isEnter: true
      };
    }
    if (isPulang) {
      return {
        cardClass: 'card-harian-pulang',
        tagText: 'HARIAN_PULANG',
        isEnter: false
      };
    }
    if (isMasuk) {
      return {
        cardClass: 'card-harian-masuk',
        tagText: 'HARIAN_MASUK',
        isEnter: true
      };
    }
    if (isLeave) {
      return {
        cardClass: 'card-izin',
        tagText: rawType.toUpperCase(),
        isEnter: true
      };
    }
    return {
      cardClass: 'card-harian-masuk',
      tagText: rawType.toUpperCase(),
      isEnter: true
    };
  };

  return (
    <div className="history-page-container">
      {/* Header Riwayat Presensi */}
      <header className="history-screen-header">
        <div className="history-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onNavigateBack && (
            <button 
              type="button" 
              className="history-back-btn" 
              onClick={onNavigateBack}
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </button>
          )}
          <div>
            <h1 className="history-screen-title">Riwayat Presensi</h1>
            <p className="history-screen-subtitle">Riwayat absensi dan apel pegawai</p>
          </div>
        </div>

        <div className="history-bell-btn">
          <Bell size={22} color="#FFFFFF" />
          <span className="bell-badge-count">0</span>
        </div>
      </header>

      <div className="history-screen-body">
        {/* Top Tab Pill: Absensi */}
        <div className="history-tab-pill-box">
          <div className="tab-pill-absensi active">
            <CheckSquare size={18} color="#00838F" />
            <span>Absensi</span>
          </div>
        </div>

        {/* Filter Card */}
        <div className="filter-presensi-card">
          <div className="filter-card-header">
            <div className="filter-icon-box">
              <Calendar size={22} color="#00838F" />
            </div>
            <div className="filter-title-group">
              <h3 className="filter-card-title">Filter Presensi</h3>
              <p className="filter-card-subtitle">Pilih tanggal riwayat presensi</p>
            </div>
          </div>

          {/* Date Picker Input */}
          <div className="filter-date-input-wrapper">
            <Calendar size={18} className="date-input-icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-date-input"
            />
            <ChevronDown size={18} className="date-input-chevron" />
          </div>
        </div>

        {/* Attendance Log Cards List with Dynamic Colors */}
        <div className="attendance-cards-list">
          {filteredRecords.length === 0 ? (
            <div className="empty-history-card">
              <Clock size={36} color="#94A3B8" />
              <p>Tidak ada data presensi pada tanggal {formattedFilterDate || selectedDate}.</p>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const info = getLogCardInfo(item);
              return (
                <div key={item.id} className={`sipp-log-card ${info.cardClass}`}>
                  {/* Selfie / Evidence Thumbnail */}
                  <div className="log-card-photo-box">
                    <img 
                      src={item.evidenceSnapshot || item.evidenceUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                      alt="Foto Verifikasi Wajah" 
                      className="log-photo-img"
                    />
                  </div>

                  {/* Card Content Details */}
                  <div className="log-card-details">
                    {/* Top Row: Type Tag & Direction Arrow */}
                    <div className="log-card-top-row">
                      <span className="log-type-tag">
                        {info.tagText}
                      </span>
                      <div className="log-arrow-icon" title={info.isEnter ? 'Presensi Masuk' : 'Presensi Pulang'}>
                        {info.isEnter ? <LogIn size={20} /> : <LogOut size={20} />}
                      </div>
                    </div>

                    {/* ID / NIP */}
                    <div className="log-detail-row">
                      <User size={15} />
                      <span>{currentUser?.nip?.substring(0, 5) || '24845'}</span>
                    </div>

                    {/* Time */}
                    <div className="log-detail-row">
                      <Clock size={15} />
                      <span style={{ fontWeight: 800 }}>{item.time}</span>
                    </div>

                    {/* Office / SKPD Location */}
                    <div className="log-detail-row">
                      <MapPin size={15} />
                      <span style={{ textTransform: 'uppercase' }}>
                        {currentUser?.skpd || 'UPTD PUSKESMAS CERMEE'}
                      </span>
                    </div>

                    {/* Status Terkirim Pill */}
                    <div className="log-terkirim-pill">
                      <Smartphone size={14} />
                      <span>TERKIRIM</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
