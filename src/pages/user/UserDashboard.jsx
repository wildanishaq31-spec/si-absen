import React, { useState } from 'react';
import { Calendar, RefreshCw, Search, LogIn, LogOut, CalendarDays, User, ExternalLink, ShieldCheck } from 'lucide-react';
import { SIPPHeader } from '../../components/layout/SIPPHeader';
import { RunningBanner } from '../../components/layout/RunningBanner';
import { BottomNav } from '../../components/layout/BottomNav';
import { SidebarDrawer } from '../../components/layout/SidebarDrawer';
import { LocationRadarMap } from '../../components/map/LocationRadarMap';
import { PresensiMenuModal } from './PresensiMenuModal';
import { FaceCameraModal } from '../../components/camera/FaceCameraModal';
import { LeaveRequestModal } from './LeaveRequestModal';
import { UserHistoryPage } from './UserHistoryPage';
import { MonitoringKedisiplinanModal } from './MonitoringKedisiplinanModal';
import { UpdatePhotoModal } from '../../components/user/UpdatePhotoModal';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { formatIndonesianDate } from '../../utils/formatters';

export function UserDashboard({ onSwitchToAdmin, onLogout }) {
  const { currentUser } = useAuth();
  const { todayCheckIn, todayCheckOut, doCheckIn, doCheckOut } = useAttendance();

  // Screen View State ('home' or 'history')
  const [activeTab, setActiveTab] = useState('home');

  // Modals & Drawer state
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);
  const [showUpdatePhotoModal, setShowUpdatePhotoModal] = useState(false);
  const [showPresensiMenu, setShowPresensiMenu] = useState(false);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('MASUK'); // 'MASUK' or 'PULANG'
  const [attendanceCategory, setAttendanceCategory] = useState('HARIAN'); // 'HARIAN' or 'SHIFT'
  const [activeShiftType, setActiveShiftType] = useState(null); // 'PAGI' | 'SORE' | 'MALAM'
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveInitialType, setLeaveInitialType] = useState('Izin');

  const todayFormatted = formatIndonesianDate(new Date());

  const handleOpenMasukCamera = (type = 'Masuk', category = 'HARIAN', shiftType = null) => {
    setCameraMode('MASUK');
    setAttendanceCategory(category);
    setActiveShiftType(shiftType);
    setShowFaceCamera(true);
  };

  const handleOpenPulangCamera = (type = 'Pulang', category = 'HARIAN', shiftType = null) => {
    setCameraMode('PULANG');
    setAttendanceCategory(category);
    setActiveShiftType(shiftType);
    setShowFaceCamera(true);
  };

  const { coords, distance, isInRadius } = useGeolocation();

  const handleCameraCaptureComplete = async (capturedSnapshot) => {
    const locInfo = `UPTD Puskesmas Cermee (${coords?.latitude?.toFixed(5) || '-7.78034'}, ${coords?.longitude?.toFixed(5) || '114.03034'})`;
    if (cameraMode === 'MASUK') {
      await doCheckIn({ 
        evidenceDataUrl: capturedSnapshot,
        locationInfo: locInfo,
        distanceMeters: distance,
        isInRadius: isInRadius,
        category: attendanceCategory,
        shiftType: activeShiftType
      });
    } else {
      await doCheckOut({ 
        evidenceDataUrl: capturedSnapshot,
        locationInfo: locInfo,
        distanceMeters: distance,
        isInRadius: isInRadius,
        category: attendanceCategory,
        shiftType: activeShiftType
      });
    }
  };

  const handleOpenLeaveModal = (type) => {
    setLeaveInitialType(type);
    setShowLeaveModal(true);
  };

  const handleBottomTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="app-container">
      {/* Sidebar Drawer Menu (Matching Screenshot 3) */}
      <SidebarDrawer
        isOpen={showSidebarDrawer}
        onClose={() => setShowSidebarDrawer(false)}
        onLogout={onLogout}
        onOpenMonitoring={() => setShowMonitoringModal(true)}
        onOpenUpdatePhoto={() => setShowUpdatePhotoModal(true)}
      />

      {/* Horizontal Sliding Page Transition (Beranda <-> Riwayat Presensi) */}
      <div className={`app-pages-slider tab-${activeTab}`}>
        {/* PANE 1: Beranda (Home Dashboard) */}
        <div className="app-page-pane pane-home">
          {/* SIPP Header */}
          <SIPPHeader 
            onOpenMenu={() => setShowSidebarDrawer(true)} 
            onSwitchToAdmin={onSwitchToAdmin} 
          />

          {/* Integrity Slogan Running Banner */}
          <RunningBanner />

          {/* Main Content Area */}
          <main className="mobile-content">
            {/* 1. Profile Card Matching SIPP Screenshot */}
            <div className="profile-card">
              <div 
                className="avatar-wrapper"
                onClick={() => setShowUpdatePhotoModal(true)}
                style={{ cursor: 'pointer', overflow: 'hidden' }}
                title="Klik untuk ubah foto profil"
              >
                {currentUser?.photo ? (
                  <img 
                    src={currentUser.photo} 
                    alt={currentUser.name} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="48" fill="#F1F5F9" stroke="#00ACC1" strokeWidth="3" />
                    <circle cx="50" cy="40" r="18" fill="#94A3B8" />
                    <path d="M 22 84 A 30 28 0 0 1 78 84 Z" fill="#94A3B8" />
                  </svg>
                )}
                <span className="online-dot" />
              </div>

              <div className="profile-info">
                <h2 className="profile-name">{currentUser?.name || 'Pegawai'}</h2>
                <span className="profile-nip">{currentUser?.nip || '-'}</span>
                
                <div className="skpd-badge">
                  <div className="skpd-icon-box">
                    <CalendarDays size={18} />
                  </div>
                  <div className="skpd-text-group">
                    <span className="skpd-label">SKPD</span>
                    <span className="skpd-name">{currentUser?.skpd || 'UPTD Puskesmas Cermee'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Presensi Hari Ini Card Matching Screenshot */}
            <section className="presence-card">
              <div className="presence-header">
                <span className="presence-title">Presensi Hari Ini</span>
                <div className="presence-date-group">
                  <span>{todayFormatted}</span>
                  <RefreshCw size={14} className="header-action-icon-small" onClick={() => window.location.reload()} />
                  <Search size={14} className="header-action-icon-small" onClick={() => setActiveTab('history')} />
                </div>
              </div>

              <div className="presence-body">
                <div className="presence-columns">
                  {/* Kolom Masuk */}
                  <div className="presence-item">
                    <div className="presence-icon-box masuk">
                      <LogIn size={22} strokeWidth={2.5} />
                    </div>
                    <div className="presence-details">
                      <span className="presence-type-label">Masuk</span>
                      <span className="presence-time" style={{ color: todayCheckIn ? '#0F172A' : '#94A3B8' }}>
                        {todayCheckIn ? todayCheckIn.time : '-- : --'}
                      </span>
                      <span className="presence-tag">
                        {todayCheckIn ? (todayCheckIn.isLate ? todayCheckIn.status : (todayCheckIn.type || 'MASUK')) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="presence-divider" />

                  {/* Kolom Pulang */}
                  <div className="presence-item">
                    <div className="presence-icon-box pulang">
                      <LogOut size={22} strokeWidth={2.5} />
                    </div>
                    <div className="presence-details">
                      <span className="presence-type-label">Pulang</span>
                      <span className="presence-time" style={{ color: todayCheckOut ? '#0F172A' : '#94A3B8' }}>
                        {todayCheckOut ? todayCheckOut.time : '-- : --'}
                      </span>
                      <span className="presence-tag">
                        {todayCheckOut ? todayCheckOut.status : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Selengkapnya -> Buka Riwayat Presensi */}
                <button 
                  className="btn-selengkapnya"
                  onClick={() => setActiveTab('history')}
                >
                  SELENGKAPNYA
                </button>
              </div>
            </section>

            {/* 3. Lokasi Anda Map Card Matching Screenshot */}
            <section>
              <LocationRadarMap />
            </section>
          </main>
        </div>

        {/* PANE 2: Riwayat Presensi (History Dashboard) */}
        <div className="app-page-pane pane-history">
          <UserHistoryPage onNavigateBack={() => setActiveTab('home')} />
        </div>
      </div>

      {/* Bottom Floating Navigation */}
      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleBottomTabChange}
        onFingerprintClick={() => setShowPresensiMenu(true)}
      />

      {/* Modal Monitoring Kedisiplinan Pegawai */}
      <MonitoringKedisiplinanModal
        isOpen={showMonitoringModal}
        onClose={() => setShowMonitoringModal(false)}
      />

      {/* Modal Presensi Menu (Harian / D3 / Dinas Luar) */}
      <PresensiMenuModal 
        isOpen={showPresensiMenu}
        onClose={() => setShowPresensiMenu(false)}
        onSelectMasuk={handleOpenMasukCamera}
        onSelectPulang={handleOpenPulangCamera}
        onSelectLeave={handleOpenLeaveModal}
      />

      {/* Face Verification Camera Modal */}
      <FaceCameraModal 
        isOpen={showFaceCamera}
        onClose={() => setShowFaceCamera(false)}
        onCaptureComplete={handleCameraCaptureComplete}
        title={
          attendanceCategory === 'SHIFT'
            ? (cameraMode === 'MASUK' 
                ? `Verifikasi Wajah Shift Masuk (${activeShiftType === 'PAGI' ? 'Pagi' : activeShiftType === 'SORE' ? 'Sore' : 'Malam'})`
                : `Verifikasi Wajah Shift Pulang (${activeShiftType === 'PAGI' ? 'Pagi' : activeShiftType === 'SORE' ? 'Sore' : 'Malam'})`)
            : (cameraMode === 'MASUK' ? 'Verifikasi Wajah Masuk' : 'Verifikasi Wajah Pulang')
        }
      />

      {/* Leave / Sick / Permission Request Modal */}
      <LeaveRequestModal 
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        initialType={leaveInitialType}
      />

      {/* Update Photo Profile Modal */}
      <UpdatePhotoModal 
        isOpen={showUpdatePhotoModal}
        onClose={() => setShowUpdatePhotoModal(false)}
      />
    </div>
  );
}
