import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, Clock, Calendar, 
  Download, Search, Filter, RefreshCw, ExternalLink, 
  Settings, ShieldCheck, FileSpreadsheet, Eye, 
  Table, LayoutGrid, Check, X as CloseIcon, Layers, Sun, Moon, Sunset, LogOut, MapPin, Building2,
  Folder, FolderTree, HardDrive, Cloud, Database, Copy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { buildWeeklyRecap, buildMonthlyRecap } from '../../services/attendanceCore';
import { WEEKLY_TARGET_HOURS, SHIFT_SCHEDULE } from '../../utils/constants';
import { formatAutoUnitKerja } from '../../utils/formatters';
import { AdminLocationPickerMap } from '../../components/admin/AdminLocationPickerMap';
import { AdminEmployeeData } from '../../components/admin/AdminEmployeeData';
import { AdminProfileModal } from '../../components/admin/AdminProfileModal';
import { AdminForceSetupModal } from '../../components/admin/AdminForceSetupModal';
import { rustfsService } from '../../services/rustfsService';
import { cloudApiService } from '../../services/cloudApi';
import { storageService } from '../../services/storage';

const MONTH_OPTIONS = [
  { value: 0, label: 'Januari' },
  { value: 1, label: 'Februari' },
  { value: 2, label: 'Maret' },
  { value: 3, label: 'April' },
  { value: 4, label: 'Mei' },
  { value: 5, label: 'Juni' },
  { value: 6, label: 'Juli' },
  { value: 7, label: 'Agustus' },
  { value: 8, label: 'September' },
  { value: 9, label: 'Oktober' },
  { value: 10, label: 'November' },
  { value: 11, label: 'Desember' }
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];

const WEEK_OPTIONS = [
  { value: 0, label: 'Minggu 1 (Tgl 1 - 7)' },
  { value: 1, label: 'Minggu 2 (Tgl 8 - 14)' },
  { value: 2, label: 'Minggu 3 (Tgl 15 - 21)' },
  { value: 3, label: 'Minggu 4 (Tgl 22 - 28)' },
  { value: 4, label: 'Minggu 5 (Tgl 29 - Akhir Bulan)' }
];

