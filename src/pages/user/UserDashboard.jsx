import React, { useState, useEffect } from 'react';
import { 
  Calendar, RefreshCw, Search, LogIn, LogOut, CalendarDays, 
  User, ExternalLink, ShieldCheck, Clock, ChevronRight, 
  Sparkles, Activity, CheckCircle2, ArrowUpRight, Plane, 
  Briefcase, Repeat, FileText, Sun, Sunset, Moon, MapPin
} from 'lucide-react';
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
  const [attendanceType, setAttendanceType] = useState('Masuk');

  // Real-time ticking clock for iOS Widget Hero
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, ':');

  // Greeting helper
  const getGreeting = () => {
    if (hours >= 4 && hours < 11) return { text: 'Selamat Pagi', icon: '☀️' };
    if (hours >= 11 && hours < 15) return { text: 'Selamat Siang', icon: '🌤️' };
    if (hours >= 15 && hours < 18) return { text: 'Selamat Sore', icon: '🌇' };
    return { text: 'Selamat Malam', icon: '🌙' };
  };

  const greeting = getGreeting();
  const todayFormatted = formatIndonesianDate(currentTime);

  const handleOpenMasukCamera = (type = 'Masuk', category = 'HARIAN', shiftType = null) => {
    setCameraMode('MASUK');
    setAttendanceType(type);
    setAttendanceCategory(category);
    setActiveShiftType(shiftType);
    setShowFaceCamera(true);
  };

  const handleOpenPulangCamera = (type = 'Pulang', category = 'HARIAN', shiftType = null) => {
    setCameraMode('PULANG');
    setAttendanceType(type);
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
        type: attendanceType,
        category: attendanceCategory,
        shiftType: activeShiftType
      });
    } else {
      await doCheckOut({ 
        evidenceDataUrl: capturedSnapshot,
        locationInfo: locInfo,
        distanceMeters: distance,
        isInRadius: isInRadius,
        type: attendanceType,
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

  // Determine current working status
  const getWorkStatus = () => {
    if (todayCheckIn?.type === 'Dinas Luar') {
      return {
        label: 'Dinas Luar Aktif',
        badgeClass: 'status-badge-amber',
        desc: 'Tuntas hadir dinas luar',
        dotColor: '#F59E0B'
      };
    }
    if (todayCheckOut) {
      return {
        label: 'Selesai Bertugas',
        badgeClass: 'status-badge-blue',
        desc: `Pulang pukul ${todayCheckOut.time}`,
        dotColor: '#3B82F6'
      };
    }
    if (todayCheckIn) {
      return {
        label: 'Sedang Bertugas',
        badgeClass: 'status-badge-emerald',
        desc: `Masuk pukul ${todayCheckIn.time}`,
        dotColor: '#10B981'
      };
    }
    return {
      label: 'Belum Presensi',
      badgeClass: 'status-badge-slate',
      desc: 'Silakan lakukan presensi masuk',
      dotColor: '#94A3B8'
    };
  };

  const workStatus = getWorkStatus();

  return (
    <div className="app-container">
      {/* Sidebar Drawer Menu */}
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
          {/* iOS Header */}
          <SIPPHeader 
            onOpenMenu={() => setShowSidebarDrawer(true)} 
            onSwitchToAdmin={onSwitchToAdmin} 
          />

          {/* Running Banner */}
          <RunningBanner />

          {/* Main Content Area */}
          <main className="mobile-content ios-styled-content">
            {/* 1. iOS HERO CLOCK & PROFILE WIDGET */}
            <div className="ios-hero-widget-card">
              <div className="ios-hero-top-row">
                <div 
                  className="ios-hero-avatar-wrapper"
                  onClick={() => setShowUpdatePhotoModal(true)}
                  title="Klik untuk ubah foto profil"
                >
                  {currentUser?.photo ? (
                    <img 
                      src={currentUser.photo} 
                      alt={currentUser.name} 
                      className="ios-hero-avatar-img"
                    />
                  ) : (
                    <div className="ios-hero-avatar-placeholder">
                      <User size={28} color="#00838F" />
                    </div>
                  )}
                  <span className="ios-hero-online-dot" />
                </div>

                <div className="ios-hero-user-details">
                  <span className="ios-greeting-text">
                    {greeting.text} {greeting.icon}
                  </span>
                  <h2 className="ios-user-name">
                    {currentUser?.name || 'Pegawai'}
                  </h2>
                  <div className="ios-nip-skpd-row">
                    <span className="ios-user-nip">NIP: {currentUser?.nip || '-'}</span>
                    <span className="ios-skpd-tag">
                      <MapPin size={11} />
                      {currentUser?.skpd || 'UPTD Puskesmas Cermee'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Digital Clock Bar */}
              <div className="ios-clock-bar">
                <div className="ios-clock-time-display">
                  <div className="ios-digital-time">{timeString}</div>
                  <span className="ios-clock-zone">WIB</span>
                </div>
                <div className="ios-clock-date-group">
                  <div className="ios-date-badge">
                    <Calendar size={13} />
                    <span>{todayFormatted}</span>
                  </div>
                  <div className={`ios-status-badge ${workStatus.badgeClass}`}>
                    <span className="ios-status-pulse-dot" style={{ backgroundColor: workStatus.dotColor }} />
                    <span>{workStatus.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. iOS DUAL PRESENCE WIDGET (MASUK & PULANG) */}
            <div className="ios-presence-section">
              <div className="ios-section-header">
                <div className="ios-section-title-wrap">
                  <Clock size={16} className="text-teal-600" />
                  <h3 className="ios-section-title">Presensi Hari Ini</h3>
                </div>
                <button 
                  type="button" 
                  className="ios-history-link-btn"
                  onClick={() => setActiveTab('history')}
                  title="Buka Riwayat Presensi"
                >
                  <span>Riwayat</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="ios-presence-grid">
                {/* WIDGET MASUK */}
                <div 
                  className={`ios-presence-card ${todayCheckIn ? 'has-checked' : 'pending'}`}
                  onClick={() => {
                    if (!todayCheckIn) {
                      handleOpenMasukCamera('Masuk', 'HARIAN');
                    }
                  }}
                >
                  <div className="ios-presence-card-top">
                    <div className="ios-card-icon-circle in">
                      <LogIn size={20} />
                    </div>
                    <span className={`ios-card-tag ${todayCheckIn ? (todayCheckIn.isLate ? 'tag-late' : 'tag-ontime') : 'tag-empty'}`}>
                      {todayCheckIn ? (todayCheckIn.type === 'Dinas Luar' ? 'DINAS LUAR' : (todayCheckIn.isLate ? todayCheckIn.status : 'TEPAT WAKTU')) : 'BELUM MASUK'}
                    </span>
                  </div>

                  <div className="ios-presence-card-body">
                    <span className="ios-card-label">Jam Masuk</span>
                    <div className="ios-card-time-large">
                      {todayCheckIn ? todayCheckIn.time : '-- : --'}
                    </div>
                    <span className="ios-card-subtext">
                      {todayCheckIn 
                        ? (todayCheckIn.type === 'Dinas Luar' ? 'Lokasi Tugas Luar' : 'UPTD PKM Cermee') 
                        : 'Ketuk untuk presensi'}
                    </span>
                  </div>
                </div>

                {/* WIDGET PULANG */}
                <div 
                  className={`ios-presence-card ${todayCheckOut || todayCheckIn?.type === 'Dinas Luar' ? 'has-checked' : 'pending'}`}
                  onClick={() => {
                    if (todayCheckIn && !todayCheckOut && todayCheckIn.type !== 'Dinas Luar') {
                      handleOpenPulangCamera('Pulang', 'HARIAN');
                    } else if (!todayCheckIn) {
                      setShowPresensiMenu(true);
                    }
                  }}
                >
                  <div className="ios-presence-card-top">
                    <div className="ios-card-icon-circle out">
                      <LogOut size={20} />
                    </div>
                    <span className={`ios-card-tag ${todayCheckOut ? 'tag-checkout' : (todayCheckIn?.type === 'Dinas Luar' ? 'tag-ontime' : 'tag-empty')}`}>
                      {todayCheckIn?.type === 'Dinas Luar' ? 'BEBAS PULANG' : (todayCheckOut ? todayCheckOut.status : 'BELUM PULANG')}
                    </span>
                  </div>

                  <div className="ios-presence-card-body">
                    <span className="ios-card-label">Jam Pulang</span>
                    <div className="ios-card-time-large">
                      {todayCheckIn?.type === 'Dinas Luar' ? 'Tuntas 1x' : (todayCheckOut ? todayCheckOut.time : '-- : --')}
                    </div>
                    <span className="ios-card-subtext">
                      {todayCheckIn?.type === 'Dinas Luar' 
                        ? 'Otomatis selesai' 
                        : (todayCheckOut ? 'Presensi tuntas' : (todayCheckIn ? 'Ketuk untuk pulang' : 'Menunggu masuk'))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. iOS QUICK SHORTCUTS DOCK */}
            <div className="ios-quick-shortcuts-widget">
              <div className="ios-quick-shortcuts-header">
                <Sparkles size={15} className="text-amber-500" />
                <span>Pintasan Akses Cepat</span>
              </div>
              <div className="ios-quick-grid">
                {/* 1. Harian */}
                <button 
                  type="button" 
                  className="ios-quick-btn"
                  onClick={() => setShowPresensiMenu(true)}
                  title="Presensi Harian Pagi"
                >
                  <div className="ios-quick-icon-wrap bg-blue-50 text-blue-600">
                    <Sun size={20} />
                  </div>
                  <span className="ios-quick-text">Harian</span>
                </button>

                {/* 2. Shift */}
                <button 
                  type="button" 
                  className="ios-quick-btn"
                  onClick={() => setShowPresensiMenu(true)}
                  title="Presensi Jadwal Shift"
                >
                  <div className="ios-quick-icon-wrap bg-teal-50 text-teal-600">
                    <Repeat size={20} />
                  </div>
                  <span className="ios-quick-text">Shift</span>
                </button>

                {/* 3. D3 */}
                <button 
                  type="button" 
                  className="ios-quick-btn"
                  onClick={() => setShowPresensiMenu(true)}
                  title="Presensi Program D3"
                >
                  <div className="ios-quick-icon-wrap bg-emerald-50 text-emerald-600">
                    <Briefcase size={20} />
                  </div>
                  <span className="ios-quick-text">D3</span>
                </button>

                {/* 4. Dinas Luar */}
                <button 
                  type="button" 
                  className="ios-quick-btn"
                  onClick={() => handleOpenMasukCamera('Dinas Luar', 'DINAS_LUAR')}
                  title="Presensi Dinas Luar"
                >
                  <div className="ios-quick-icon-wrap bg-amber-50 text-amber-600">
                    <Plane size={20} />
                  </div>
                  <span className="ios-quick-text">Dinas Luar</span>
                </button>

                {/* 5. Izin / Cuti */}
                <button 
                  type="button" 
                  className="ios-quick-btn"
                  onClick={() => handleOpenLeaveModal('Izin')}
                  title="Formulir Izin / Sakit / Cuti"
                >
                  <div className="ios-quick-icon-wrap bg-purple-50 text-purple-600">
                    <FileText size={20} />
                  </div>
                  <span className="ios-quick-text">Izin/Cuti</span>
                </button>
              </div>
            </div>

            {/* 4. iOS MINIMAP WIDGET (LOKASI ANDA) */}
            <section className="ios-map-section">
              <LocationRadarMap />
            </section>
          </main>
        </div>

        {/* PANE 2: Riwayat Presensi (History Dashboard) */}
        <div className="app-page-pane pane-history">
          <UserHistoryPage onNavigateBack={() => setActiveTab('home')} />
        </div>
      </div>

      {/* Bottom Floating Navigation Dock */}
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
          attendanceCategory === 'DINAS_LUAR'
            ? 'Verifikasi Wajah Presensi Dinas Luar'
            : attendanceCategory === 'SHIFT'
            ? (cameraMode === 'MASUK' 
                ? `Verifikasi Wajah Shift Masuk (${activeShiftType === 'PAGI' ? 'Pagi' : activeShiftType === 'SORE' ? 'Sore' : 'Malam'})`
                : `Verifikasi Wajah Shift Pulang (${activeShiftType === 'PAGI' ? 'Pagi' : activeShiftType === 'SORE' ? 'Sore' : 'Malam'})`)
            : attendanceCategory === 'D3'
            ? (cameraMode === 'MASUK' ? 'Verifikasi Wajah D3 Masuk' : 'Verifikasi Wajah D3 Pulang')
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