export function AdminDashboard({ onSwitchToUser, onLogout }) {
  const { currentUser, users, refreshUsersFromCloud, resetLocalAndCloudData } = useAuth();
  const { records, handleExportExcel, settings, updateSettings, refreshAttendanceFromCloud, showSuccess, showError, showWarning, showConfirm, showAlert, showToast } = useAttendance();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Auto-sync on mount
  useEffect(() => {
    if (refreshUsersFromCloud) refreshUsersFromCloud();
    if (refreshAttendanceFromCloud) refreshAttendanceFromCloud();
  }, [refreshUsersFromCloud, refreshAttendanceFromCloud]);

  const handleSyncCloudData = async () => {
    setIsSyncingCloud(true);
    try {
      if (refreshUsersFromCloud) await refreshUsersFromCloud();
      if (refreshAttendanceFromCloud) await refreshAttendanceFromCloud();
      showSuccess('Data Pegawai & Presensi berhasil disinkronkan dari Google Sheets!');
    } catch (err) {
      showError('Gagal sinkronisasi dari Google Sheets: ' + err.message);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Active Category: 'HARIAN' (Dinas Pagi) vs 'SHIFT' (Dinas Muter 3-Shift)
  const [attendanceCategory, setAttendanceCategory] = useState('HARIAN');

  // Active Main Tab: 'DASHBOARD', 'MASUK', 'PULANG', 'REKAP_ABSENSI', 'REKAP_TOTAL_MINGGU', 'REKAP_BULAN', 'DATA_PEGAWAI', 'SETTINGS'
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Admin Profile Settings Modal State
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);

  // Selectors for Rekap Absensi
  const [selectedMonth, setSelectedMonth] = useState(8); // September
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedWeek, setSelectedWeek] = useState(0); // Minggu 1
  const [rekapViewMode, setRekapViewMode] = useState('TABLE_DETAIL'); // 'TABLE_DETAIL' (Gambar 3) or 'MATRIX' (Gambar 2)

  const [searchQuery, setSearchQuery] = useState('');
  
  // Dual Storage Mode: 'GOOGLE' (Google Sheets & Drive via Vercel Backend) vs 'SERVER' (Dedicated RustFS Storage Server)
  const [storageProviderInput, setStorageProviderInput] = useState(settings?.storageProvider || 'GOOGLE');
  const [googleSpreadsheetUrlInput, setGoogleSpreadsheetUrlInput] = useState(settings?.googleSpreadsheetUrl || '');
  const [googleDriveFolderUrlInput, setGoogleDriveFolderUrlInput] = useState(settings?.googleDriveFolderUrl || '');
  const [gasWebhookUrlInput, setGasWebhookUrlInput] = useState(settings?.gasWebhookUrl || '');
  const [testingGoogleCloud, setTestingGoogleCloud] = useState(false);

  const [rustfsEndpointInput, setRustfsEndpointInput] = useState(settings?.rustfsEndpoint || '');
  const [rustfsBucketInput, setRustfsBucketInput] = useState(settings?.rustfsBucket || 'bukti-presensi');
  const [rustfsApiKeyInput, setRustfsApiKeyInput] = useState(settings?.rustfsApiKey || '');
  const [rustfsEnabledInput, setRustfsEnabledInput] = useState(settings?.rustfsEnabled !== false);
  const [testingRustFS, setTestingRustFS] = useState(false);

  const [skpdNameInput, setSkpdNameInput] = useState(settings?.skpdName || settings?.officeName || 'UPTD Puskesmas Cermee');
  const [officeNameInput, setOfficeNameInput] = useState(settings?.officeName || settings?.skpdName || 'UPTD Puskesmas Cermee');
  const [officeLatInput, setOfficeLatInput] = useState(typeof settings?.officeLatitude === 'number' ? settings.officeLatitude : -7.780344);
  const [officeLngInput, setOfficeLngInput] = useState(typeof settings?.officeLongitude === 'number' ? settings.officeLongitude : 114.030344);
  const [officeRadiusInput, setOfficeRadiusInput] = useState(typeof settings?.officeRadiusMeters === 'number' ? settings.officeRadiusMeters : 100);
  const [strictLockInput, setStrictLockInput] = useState(settings?.strictLocationLock !== false);

  // Helper to distinguish shift records vs daily records
  const isShiftRecord = (r) => r.category === 'SHIFT' || Boolean(r.shiftType) || r.type?.includes('Shift') || r.type?.startsWith('SHIFT_');

  // Filter records based on selected category (Harian vs Shift)
  const categoryRecords = (records || []).filter(r => {
    if (attendanceCategory === 'SHIFT') {
      return isShiftRecord(r);
    }
    return !isShiftRecord(r);
  });

  // Calculate live statistics for the selected category
  const employeeUsers = (users || []).filter(u => u.role === 'pegawai');
  const totalEmployees = employeeUsers.length;
  
  const masukRecords = categoryRecords.filter(r => 
    r.type === 'Masuk' || r.type === 'HARIAN_MASUK' || r.type === 'SHIFT_MASUK' || r.type?.toLowerCase().includes('masuk')
  );
  const pulangRecords = categoryRecords.filter(r => 
    r.type === 'Pulang' || r.type === 'HARIAN_PULANG' || r.type === 'SHIFT_PULANG' || r.type?.toLowerCase().includes('pulang')
  );
  const onTimeCount = masukRecords.filter(r => !r.isLate).length;
  const lateCount = masukRecords.filter(r => r.isLate).length;
  const leaveCount = categoryRecords.filter(r => ['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].includes(r.type)).length;

  // Build weekly recap dynamically based on selected Year, Month & Attendance Category
  const weeklyRecap = buildWeeklyRecap(employeeUsers, records || [], selectedYear, selectedMonth, attendanceCategory) || [];
  const monthlyRecap = buildMonthlyRecap(employeeUsers, weeklyRecap, attendanceCategory) || [];
  const activeWeekData = (weeklyRecap && weeklyRecap[selectedWeek]) || weeklyRecap[0] || { users: [], weekDates: [] };

  // Filtered lists for Masuk / Pulang tabs
  const filteredMasuk = masukRecords.filter(
    r => r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.date?.includes(searchQuery)
  );

  const filteredPulang = pulangRecords.filter(
    r => r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.date?.includes(searchQuery)
  );

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({ ...settings, gasWebhookUrl: gasUrlInput });
  };

  // Helper titles based on active tab
  const getPageInfo = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return {
          title: 'Dashboard Ringkasan',
          subtitle: 'Monitoring kehadiran harian, statistik kepegawaian & pemenuhan target'
        };
      case 'MASUK':
        return {
          title: 'Presensi Masuk',
          subtitle: `Data presensi masuk pegawai (${attendanceCategory === 'SHIFT' ? 'Dinas Muter 3-Shift' : 'Dinas Harian'})`
        };
      case 'PULANG':
        return {
          title: 'Presensi Pulang',
          subtitle: `Data presensi pulang & durasi kerja (${attendanceCategory === 'SHIFT' ? 'Dinas Muter 3-Shift' : 'Dinas Harian'})`
        };
      case 'REKAP_ABSENSI':
        return {
          title: 'Rekap Absensi Mingguan (M1 - M5)',
          subtitle: `Rincian absensi, jam kerja, dan status target ${activeWeekData.label || 'Minggu 1'}`
        };
      case 'REKAP_TOTAL_MINGGU':
        return {
          title: 'Rekap Total Perminggu',
          subtitle: 'Akumulasi total jam kerja per minggu (M1 - M5) selama 1 bulan'
        };
      case 'REKAP_BULAN':
        return {
          title: 'Rekapitulasi Bulanan',
          subtitle: 'Laporan rekapitulasi kehadiran dan evaluasi pemenuhan target jam kerja bulanan'
        };
      case 'DATA_PEGAWAI':
        return {
          title: 'Manajemen Data Pegawai',
          subtitle: 'Kelola akun pegawai, pembuatan akun baru, serta pembaruan profil pegawai'
        };
      case 'SETTINGS':
        return {
          title: 'Pengaturan API, Kunci Lokasi & RustFS',
          subtitle: 'Konfigurasi Google Maps radius lock, RustFS Cloud Storage, dan Google Spreadsheet'
        };
      default:
        return {
          title: 'Portal Administrator',
          subtitle: 'SI-ABSEN Kepegawaian Puskesmas Cermee'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="admin-layout-container">
      {/* 1. SIDEBAR DI SEBELAH KIRI */}
      <aside className="admin-sidebar">
        {/* Sidebar Brand Header */}
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="admin-sidebar-title">SI-ABSEN</h1>
              <p className="admin-sidebar-subtitle">Portal Administrator</p>
            </div>
          </div>
          <div className="admin-sidebar-skpd-badge">
            🏢 {settings?.skpdName || settings?.officeName || 'UPTD Puskesmas Cermee'}
          </div>
        </div>

        {/* Category Switcher inside Sidebar */}
        <div className="admin-sidebar-category">
          <span className="admin-category-label">Kategori Presensi:</span>
          <div className="admin-category-toggle">
            <button
              type="button"
              className={`admin-category-btn ${attendanceCategory === 'HARIAN' ? 'active-harian' : ''}`}
              onClick={() => setAttendanceCategory('HARIAN')}
            >
              <span>🏢</span>
              <span>Dinas Harian (41 Jam)</span>
            </button>
            <button
              type="button"
              className={`admin-category-btn ${attendanceCategory === 'SHIFT' ? 'active-shift' : ''}`}
              onClick={() => setAttendanceCategory('SHIFT')}
            >
              <span>🔄</span>
              <span>Dinas Muter (3-Shift)</span>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="admin-sidebar-nav">
          {/* Group 1: Menu Utama */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Menu Utama</div>
            <div className="admin-nav-items">
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
                onClick={() => setActiveTab('DASHBOARD')}
              >
                <div className="admin-nav-item-left">
                  <LayoutGrid size={18} />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'MASUK' ? 'active' : ''}`}
                onClick={() => setActiveTab('MASUK')}
              >
                <div className="admin-nav-item-left">
                  <Sun size={18} />
                  <span>Presensi Masuk</span>
                </div>
                <span className="admin-nav-badge">{masukRecords.length}</span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'PULANG' ? 'active' : ''}`}
                onClick={() => setActiveTab('PULANG')}
              >
                <div className="admin-nav-item-left">
                  <Sunset size={18} />
                  <span>Presensi Pulang</span>
                </div>
                <span className="admin-nav-badge">{pulangRecords.length}</span>
              </button>
            </div>
          </div>

          {/* Group 2: Rekapitulasi Laporan */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Rekapitulasi Laporan</div>
            <div className="admin-nav-items">
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'REKAP_ABSENSI' ? 'active' : ''}`}
                onClick={() => setActiveTab('REKAP_ABSENSI')}
              >
                <div className="admin-nav-item-left">
                  <Table size={18} />
                  <span>Rekap Mingguan (M1-M5)</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'REKAP_TOTAL_MINGGU' ? 'active' : ''}`}
                onClick={() => setActiveTab('REKAP_TOTAL_MINGGU')}
              >
                <div className="admin-nav-item-left">
                  <Layers size={18} />
                  <span>Rekap Total Perminggu</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'REKAP_BULAN' ? 'active' : ''}`}
                onClick={() => setActiveTab('REKAP_BULAN')}
              >
                <div className="admin-nav-item-left">
                  <Calendar size={18} />
                  <span>Rekap Bulanan</span>
                </div>
              </button>
            </div>
          </div>

          {/* Group 3: Pengelolaan & Pengaturan */}
          <div className="admin-nav-group">
            <div className="admin-nav-group-title">Pengelolaan & Sistem</div>
            <div className="admin-nav-items">
              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'DATA_PEGAWAI' ? 'active' : ''}`}
                onClick={() => setActiveTab('DATA_PEGAWAI')}
              >
                <div className="admin-nav-item-left">
                  <Users size={18} />
                  <span>Data Pegawai</span>
                </div>
                <span className="admin-nav-badge">{totalEmployees}</span>
              </button>

              <button
                type="button"
                className={`admin-nav-item ${activeTab === 'SETTINGS' ? 'active' : ''}`}
                onClick={() => setActiveTab('SETTINGS')}
              >
                <div className="admin-nav-item-left">
                  <Settings size={18} />
                  <span>Pengaturan API & Lokasi</span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: Profile Widget & Logout */}
        <div className="admin-sidebar-footer">
          <div 
            className="admin-sidebar-profile-card"
            onClick={() => setShowAdminProfileModal(true)}
            title="Klik untuk membuka Pengaturan Profil Administrator"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="admin-sidebar-user-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <div className="admin-sidebar-user-name">{currentUser?.name || 'Administrator'}</div>
                <div className="admin-sidebar-user-role">
                  Super Admin <Settings size={11} />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-sidebar-actions">
            {onSwitchToUser && (
              <button 
                type="button" 
                className="btn-sidebar-switch"
                onClick={onSwitchToUser}
                title="Beralih ke Portal Pegawai"
              >
                <Users size={14} /> Mode Pegawai
              </button>
            )}
            <button 
              type="button" 
              className="btn-sidebar-logout"
              onClick={onLogout}
              title="Keluar dari Portal Administrator"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT (SEBELAH KANAN) */}
      <main className="admin-main-viewport">
        {/* Top Header Bar */}
        <header className="admin-viewport-header">
          <div className="admin-page-heading">
            <h2>{pageInfo.title}</h2>
            <p>{pageInfo.subtitle}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sync Cloud Data Button */}
            <button 
              type="button"
              onClick={handleSyncCloudData}
              disabled={isSyncingCloud}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1.5px solid #00838F',
                backgroundColor: '#E0F2F1',
                color: '#006064',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Sinkronkan data pegawai & presensi dari Cloud Database"
            >
              <RefreshCw size={15} className={isSyncingCloud ? 'animate-spin' : ''} />
              <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Data Cloud'}</span>
            </button>

            {/* Quick Export Excel Shortcut */}
            <button 
              className="btn-excel-export"
              onClick={() => handleExportExcel(attendanceCategory)}
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <FileSpreadsheet size={16} />
              <span>Unduh Excel Rekap</span>
            </button>

            {/* Profile trigger button in header */}
            <button
              type="button"
              onClick={() => setShowAdminProfileModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Settings size={15} color="#00838F" />
              <span>Profil Admin</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="admin-viewport-content">
          {/* TAB 0: DASHBOARD OVERVIEW (HALAMAN UTAMA) */}
          {activeTab === 'DASHBOARD' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Metric Stats Cards */}
              <section className="admin-stats-grid">
                <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('DATA_PEGAWAI')}>
                  <div>
                    <span className="metric-label">Total Pegawai Terdaftar</span>
                    <div className="metric-value">{totalEmployees}</div>
                  </div>
                  <div className="metric-icon-box" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
                    <Users size={24} />
                  </div>
                </div>

                <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('MASUK')}>
                  <div>
                    <span className="metric-label">Hadir Tepat Waktu ({attendanceCategory === 'SHIFT' ? 'Shift' : 'Harian'})</span>
                    <div className="metric-value" style={{ color: '#059669' }}>{onTimeCount}</div>
                  </div>
                  <div className="metric-icon-box" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                    <CheckCircle2 size={24} />
                  </div>
                </div>

                <div className="metric-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('MASUK')}>
                  <div>
                    <span className="metric-label">Terlambat ({attendanceCategory === 'SHIFT' ? 'Shift' : 'Harian'})</span>
                    <div className="metric-value" style={{ color: '#D97706' }}>{lateCount}</div>
                  </div>
                  <div className="metric-icon-box" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Clock size={24} />
                  </div>
                </div>

                <div className="metric-card">
                  <div>
                    <span className="metric-label">Izin / Cuti / Sakit</span>
                    <div className="metric-value" style={{ color: '#9333EA' }}>{leaveCount}</div>
                  </div>
                  <div className="metric-icon-box" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                    <Calendar size={24} />
                  </div>
                </div>
              </section>

              {/* Status Banner */}
              <div style={{
                background: attendanceCategory === 'SHIFT' 
                  ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' 
                  : 'linear-gradient(135deg, #00838F, #006064)',
                borderRadius: '16px',
                padding: '20px 24px',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: attendanceCategory === 'SHIFT'
                  ? '0 6px 20px rgba(124, 58, 237, 0.25)'
                  : '0 6px 20px rgba(0, 131, 143, 0.25)'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    {attendanceCategory === 'SHIFT' ? '🔄 Mode Presensi: Dinas Muter (3-Shift)' : '🏢 Mode Presensi: Dinas Harian (41 Jam / Minggu)'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.9 }}>
                    {attendanceCategory === 'SHIFT' 
                      ? 'Shift Pagi (07.00-14.00), Shift Sore (14.00-21.00), Shift Malam (21.00-07.00). Otomatis dihitung sesuai target per shift.'
                      : 'Target Jam Kerja Harian: 41 Jam per Minggu (Senin s/d Sabtu). Terintegrasi langsung dengan Rekap M1 - M5.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('REKAP_ABSENSI')}
                    style={{
                      background: '#FFFFFF',
                      color: attendanceCategory === 'SHIFT' ? '#6D28D9' : '#006064',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 18px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Buka Rekap Mingguan →
                  </button>
                </div>
              </div>

              {/* 2 Feed Cards: Presensi Masuk & Pulang Terakhir */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {/* Masuk Feed */}
                <div className="table-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#00838F', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sun size={18} /> Presensi Masuk Hari Ini
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('MASUK')} 
                      style={{ background: 'none', border: 'none', color: '#00838F', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Lihat Semua ({masukRecords.length}) →
                    </button>
                  </div>

                  {masukRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94A3B8', fontSize: '0.85rem' }}>
                      Belum ada pegawai yang absen masuk hari ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {masukRecords.slice(0, 5).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E293B' }}>{r.userName}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{r.date} • Jam: {r.time}</div>
                          </div>
                          <span className={`badge-status ${r.isLate ? 'late' : 'ontime'}`}>
                            {r.isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pulang Feed */}
                <div className="table-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sunset size={18} /> Presensi Pulang Hari Ini
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('PULANG')} 
                      style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Lihat Semua ({pulangRecords.length}) →
                    </button>
                  </div>

                  {pulangRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94A3B8', fontSize: '0.85rem' }}>
                      Belum ada pegawai yang absen pulang hari ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pulangRecords.slice(0, 5).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E293B' }}>{r.userName}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{r.date} • Jam: {r.time}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>
                              {r.workDuration || '-'}
                            </div>
                            <span className="badge-status ontime" style={{ fontSize: '0.7rem' }}>
                              Pulang Selesai
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div 
                  className="table-card" 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                  onClick={() => setActiveTab('REKAP_ABSENSI')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Table size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Rekap Mingguan</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Format Tabel & Matriks</div>
                  </div>
                </div>

                <div 
                  className="table-card" 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                  onClick={() => setActiveTab('REKAP_BULAN')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Rekap Bulanan</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Target Jam & Kehadiran</div>
                  </div>
                </div>

                <div 
                  className="table-card" 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                  onClick={() => setActiveTab('DATA_PEGAWAI')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Data Pegawai</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{totalEmployees} Pegawai Aktif</div>
                  </div>
                </div>

                <div 
                  className="table-card" 
                  style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}
                  onClick={() => setActiveTab('SETTINGS')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Pengaturan</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Lokasi, RustFS & Reset</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* TAB: REKAP ABSENSI (UNIFIED WITH 3 SELECTOR DROPDOWNS & VIEW MODES) */}
        {activeTab === 'REKAP_ABSENSI' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter & Selector Bar */}
            <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {/* 1. Selector Bulan (Januari - Desember) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Bulan:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, color: '#00838F', fontSize: '0.88rem' }}
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Selector Tahun */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Tahun:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, color: '#00838F', fontSize: '0.88rem' }}
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Selector Minggu (Minggu 1 s/d Minggu 5) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Minggu:</span>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: attendanceCategory === 'SHIFT' ? '1px solid #7C3AED' : '1px solid #00838F', 
                      backgroundColor: attendanceCategory === 'SHIFT' ? '#F3E8FF' : '#E0F7FA', 
                      fontWeight: 800, 
                      color: attendanceCategory === 'SHIFT' ? '#6D28D9' : '#006064', 
                      fontSize: '0.88rem' 
                    }}
                  >
                    {WEEK_OPTIONS.map(w => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Switcher & Export */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* View Mode Switcher (Gambar 3 vs Gambar 2) */}
                <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <button
                    onClick={() => setRekapViewMode('TABLE_DETAIL')}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: rekapViewMode === 'TABLE_DETAIL' ? '#00838F' : 'transparent',
                      color: rekapViewMode === 'TABLE_DETAIL' ? '#FFF' : '#64748B'
                    }}
                  >
                    Tabel Rinci (Gambar 3)
                  </button>
                  <button
                    onClick={() => setRekapViewMode('MATRIX')}
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: rekapViewMode === 'MATRIX' ? '#00838F' : 'transparent',
                      color: rekapViewMode === 'MATRIX' ? '#FFF' : '#64748B'
                    }}
                  >
                    Matriks Hari (Gambar 2)
                  </button>
                </div>

                {/* Download Excel Button */}
                <button 
                  className="btn-excel-export" 
                  onClick={() => handleExportExcel(selectedYear, selectedMonth, attendanceCategory)}
                  style={{
                    backgroundColor: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F'
                  }}
                >
                  <FileSpreadsheet size={18} />
                  <span>Download Excel {attendanceCategory === 'SHIFT' ? 'Shift' : 'Harian'} (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Target & Schedule Info Banner */}
            {attendanceCategory === 'HARIAN' ? (
              <div style={{ background: '#E0F7FA', border: '1px solid #B2EBF2', borderRadius: '12px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#006064', fontSize: '0.95rem' }}>
                    🏢 {activeWeekData.label} — {MONTH_OPTIONS[selectedMonth]?.label} {selectedYear} (Dinas Harian)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#00838F', marginLeft: '12px' }}>
                    Jadwal: Senin–Kamis (07.30–15.00) | Jumat (07.00–11.30) | Sabtu (07.00–13.00) | Minggu (Libur)
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: '#006064', fontSize: '0.9rem' }}>
                  Target Mingguan: 41 Jam / Minggu
                </div>
              </div>
            ) : (
              <div style={{ background: '#F3E8FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#6D28D9', fontSize: '0.95rem' }}>
                    🔄 {activeWeekData.label} — {MONTH_OPTIONS[selectedMonth]?.label} {selectedYear} (Dinas Muter 3-Shift)
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#7C3AED', marginLeft: '12px' }}>
                    Shift Pagi: 07.00–14.00 (7j) | Shift Sore: 14.00–21.00 (7j) | Shift Malam: 21.00–07.00 (10j)
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: '#6D28D9', fontSize: '0.9rem' }}>
                  Akumulasi Jam Kerja Sesuai Shift
                </div>
              </div>
            )}

            {/* VIEW MODE 1: FORMAT TABEL RINCI PER TANGGAL (SESUAI GAMBAR 3) */}
            {rekapViewMode === 'TABLE_DETAIL' ? (
              <div className="table-card">
                <div className="table-responsive">
                  <table className="admin-data-table" style={{ border: '1px solid #CBD5E1' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9' }}>
                        <th style={{ minWidth: '180px' }}>NAMA</th>
                        <th style={{ minWidth: '130px' }}>Hari / Tanggal</th>
                        {attendanceCategory === 'SHIFT' && <th>Shift</th>}
                        <th>Jadwal Masuk</th>
                        <th>Jadwal Pulang</th>
                        <th>Jam Masuk</th>
                        <th>Terlambat</th>
                        <th>Jam Pulang</th>
                        <th>Pulang Awal</th>
                        <th>Bukti Masuk</th>
                        <th>Bukti Pulang</th>
                        <th style={{ textAlign: 'center' }}>Cuti</th>
                        <th style={{ textAlign: 'center' }}>Izin</th>
                        <th style={{ textAlign: 'center' }}>Sakit</th>
                        <th>Jumlah Jam Kerja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeWeekData.users.map((u) => {
                        return u.dailyDetails.map((d, dIdx) => {
                          const isLate = d.lateText && d.lateText !== '-' && !d.lateText.startsWith('-');
                          const isEarly = d.earlyText && d.earlyText !== '-' && d.earlyText.startsWith('-');

                          return (
                            <tr key={`${u.user.id}-${d.date}`}>
                              {dIdx === 0 ? (
                                <td rowSpan={u.dailyDetails.length} style={{ verticalAlign: 'top', fontWeight: 800, background: '#FAFAFA', borderRight: '1px solid #E2E8F0' }}>
                                  <div>{u.user.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{u.user.nip}</div>
                                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F', fontWeight: 700 }}>
                                    Total: {u.totalHours} Jam
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: u.isTargetMet ? '#16A34A' : '#EA580C', fontWeight: 700 }}>
                                    {u.targetStatus}
                                  </div>
                                </td>
                              ) : null}

                              <td style={{ fontWeight: 600 }}>
                                {d.dayName} ({d.date.split('/')[0]})
                              </td>

                              {attendanceCategory === 'SHIFT' && (
                                <td>
                                  {d.shiftName ? (
                                    <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '6px', 
                                      fontSize: '0.75rem', 
                                      fontWeight: 700, 
                                      backgroundColor: d.shiftName.includes('Malam') ? '#1E1B4B' : d.shiftName.includes('Sore') ? '#FEF3C7' : '#E0F7FA',
                                      color: d.shiftName.includes('Malam') ? '#C7D2FE' : d.shiftName.includes('Sore') ? '#B45309' : '#00838F'
                                    }}>
                                      {d.shiftName}
                                    </span>
                                  ) : '-'}
                                </td>
                              )}

                              <td>{d.scheduleIn}</td>
                              <td>{d.scheduleOut}</td>

                              {/* Jam Masuk with red/orange highlight if late */}
                              <td style={{ fontWeight: 700, backgroundColor: isLate ? '#FEE2E2' : 'transparent', color: isLate ? '#DC2626' : '#1E293B' }}>
                                {d.checkIn}
                              </td>
                              
                              {/* Terlambat */}
                              <td style={{ color: isLate ? '#DC2626' : '#64748B', fontWeight: isLate ? 700 : 500 }}>
                                {d.lateText}
                              </td>

                              {/* Jam Pulang with red highlight if early leave */}
                              <td style={{ fontWeight: 700, backgroundColor: isEarly ? '#FEE2E2' : 'transparent', color: isEarly ? '#DC2626' : '#1E293B' }}>
                                {d.checkOut}
                              </td>

                              {/* Pulang Awal */}
                              <td style={{ color: isEarly ? '#DC2626' : '#64748B', fontWeight: isEarly ? 700 : 500 }}>
                                {d.earlyText}
                              </td>

                              {/* Bukti Masuk Drive Link */}
                              <td>
                                {d.checkInEvidence ? (
                                  <a href={d.checkInEvidence} target="_blank" rel="noreferrer" className="drive-link-btn" style={{ fontSize: '0.75rem' }}>
                                    <span>?id=Drive</span>
                                    <ExternalLink size={11} />
                                  </a>
                                ) : '-'}
                              </td>

                              {/* Bukti Pulang Drive Link */}
                              <td>
                                {d.checkOutEvidence ? (
                                  <a href={d.checkOutEvidence} target="_blank" rel="noreferrer" className="drive-link-btn" style={{ fontSize: '0.75rem' }}>
                                    <span>?id=Drive</span>
                                    <ExternalLink size={11} />
                                  </a>
                                ) : '-'}
                              </td>

                              {/* Cuti */}
                              <td style={{ textAlign: 'center', fontWeight: 700, color: '#9333EA' }}>
                                {d.isCuti ? '✓' : ''}
                              </td>

                              {/* Izin */}
                              <td style={{ textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>
                                {d.isIzin ? '✓' : ''}
                              </td>

                              {/* Sakit */}
                              <td style={{ textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>
                                {d.isSakit ? '✓' : ''}
                              </td>

                              {/* Jumlah Jam Kerja */}
                              <td style={{ fontWeight: 800, color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F' }}>
                                {d.durationFormatted}
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: MATRIKS HARI SENIN - MINGGU REALTIME KALENDER (SESUAI GAMBAR 2) */
              <div className="table-card">
                <div className="table-responsive">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Nama Pegawai</th>
                        <th>NIP</th>
                        <th>Hadir</th>
                        <th>Terlambat</th>
                        <th>Total Jam Kerja</th>
                        <th>Status Target</th>
                        {activeWeekData.weekDates.map(wDate => (
                          <th key={wDate.dateStr}>
                            {wDate.dayName} ({String(wDate.day).padStart(2, '0')})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeWeekData.users.map((u) => (
                        <tr key={u.user.id}>
                          <td style={{ fontWeight: 700 }}>{u.user.name}</td>
                          <td style={{ fontSize: '0.78rem', color: '#64748B' }}>{u.user.nip}</td>
                          <td>{u.presentDays} Hari</td>
                          <td style={{ color: u.lateDays > 0 ? '#D97706' : '#64748B' }}>{u.lateDays} Hari</td>
                          <td style={{ fontWeight: 800, color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F', fontSize: '0.95rem' }}>
                            {u.totalHours} Jam
                          </td>
                          <td>
                            <span className={`badge-status ${u.isTargetMet ? 'target-met' : 'target-missed'}`}>
                              {u.targetStatus}
                            </span>
                          </td>
                          {u.dailyDetails.map((d, idx) => (
                            <td key={idx} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {d.checkIn !== '-' ? (
                                <div>
                                  {d.shiftName && (
                                    <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>
                                      {d.shiftName}
                                    </div>
                                  )}
                                  <div>In: <strong>{d.checkIn}</strong></div>
                                  <div>Out: {d.checkOut}</div>
                                  <div style={{ color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F', fontWeight: 600 }}>{d.durationFormatted}</div>
                                </div>
                              ) : (
                                <span style={{ color: '#94A3B8' }}>{d.status}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: ABSEN MASUK */}
        {activeTab === 'MASUK' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Email Address</th>
                    <th>Nama</th>
                    {attendanceCategory === 'SHIFT' && <th>Shift</th>}
                    <th>Kehadiran</th>
                    <th>Bukti Kehadiran/Surat/Izin</th>
                    <th>Nama-Tanggal-Keterangan</th>
                    <th>Tanggal</th>
                    <th>Jam</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMasuk.length === 0 ? (
                    <tr><td colSpan={attendanceCategory === 'SHIFT' ? 10 : 9} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>Tidak ada data absen masuk {attendanceCategory === 'SHIFT' ? 'shift' : 'harian'}.</td></tr>
                  ) : (
                    filteredMasuk.map((r) => (
                      <tr key={r.id}>
                        <td>{r.timestamp}</td>
                        <td>{r.email}</td>
                        <td style={{ fontWeight: 700 }}>{r.userName}</td>
                        {attendanceCategory === 'SHIFT' && (
                          <td>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              backgroundColor: r.shiftType === 'MALAM' ? '#1E1B4B' : r.shiftType === 'SORE' ? '#FEF3C7' : '#E0F7FA',
                              color: r.shiftType === 'MALAM' ? '#C7D2FE' : r.shiftType === 'SORE' ? '#B45309' : '#00838F'
                            }}>
                              {r.shiftName || r.shiftType || 'Shift'}
                            </span>
                          </td>
                        )}
                        <td>
                          <span className={`badge-status ${r.isLate ? 'late' : 'ontime'}`}>
                            {r.type}
                          </span>
                        </td>
                        <td>
                          {r.evidenceUrl ? (
                            <a href={r.evidenceUrl} target="_blank" rel="noreferrer" className="drive-link-btn">
                              <span>Drive Link</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ color: '#64748B', fontSize: '0.78rem' }}>{r.compositeKey}</td>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 700, color: '#00838F' }}>{r.time}</td>
                        <td>
                          <span className={`badge-status ${r.isLate ? 'late' : 'ontime'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ABSEN PULANG */}
        {activeTab === 'PULANG' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Email Address</th>
                    <th>Nama</th>
                    {attendanceCategory === 'SHIFT' && <th>Shift</th>}
                    <th>Bukti Pulang</th>
                    <th>Nama-Tanggal-Keterangan</th>
                    <th>Tanggal</th>
                    <th>Jam</th>
                    <th>Status</th>
                    <th>Jumlah Jam Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPulang.length === 0 ? (
                    <tr><td colSpan={attendanceCategory === 'SHIFT' ? 10 : 9} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>Tidak ada data absen pulang {attendanceCategory === 'SHIFT' ? 'shift' : 'harian'}.</td></tr>
                  ) : (
                    filteredPulang.map((r) => (
                      <tr key={r.id}>
                        <td>{r.timestamp}</td>
                        <td>{r.email}</td>
                        <td style={{ fontWeight: 700 }}>{r.userName}</td>
                        {attendanceCategory === 'SHIFT' && (
                          <td>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              backgroundColor: r.shiftType === 'MALAM' ? '#1E1B4B' : r.shiftType === 'SORE' ? '#FEF3C7' : '#E0F7FA',
                              color: r.shiftType === 'MALAM' ? '#C7D2FE' : r.shiftType === 'SORE' ? '#B45309' : '#00838F'
                            }}>
                              {r.shiftName || r.shiftType || 'Shift'}
                            </span>
                          </td>
                        )}
                        <td>
                          {r.evidenceUrl ? (
                            <a href={r.evidenceUrl} target="_blank" rel="noreferrer" className="drive-link-btn">
                              <span>Drive Link</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ color: '#64748B', fontSize: '0.78rem' }}>{r.compositeKey}</td>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 700, color: '#DC2626' }}>{r.time}</td>
                        <td>
                          <span className={`badge-status ${r.isEarly ? 'early' : 'ontime'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F' }}>
                          {r.workDuration || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: REKAP TOTAL PERMINGGU */}
        {activeTab === 'REKAP_TOTAL_MINGGU' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Nama Pegawai</th>
                    <th>NIP</th>
                    <th>M1</th>
                    <th>M2</th>
                    <th>M3</th>
                    <th>M4</th>
                    <th>M5</th>
                    <th>TOTAL JAM 1 BULAN</th>
                    <th>RATA-RATA / MINGGU</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeUsers.map((user) => {
                    let totalMonthHours = 0;
                    return (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 700 }}>{user.name}</td>
                        <td style={{ fontSize: '0.78rem', color: '#64748B' }}>{user.nip}</td>
                        {weeklyRecap.map((w, idx) => {
                          const uSummary = w.users.find(u => u.user.email === user.email) || {};
                          const hrs = uSummary.totalHours || 0;
                          totalMonthHours += hrs;
                          return (
                            <td key={idx} style={{ fontWeight: 600 }}>
                              <span style={{ color: uSummary.isTargetMet ? '#059669' : '#D97706' }}>
                                {hrs} Jam
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 800, color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F', fontSize: '1rem' }}>
                          {parseFloat(totalMonthHours.toFixed(2))} Jam
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {parseFloat((totalMonthHours / 5).toFixed(2))} Jam
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REKAP BULANAN */}
        {activeTab === 'REKAP_BULAN' && (
          <div className="table-card">
            <div className="table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Nama Pegawai</th>
                    <th>NIP</th>
                    <th>Total Jam Kerja</th>
                    <th>Status Target Bulanan</th>
                    <th>Hari Hadir</th>
                    <th>Terlambat</th>
                    <th>Pulang Cepat</th>
                    <th>Izin / Cuti</th>
                    <th>Sakit</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRecap.map((m) => (
                    <tr key={m.user.id}>
                      <td style={{ fontWeight: 700 }}>{m.user.name}</td>
                      <td style={{ fontSize: '0.78rem', color: '#64748B' }}>{m.user.nip}</td>
                      <td style={{ fontWeight: 800, color: attendanceCategory === 'SHIFT' ? '#7C3AED' : '#00838F', fontSize: '1rem' }}>
                        {m.grandTotalHours} Jam
                      </td>
                      <td>
                        <span className={`badge-status ${m.isMonthlyTargetMet ? 'target-met' : 'target-missed'}`}>
                          {m.isMonthlyTargetMet ? 'Target Terpenuhi' : 'Kurang Target'}
                        </span>
                      </td>
                      <td>{m.grandPresentDays} Hari</td>
                      <td style={{ color: m.grandLateDays > 0 ? '#D97706' : '#64748B' }}>{m.grandLateDays} Kali</td>
                      <td>{m.grandEarlyDays} Kali</td>
                      <td>{m.grandLeaveDays} Hari</td>
                      <td>{m.grandSickDays} Hari</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: DATA PEGAWAI */}
        {activeTab === 'DATA_PEGAWAI' && (
          <AdminEmployeeData />
        )}

        {/* TAB 7: SETTINGS GOOGLE MAPS GPS LOCK & GOOGLE APPS SCRIPT WEBHOOK */}
        {activeTab === 'SETTINGS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            
            {/* CARD 1: KUNCI LOKASI GOOGLE MAPS & GEOFENCING */}
            <div className="table-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#E0F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00838F' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00838F', margin: 0 }}>
                    Pengaturan SKPD & Kunci Lokasi Google Maps
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                    Kelola nama SKPD/Puskesmas instansi serta aturan kunci lokasi (geofencing) presensi pegawai.
                  </p>
                </div>
              </div>

              {/* 🏢 1. PENGATURAN NAMA SKPD / UNIT KERJA INSTANSI */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1.5px solid #E2E8F0',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#E0F2FE',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)'
                    }}>
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                        Nama SKPD / Unit Kerja Instansi
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                        Nama instansi yang tampil di badge sidebar kiri, header presensi, dan kop laporan
                      </p>
                    </div>
                  </div>

                  {/* Live Preview Badge matching sidebar badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(180deg, #00363A, #004D40)',
                    color: '#FFFFFF',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0, 77, 64, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <span>🏢</span>
                    <span>{skpdNameInput || 'UPTD Puskesmas Cermee'}</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Ubah Nama SKPD / Puskesmas:
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={skpdNameInput}
                      onChange={(e) => {
                        const formatted = formatAutoUnitKerja(e.target.value);
                        setSkpdNameInput(formatted);
                        setOfficeNameInput(formatted);
                      }}
                      placeholder="Contoh: UPTD Puskesmas Cermee"
                      style={{
                        flex: '1',
                        minWidth: '260px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!skpdNameInput.trim()) {
                          showWarning('Nama SKPD tidak boleh kosong.');
                          return;
                        }
                        updateSettings({
                          ...settings,
                          skpdName: skpdNameInput.trim(),
                          officeName: skpdNameInput.trim(),
                          institutionName: skpdNameInput.trim()
                        });
                        showSuccess(`Nama SKPD berhasil diperbarui menjadi "${skpdNameInput.trim()}"!`);
                      }}
                      style={{
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      Simpan Nama SKPD
                    </button>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
                    * Format otomatis aktif: Akronim seperti UPTD / RSUD / PKM / DINKES otomatis kapital, kata daerah/nama otomatis huruf depan besar.
                  </span>
                </div>
              </div>

              {/* 🟢 2. TOGGLE ON/OFF FITUR KUNCI LOKASI PRESENSI */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '16px 20px',
                borderRadius: '14px',
                backgroundColor: strictLockInput ? '#ECFDF5' : '#F1F5F9',
                border: `1.5px solid ${strictLockInput ? '#A7F3D0' : '#CBD5E1'}`,
                marginBottom: '20px',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: strictLockInput ? '#10B981' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: strictLockInput ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                    transition: 'all 0.25s ease'
                  }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: strictLockInput ? '#065F46' : '#1E293B' }}>
                        Fitur Kunci Lokasi Presensi:
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '3px 12px',
                        borderRadius: '20px',
                        backgroundColor: strictLockInput ? '#D1FAE5' : '#E2E8F0',
                        color: strictLockInput ? '#047857' : '#475569'
                      }}>
                        {strictLockInput ? '🟢 AKTIF (WAJIB DI LOKASI KANTOR)' : '⚪ NONAKTIF (BEBAS DARI MANA SAJA)'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.83rem', color: strictLockInput ? '#047857' : '#64748B', lineHeight: 1.45 }}>
                      {strictLockInput 
                        ? `Pegawai WAJIB berada di dalam radius kantor (${officeRadiusInput}m). Jika di luar radius, presensi otomatis DIBLOKIR.`
                        : 'Pegawai BEBAS ABSEN DARI MANA SAJA tanpa harus berada di kantor (Cocok untuk WFH, Tugas Lapangan, atau Tanpa Radius).'}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '32px', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={strictLockInput}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setStrictLockInput(val);
                      updateSettings({
                        ...settings,
                        strictLocationLock: val
                      });
                      if (val) {
                        showSuccess('Fitur Kunci Lokasi DIAKTIFKAN. Pegawai wajib berada di dalam radius kantor.');
                      } else {
                        showWarning('Fitur Kunci Lokasi DINONAKTIFKAN. Pegawai sekarang bisa absen dari mana saja.');
                      }
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: strictLockInput ? '#10B981' : '#CBD5E1',
                    borderRadius: '34px',
                    transition: '0.3s',
                    boxShadow: strictLockInput ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '24px',
                      width: '24px',
                      left: strictLockInput ? '32px' : '4px',
                      bottom: '4px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: '0.3s',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 3. Interactive Map Search & Pin Lock Picker */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                      🗺️ Titik Koordinat Kantor di Peta Google Maps
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Geser pin atau klik di peta untuk menentukan koordinat kantor
                    </span>
                  </div>
                  <AdminLocationPickerMap
                    latitude={officeLatInput}
                    longitude={officeLngInput}
                    radiusMeters={officeRadiusInput}
                    locationName={officeNameInput}
                    onChange={({ latitude, longitude, name }) => {
                      if (typeof latitude === 'number') setOfficeLatInput(latitude);
                      if (typeof longitude === 'number') setOfficeLngInput(longitude);
                      if (name) {
                        setOfficeNameInput(name);
                      }
                    }}
                  />
                </div>

                {/* 4. Grid Coordinates & Radius Fields (Auto-synced with Map) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Nama Lokasi Kantor
                    </label>
                    <input
                      type="text"
                      value={officeNameInput}
                      onChange={(e) => setOfficeNameInput(e.target.value)}
                      placeholder="UPTD Puskesmas Cermee"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Latitude (Lintang)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={officeLatInput}
                      onChange={(e) => setOfficeLatInput(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF', fontWeight: 700, color: '#00838F' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Longitude (Bujur)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={officeLngInput}
                      onChange={(e) => setOfficeLngInput(parseFloat(e.target.value))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF', fontWeight: 700, color: '#00838F' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Radius Toleransi Absen
                    </label>
                    <select
                      value={officeRadiusInput}
                      onChange={(e) => setOfficeRadiusInput(parseInt(e.target.value, 10))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF', fontWeight: 700 }}
                    >
                      <option value={50}>50 Meter (Sangat Ketat)</option>
                      <option value={100}>100 Meter (Rekomendasi Standar)</option>
                      <option value={150}>150 Meter</option>
                      <option value={200}>200 Meter (Area Luas)</option>
                      <option value={300}>300 Meter</option>
                      <option value={500}>500 Meter (Satu Kawasan)</option>
                    </select>
                  </div>
                </div>

                {/* 5. GPS Grab Button & Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.84rem', color: '#475569' }}>
                    💡 <strong>Tips:</strong> Klik tombol di samping jika Anda sedang berada di kantor dan ingin mengisi koordinat GPS otomatis.
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setOfficeLatInput(pos.coords.latitude);
                          setOfficeLngInput(pos.coords.longitude);
                          showSuccess(`Lokasi GPS admin saat ini berhasil diambil!\nLat: ${pos.coords.latitude}\nLng: ${pos.coords.longitude}`, 'GPS BERHASIL');
                        }, () => showError('Tidak dapat membaca GPS perangkat. Pastikan izin lokasi aktif pada browser.', 'GPS GAGAL'));
                      }
                    }}
                    style={{
                      backgroundColor: '#E0F7FA',
                      color: '#00838F',
                      border: '1px solid #B2EBF2',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    📍 Ambil Titik GPS Saya Saat Ini
                  </button>
                </div>

                {/* Save Location Settings Button */}
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({
                      ...settings,
                      skpdName: skpdNameInput.trim() || officeNameInput,
                      officeName: skpdNameInput.trim() || officeNameInput,
                      institutionName: skpdNameInput.trim() || officeNameInput,
                      officeLatitude: officeLatInput,
                      officeLongitude: officeLngInput,
                      officeRadiusMeters: officeRadiusInput,
                      strictLocationLock: strictLockInput
                    });
                    showSuccess('Pengaturan SKPD & Kunci Lokasi Google Maps berhasil disimpan!');
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#00838F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 131, 143, 0.25)'
                  }}
                >
                  Simpan Seluruh Pengaturan Lokasi & SKPD
                </button>
              </div>
            </div>

            {/* CARD 2: KONFIGURASI CLOUD DATABASE (VERCEL POSTGRES) & PENYIMPANAN FOTO (GOOGLE DRIVE / RUSTFS) */}
            <div className="table-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: storageProviderInput === 'GOOGLE' ? '#ECFDF5' : '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: storageProviderInput === 'GOOGLE' ? '#059669' : '#7C3AED', transition: 'all 0.3s ease' }}>
                  {storageProviderInput === 'GOOGLE' ? <Database size={24} /> : <HardDrive size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: storageProviderInput === 'GOOGLE' ? '#059669' : '#7C3AED', margin: 0, transition: 'color 0.3s ease' }}>
                    2. Konfigurasi Cloud Database & Penyimpanan Foto Bukti Presensi
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                    Penyimpanan data akun & riwayat presensi: <strong>Vercel Postgres (Neon)</strong> dan penyimpanan foto bukti: <strong>Google Drive / RustFS</strong>.
                  </p>
                </div>
              </div>

              {/* DUAL STORAGE TOGGLE SELECTOR */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
                marginBottom: '22px'
              }}>
                {/* Opsi 1: Vercel Postgres & Google Drive */}
                <div
                  onClick={() => {
                    setStorageProviderInput('GOOGLE');
                    updateSettings({
                      ...settings,
                      storageProvider: 'GOOGLE'
                    });
                    showSuccess('Mode penyimpanan aktif: Vercel Postgres (Neon) & Google Drive!');
                  }}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '14px',
                    border: `2px solid ${storageProviderInput === 'GOOGLE' ? '#059669' : '#E2E8F0'}`,
                    backgroundColor: storageProviderInput === 'GOOGLE' ? '#ECFDF5' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: storageProviderInput === 'GOOGLE' ? '0 4px 14px rgba(5, 150, 105, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: storageProviderInput === 'GOOGLE' ? '#059669' : '#F1F5F9',
                    color: storageProviderInput === 'GOOGLE' ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Database size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: storageProviderInput === 'GOOGLE' ? '#065F46' : '#1E293B' }}>
                        🌐 Vercel Postgres & Google Drive
                      </span>
                      {storageProviderInput === 'GOOGLE' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#A7F3D0', color: '#065F46' }}>
                          AKTIF
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: storageProviderInput === 'GOOGLE' ? '#047857' : '#64748B', lineHeight: 1.35 }}>
                      Database cloud permanen Neon Postgres untuk akun & presensi. Foto bukti presensi tersimpan di Google Drive.
                    </p>
                  </div>
                </div>

                {/* Opsi 2: Server Storage (RustFS) */}
                <div
                  onClick={() => {
                    setStorageProviderInput('SERVER');
                    updateSettings({
                      ...settings,
                      storageProvider: 'SERVER'
                    });
                    showSuccess('Mode penyimpanan aktif: Dedicated Server RustFS!');
                  }}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '14px',
                    border: `2px solid ${storageProviderInput === 'SERVER' ? '#7C3AED' : '#E2E8F0'}`,
                    backgroundColor: storageProviderInput === 'SERVER' ? '#FAF5FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: storageProviderInput === 'SERVER' ? '0 4px 14px rgba(124, 58, 237, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: storageProviderInput === 'SERVER' ? '#7C3AED' : '#F1F5F9',
                    color: storageProviderInput === 'SERVER' ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <HardDrive size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: storageProviderInput === 'SERVER' ? '#581C87' : '#1E293B' }}>
                        🖥️ Dedicated Server Storage
                      </span>
                      {storageProviderInput === 'SERVER' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', backgroundColor: '#DDD6FE', color: '#581C87' }}>
                          AKTIF
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: storageProviderInput === 'SERVER' ? '#6B21A8' : '#64748B', lineHeight: 1.35 }}>
                      Simpan file foto bukti langsung ke server penyimpanan RustFS terdistribusi mandiri berkecepatan tinggi.
                    </p>
                  </div>
                </div>
              </div>

              {/* PANEL 1: PENGATURAN VERCEL POSTGRES & GOOGLE DRIVE STORAGE */}
              {storageProviderInput === 'GOOGLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#F8FAFC', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  
                  {/* Status Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ECFDF5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                    <CheckCircle2 size={20} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#065F46' }}>
                        Mode Aktif: Vercel Postgres (Neon) & Google Drive Storage
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                        Seluruh akun pegawai, riwayat presensi masuk/pulang, shift, dan rekap disinkronkan langsung ke database cloud PostgreSQL. Foto bukti otomatis disimpan ke Google Drive.
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {/* Status Database Postgres */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Database size={16} color="#059669" />
                          <span>Database Cloud Utama: <strong>Vercel Postgres (Neon)</strong></span>
                        </label>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                          Tersambung langsung via serverless environment variable <code>POSTGRES_URL</code>. Tabel <code>users</code>, <code>attendance</code>, dan <code>settings</code> terkelola otomatis.
                        </p>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                          Terkoneksi Otomatis
                        </span>
                      </div>
                    </div>

                    {/* Link Folder Google Drive */}
                    <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Folder size={16} color="#0284C7" />
                        <span>Link Folder Utama Google Drive (Penyimpanan Foto Bukti)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                        value={googleDriveFolderUrlInput}
                        onChange={(e) => setGoogleDriveFolderUrlInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', backgroundColor: '#FFFFFF' }}
                      />
                      <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                        ID Folder Drive: <code>{cloudApiService.extractFolderId(googleDriveFolderUrlInput) || '(Tempel URL Folder Drive di atas)'}</code>
                      </span>
                    </div>
                  </div>

                  {/* Vercel Serverless Information Alert */}
                  <div style={{ backgroundColor: '#ECFDF5', border: '1.5px solid #A7F3D0', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Cloud size={24} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 800, color: '#065F46' }}>
                        ✅ Backend Vercel Serverless & Postgres Aktif (Bebas Apps Script & Bebas Lemot)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857', lineHeight: 1.5 }}>
                        Integrasi database cloud dikelola langsung oleh Vercel API (<code>/api/sync</code>) menggunakan driver Neon Serverless. Untuk mengunduh laporan multi-sheet kapan saja, gunakan tombol <strong>"Unduh Excel Rekap"</strong> di tab Riwayat Presensi.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        const newSettings = {
                          ...settings,
                          storageProvider: 'GOOGLE',
                          googleDriveFolderUrl: googleDriveFolderUrlInput.trim()
                        };
                        updateSettings(newSettings);
                        await cloudApiService.saveCentralSettings(newSettings);
                        showSuccess('Konfigurasi Cloud Storage & Database berhasil disimpan!');
                        if (refreshUsersFromCloud) refreshUsersFromCloud();
                        if (refreshAttendanceFromCloud) refreshAttendanceFromCloud();
                      }}
                      style={{
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '11px 22px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      Simpan Konfigurasi Storage
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setTestingGoogleCloud(true);
                        try {
                          const res = await cloudApiService.testGoogleIntegration(
                            '',
                            googleDriveFolderUrlInput.trim()
                          );
                          if (res.success) {
                            showSuccess(res.message, 'UJI KONEKSI DATABASE BERHASIL');
                          } else {
                            showError(res.message, 'UJI KONEKSI DATABASE GAGAL');
                          }
                        } catch (err) {
                          showError(`Koneksi gagal: ${err.message}`, 'KONEKSI GAGAL');
                        } finally {
                          setTestingGoogleCloud(false);
                        }
                      }}
                      style={{
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '11px 18px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      {testingGoogleCloud ? 'Menguji Database...' : '🧪 Uji Koneksi Vercel Postgres & Drive'}
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 2: PENGATURAN DEDICATED SERVER RUSTFS */}
              {storageProviderInput === 'SERVER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#FAF5FF', padding: '20px', borderRadius: '14px', border: '1px solid #E9D5FF' }}>
                  
                  {/* Status Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F3E8FF', padding: '12px 16px', borderRadius: '10px', border: '1px solid #DDD6FE' }}>
                    <HardDrive size={20} color="#7C3AED" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#581C87' }}>
                        Mode Aktif: Dedicated Server Storage (RustFS File Server)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6B21A8' }}>
                        Seluruh file foto verifikasi wajah kamera dan bukti izin diunggah langsung ke server penyimpanan RustFS mandiri berkecepatan tinggi.
                      </div>
                    </div>
                  </div>

                  {/* Toggle Aktifkan */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#FFFFFF', padding: '14px 18px', borderRadius: '10px', border: '1px solid #DDD6FE' }}>
                    <input
                      type="checkbox"
                      checked={rustfsEnabledInput}
                      onChange={(e) => setRustfsEnabledInput(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#7C3AED' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#581C87' }}>
                        Aktifkan Penyimpanan Foto ke Server RustFS
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B21A8' }}>
                        Foto presensi diunggah ke server RustFS dan tautan URL fotonya dicatat ke database.
                      </div>
                    </div>
                  </label>

                  {/* Form Inputs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        URL Endpoint Server RustFS
                      </label>
                      <input
                        type="url"
                        placeholder="https://rustfs.pkmcermee.my.id atau http://192.168.1.100:8000"
                        value={rustfsEndpointInput}
                        onChange={(e) => setRustfsEndpointInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Nama Bucket / Folder RustFS
                      </label>
                      <input
                        type="text"
                        placeholder="bukti-presensi"
                        value={rustfsBucketInput}
                        onChange={(e) => setRustfsBucketInput(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      API Key / Access Token RustFS (Opsional)
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan token jika RustFS dilindungi otentikasi"
                      value={rustfsApiKeyInput}
                      onChange={(e) => setRustfsApiKeyInput(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '0.9rem', backgroundColor: '#FFFFFF' }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({
                          ...settings,
                          storageProvider: 'SERVER',
                          rustfsEndpoint: rustfsEndpointInput.trim(),
                          rustfsBucket: rustfsBucketInput.trim(),
                          rustfsApiKey: rustfsApiKeyInput.trim(),
                          rustfsEnabled: rustfsEnabledInput
                        });
                        showSuccess('Pengaturan Server RustFS berhasil disimpan!');
                      }}
                      style={{
                        backgroundColor: '#7C3AED',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '11px 22px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)'
                      }}
                    >
                      Simpan Pengaturan Server RustFS
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!rustfsEndpointInput.trim()) {
                          showWarning('Harap isi URL Endpoint RustFS terlebih dahulu.');
                          return;
                        }
                        setTestingRustFS(true);
                        try {
                          const res = await rustfsService.testConnection(rustfsEndpointInput.trim(), rustfsApiKeyInput.trim());
                          if (res.success) {
                            showSuccess(res.message, 'KONEKSI SERVER BERHASIL');
                          } else {
                            showError(res.message, 'KONEKSI SERVER GAGAL');
                          }
                        } catch (err) {
                          showError(`Gagal koneksi: ${err.message}`, 'KONEKSI GAGAL');
                        } finally {
                          setTestingRustFS(false);
                        }
                      }}
                      style={{
                        backgroundColor: '#F3E8FF',
                        color: '#7C3AED',
                        border: '1px solid #DDD6FE',
                        borderRadius: '8px',
                        padding: '11px 18px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      {testingRustFS ? 'Menguji...' : '🧪 Uji Koneksi Server RustFS'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: MANAJEMEN DATA & RESET DATABASE KE KOSONG */}
            <div className="table-card" style={{ padding: '24px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#DC2626', margin: 0 }}>
                    3. Reset Data Database (Mulai dari Nol)
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                    Kosongkan seluruh data dummy pegawai dan riwayat presensi agar siap diisi dengan data pegawai riil dari 0.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: '#7F1D1D' }}>
                  Akun Administrator (<code>admin@siabsen.go.id</code>) tetap disimpan agar Anda tetap bisa login sebagai admin.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    showConfirm({
                      type: 'warning',
                      title: 'RESET SELURUH DATA & CACHE',
                      message: 'Apakah Anda yakin ingin menghapus data pegawai dan riwayat presensi di penyimpanan lokal & server cloud?\n\nTindakan ini akan mengosongkan sistem agar Anda dapat mendaftarkan ulang pegawai dari 0.',
                      confirmText: 'YA, RESET SEMUA',
                      cancelText: 'BATAL',
                      onConfirm: async () => {
                        await resetLocalAndCloudData();
                        showSuccess('Seluruh data pegawai & cache berhasil direset! Halaman akan dimuat ulang.', 'RESET BERHASIL');
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }
                    });
                  }}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  🗑️ Kosongkan Seluruh Data Dummy
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* MODAL SETUP WAJIB PADA LOGIN PERTAMA (JIKA MASIH MENGGUNAKAN PASSWORD DEFAULT) */}
      <AdminForceSetupModal 
        isOpen={currentUser?.role === 'admin' && currentUser?.password === 'admin'} 
      />

      {/* MODAL PENGATURAN PROFIL & KATA SANDI ADMINISTRATOR */}
      <AdminProfileModal 
        isOpen={showAdminProfileModal} 
        onClose={() => setShowAdminProfileModal(false)} 
      />
    </div>
  );
}
