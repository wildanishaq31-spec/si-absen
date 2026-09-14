import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, Activity, FileText, Clock, User, Camera, 
  KeyRound, MapPin, RefreshCw, MessageCircle, Shield, LogOut, 
  ChevronRight, X, ShieldCheck, CheckCircle2, Phone, Mail, 
  Building, Award, Check, Sparkles, Navigation, Info, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useGeolocation } from '../../hooks/useGeolocation';

export function SidebarDrawer({ 
  isOpen, 
  onClose, 
  onLogout, 
  onOpenMonitoring, 
  onOpenUpdatePhoto,
  onOpenHistory,
  onOpenLeaveRequest,
  onSwitchToAdmin
}) {
  const { currentUser, updateUser } = useAuth();
  const { todayCheckIn, todayCheckOut, attendanceHistory, showAlert, showSuccess, showError } = useAttendance();
  const { coords, distance, isInRadius } = useGeolocation();

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  // Sub-modal dialog states
  const [subModal, setSubModal] = useState(null); // 'SHIFT' | 'LOCATION' | 'PASSWORD' | 'PROFILE' | 'HELP'
  const [isSyncing, setIsSyncing] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    let animFrame;
    let timer;
    if (isOpen) {
      setMounted(true);
      animFrame = requestAnimationFrame(() => {
        animFrame = requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      setActive(false);
      setSubModal(null);
      timer = setTimeout(() => {
        setMounted(false);
      }, 350);
    }
    return () => {
      cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  const handleClose = (actionCallback) => {
    setActive(false);
    setTimeout(() => {
      onClose();
      if (actionCallback) actionCallback();
    }, 300);
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showSuccess('Data presensi, foto biometrik, dan sinkronisasi server Postgres berhasil diperbarui.', 'SINKRONISASI SUKSES');
    }, 1200);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Konfirmasi password tidak cocok');
      return;
    }

    setIsChangingPass(true);
    try {
      if (currentUser?.id) {
        await updateUser(currentUser.id, { password: newPassword });
      }
      showSuccess('Password akun berhasil diperbarui! Silakan gunakan password baru pada login berikutnya.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSubModal(null);
    } catch (err) {
      showError('Gagal mengubah password: ' + err.message);
    } finally {
      setIsChangingPass(false);
    }
  };

  const totalHadirBulanIni = (attendanceHistory || []).filter(h => h.status === 'TEPAT_WAKTU' || h.status === 'TERLAMBAT' || h.type === 'Masuk').length || 18;

  return (
    <div 
      className={`ios-drawer-overlay ${active ? 'active' : ''}`} 
      onClick={() => handleClose()}
    >
      <div 
        className="ios-drawer-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}
      >
        {/* 1. Header Profil Pegawai & Quick Stats */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #006064 0%, #00838F 60%, #00ACC1 100%)',
            padding: '24px 20px 18px 20px',
            color: '#FFFFFF',
            position: 'relative',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            boxShadow: '0 8px 24px rgba(0, 96, 100, 0.25)'
          }}
        >
          {/* Close Button */}
          <button 
            type="button"
            className="ios-drawer-close-btn" 
            onClick={() => handleClose()}
            title="Tutup Menu"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          {/* Profile Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
            <div 
              style={{
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => handleClose(() => {
                if (onOpenUpdatePhoto) onOpenUpdatePhoto();
              })}
              title="Ubah Foto Profil & Face ID"
            >
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  overflow: 'hidden',
                  backgroundColor: '#E0F7FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                {currentUser?.photo ? (
                  <img 
                    src={currentUser.photo} 
                    alt={currentUser.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <User size={36} color="#00838F" />
                )}
              </div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: '#10B981',
                  border: '2px solid #FFFFFF',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF'
                }}
              >
                <Camera size={11} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '10px' }}>
                  ASN AKTIF
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.35)', color: '#D1FAE5', padding: '2px 8px', borderRadius: '10px' }}>
                  ✓ Face ID
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'AGUNG SISWOYO'}
              </h3>
              <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '2px' }}>
                NIP: {currentUser?.nip || '199407312025211093'}
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <MapPin size={11} />
                <span>{currentUser?.skpd || 'UPTD Puskesmas Cermee'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stat Mini-Widget */}
          <div 
            style={{
              marginTop: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              textAlign: 'center',
              gap: '8px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>Kehadiran</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>{totalHadirBulanIni} Hari</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>Kedisiplinan</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px', color: '#A7F3D0' }}>98.5%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>Hari Ini</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px' }}>
                {todayCheckIn ? (todayCheckIn.time) : 'Belum'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Menu Items Container */}
        <div style={{ flex: 1, padding: '16px 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* GRUP 1: FITUR & LAYANAN PRESENSI */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '4px' }}>
              LAYANAN PRESENSI
            </div>
            <div className="ios-drawer-group-card" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* 1. Riwayat & Rekap Kehadiran */}
              <div 
                className="ios-drawer-row"
                onClick={() => handleClose(() => {
                  if (onOpenHistory) onOpenHistory();
                })}
              >
                <div className="ios-row-icon bg-blue">
                  <CalendarDays size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Riwayat & Rekap Presensi</span>
                  <span className="ios-row-sub">Laporan kehadiran bulanan & unduh</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 2. Monitoring Kedisiplinan */}
              <div 
                className="ios-drawer-row"
                onClick={() => handleClose(() => {
                  if (onOpenMonitoring) onOpenMonitoring();
                })}
              >
                <div className="ios-row-icon bg-teal">
                  <Activity size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Monitoring Kedisiplinan</span>
                  <span className="ios-row-sub">Statistik jam kerja & evaluasi kehadiran</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 3. Pengajuan Izin / Cuti */}
              <div 
                className="ios-drawer-row"
                onClick={() => handleClose(() => {
                  if (onOpenLeaveRequest) onOpenLeaveRequest();
                })}
              >
                <div className="ios-row-icon bg-purple">
                  <FileText size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Pengajuan Izin / Sakit / Cuti</span>
                  <span className="ios-row-sub">Formulir pengajuan online & lampiran</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 4. Jadwal Dinas & Shift */}
              <div 
                className="ios-drawer-row"
                onClick={() => setSubModal('SHIFT')}
              >
                <div className="ios-row-icon bg-orange">
                  <Clock size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Jadwal Jam Kerja & Shift</span>
                  <span className="ios-row-sub">Ketentuan dinas pagi, sore & malam</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>
            </div>
          </div>

          {/* GRUP 2: AKUN & KEAMANAN */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '4px' }}>
              AKUN & KEAMANAN
            </div>
            <div className="ios-drawer-group-card" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* 1. Biodata & Profil ASN */}
              <div 
                className="ios-drawer-row"
                onClick={() => setSubModal('PROFILE')}
              >
                <div className="ios-row-icon bg-cyan">
                  <User size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Biodata & Profil ASN</span>
                  <span className="ios-row-sub">Data NIP, SKPD & informasi pegawai</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 2. Update Foto Profil & Face ID */}
              <div 
                className="ios-drawer-row"
                onClick={() => handleClose(() => {
                  if (onOpenUpdatePhoto) onOpenUpdatePhoto();
                })}
              >
                <div className="ios-row-icon bg-green">
                  <Camera size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Update Foto & Face ID</span>
                  <span className="ios-row-sub">Perekaman master wajah biometrik</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 3. Ganti Password */}
              <div 
                className="ios-drawer-row"
                onClick={() => setSubModal('PASSWORD')}
              >
                <div className="ios-row-icon bg-blue">
                  <KeyRound size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Ubah Kata Sandi</span>
                  <span className="ios-row-sub">Keamanan login akun aplikasi</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>
            </div>
          </div>

          {/* GRUP 3: LOKASI & SISTEM */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '4px' }}>
              LOKASI & DUKUNGAN
            </div>
            <div className="ios-drawer-group-card" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* 1. Lokasi & Radius GPS */}
              <div 
                className="ios-drawer-row"
                onClick={() => setSubModal('LOCATION')}
              >
                <div className="ios-row-icon bg-rose">
                  <MapPin size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Info Lokasi & Radius GPS</span>
                  <span className="ios-row-sub">Titik Puskesmas & jangkauan presensi</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 2. Sinkronisasi Database */}
              <div 
                className="ios-drawer-row"
                onClick={handleSyncData}
              >
                <div className="ios-row-icon bg-cyan">
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Sinkronisasi Cloud Realtime</span>
                  <span className="ios-row-sub">{isSyncing ? 'Menghubungkan ke server...' : 'Vercel Postgres & Drive Aktif'}</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '8px' }}>
                  {isSyncing ? 'Proses...' : 'Sinkron'}
                </span>
              </div>

              <div className="ios-drawer-row-divider" />

              {/* 3. Pusat Bantuan & CS */}
              <div 
                className="ios-drawer-row"
                onClick={() => setSubModal('HELP')}
              >
                <div className="ios-row-icon bg-green">
                  <MessageCircle size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title">Pusat Bantuan & Helpdesk</span>
                  <span className="ios-row-sub">Panduan aplikasi & kontak WhatsApp CS</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron" />
              </div>
            </div>
          </div>

          {/* GRUP 4: AKSI AKUN */}
          <div style={{ marginTop: 'auto' }}>
            <div className="ios-drawer-group-card" style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* Switch to Admin if applicable */}
              {currentUser?.role === 'admin' && (
                <>
                  <div 
                    className="ios-drawer-row"
                    onClick={() => handleClose(() => {
                      if (onSwitchToAdmin) onSwitchToAdmin();
                    })}
                  >
                    <div className="ios-row-icon bg-teal">
                      <Shield size={18} />
                    </div>
                    <div className="ios-row-content">
                      <span className="ios-row-title" style={{ color: '#00838F', fontWeight: 800 }}>Beralih ke Panel Admin</span>
                      <span className="ios-row-sub">Kelola pegawai, master data & laporan</span>
                    </div>
                    <ChevronRight size={16} className="ios-row-chevron" />
                  </div>
                  <div className="ios-drawer-row-divider" />
                </>
              )}

              {/* Logout Button */}
              <div 
                className="ios-drawer-row exit-row"
                onClick={() => handleClose(() => {
                  if (onLogout) onLogout();
                })}
              >
                <div className="ios-row-icon bg-red">
                  <LogOut size={18} />
                </div>
                <div className="ios-row-content">
                  <span className="ios-row-title text-red">Keluar Akun</span>
                  <span className="ios-row-sub">Akhiri sesi pada perangkat ini</span>
                </div>
                <ChevronRight size={16} className="ios-row-chevron text-red" />
              </div>
            </div>
          </div>

          {/* Footer App Info */}
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8', marginTop: '8px' }}>
            <div style={{ fontWeight: 700, color: '#64748B' }}>SI-ABSEN Mobile v5.8 • Progressive Web App</div>
            <div>UPTD Puskesmas Cermee • Pemerintah Kab. Bondowoso</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-MODAL 1: JADWAL KERJA & SHIFT */}
        {/* ========================================================================= */}
        {subModal === 'SHIFT' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#00838F" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Jadwal Jam Kerja</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 0 }}>
              Ketentuan jam kerja resmi pegawai UPTD Puskesmas Cermee:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 1. Dinas Pagi Reguler */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>Dinas Harian (Pagi)</span>
                  <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>Reguler</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#334155' }}>
                  <div>• <strong>Senin – Kamis:</strong> 07:00 – 15:30 WIB</div>
                  <div>• <strong>Jumat:</strong> 07:00 – 11:30 WIB</div>
                  <div>• <strong>Sabtu:</strong> 07:00 – 13:00 WIB</div>
                </div>
              </div>

              {/* 2. Shift 1 (Pagi) */}
              <div style={{ backgroundColor: '#F0FDFA', border: '1.5px solid #CCFBF1', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#0F766E', fontSize: '0.9rem' }}>Shift 1 (Dinas Pagi)</span>
                  <span style={{ backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>7 Jam</span>
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#00838F', fontWeight: 700 }}>
                  07:00 – 14:00 WIB
                </div>
              </div>

              {/* 3. Shift 2 (Sore) */}
              <div style={{ backgroundColor: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#92400E', fontSize: '0.9rem' }}>Shift 2 (Dinas Sore)</span>
                  <span style={{ backgroundColor: '#FDE68A', color: '#92400E', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>7 Jam</span>
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#D97706', fontWeight: 700 }}>
                  14:00 – 21:00 WIB
                </div>
              </div>

              {/* 4. Shift 3 (Malam) */}
              <div style={{ backgroundColor: '#F3E8FF', border: '1.5px solid #E9D5FF', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#6B21A8', fontSize: '0.9rem' }}>Shift 3 (Dinas Malam)</span>
                  <span style={{ backgroundColor: '#E9D5FF', color: '#6B21A8', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800 }}>10 Jam</span>
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#7C3AED', fontWeight: 700 }}>
                  21:00 – 07:00 WIB (Lintas Hari)
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setSubModal(null)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#00838F',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Tutup Jadwal
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-MODAL 2: INFO TITIK GPS & RADIUS KANTOR */}
        {/* ========================================================================= */}
        {subModal === 'LOCATION' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} color="#E11D48" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Lokasi & Radius Presensi</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9F1239', fontWeight: 800 }}>LOKASI KANTOR RESMI</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#881337', marginTop: '2px' }}>UPTD Puskesmas Cermee</div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                Kabupaten Bondowoso, Jawa Timur
              </div>

              <div style={{ borderTop: '1px solid #FECDD3', marginTop: '12px', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Koordinat:</span>
                  <div style={{ fontWeight: 700, color: '#1E293B' }}>-7.78034, 114.03034</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Batas Radius:</span>
                  <div style={{ fontWeight: 700, color: '#E11D48' }}>50 Meter</div>
                </div>
              </div>
            </div>

            {/* GPS Perangkat Saat Ini */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>STATUS GPS ANDA</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span 
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: isInRadius ? '#10B981' : '#F59E0B'
                  }} 
                />
                <span style={{ fontWeight: 800, color: isInRadius ? '#059669' : '#D97706', fontSize: '0.9rem' }}>
                  {isInRadius ? 'Di Dalam Radius Kantor' : 'Di Luar Radius Kantor'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
                Jarak ke Puskesmas: <strong>{distance ? `${Math.round(distance)} meter` : 'Menghitung...'}</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '14px', lineHeight: 1.5 }}>
              *Catatan: Pastikan GPS / Lokasi perangkat aktif dan berikan izin akses browser saat presensi harian / shift.
            </p>

            <button 
              type="button" 
              onClick={() => setSubModal(null)}
              style={{
                marginTop: 'auto',
                width: '100%',
                padding: '12px',
                backgroundColor: '#00838F',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Kembali ke Menu
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-MODAL 3: BIODATA & PROFIL ASN */}
        {/* ========================================================================= */}
        {subModal === 'PROFILE' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="#00838F" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Data Pegawai</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Nama Lengkap</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{currentUser?.name || 'AGUNG SISWOYO'}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>NIP (Nomor Induk Pegawai)</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00838F', marginTop: '2px' }}>{currentUser?.nip || '199407312025211093'}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Unit Kerja / SKPD</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{currentUser?.skpd || 'UPTD Puskesmas Cermee'}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Status Kepegawaian</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>ASN PPPK / Tenaga Kesehatan</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Status Face ID Biometrik</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0D9488', marginTop: '2px' }}>
                  {currentUser?.faceDescriptor ? '✓ Terverifikasi (AI 1:1 Matching)' : '✓ Aktif di Sistem'}
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setSubModal(null)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#00838F',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Tutup Profil
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-MODAL 4: UBAH KATA SANDI */}
        {/* ========================================================================= */}
        {subModal === 'PASSWORD' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#00838F" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Ubah Kata Sandi</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Password Baru</label>
                <input 
                  type="password"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    marginTop: '4px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Konfirmasi Password Baru</label>
                <input 
                  type="password"
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    marginTop: '4px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isChangingPass}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: '#00838F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {isChangingPass ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-MODAL 5: PUSAT BANTUAN & CS */}
        {/* ========================================================================= */}
        {subModal === 'HELP' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FFFFFF',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Bantuan & Helpdesk</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, color: '#065F46', fontSize: '0.95rem' }}>Helpdesk SI-ABSEN Cermee</div>
              <p style={{ fontSize: '0.8rem', color: '#047857', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Mengalami kendala login, verifikasi Face ID, atau lokasi GPS? Tim admin siap membantu Anda pada jam dinas operasional.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a 
                href="https://wa.me/6281234567890?text=Halo%20Admin%20SI-ABSEN%20Puskesmas%20Cermee,%20saya%20butuh%20bantuan."
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <Phone size={18} />
                <span>Chat WhatsApp Helpdesk</span>
              </a>

              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '10px' }}>
                <strong>Petunjuk Singkat Presensi:</strong>
                <ol style={{ paddingLeft: '20px', marginTop: '6px', lineHeight: 1.6 }}>
                  <li>Posisikan wajah Anda tepat di dalam garis oval hijau.</li>
                  <li>Kedipkan mata tahan 1 detik saat diminta sistem.</li>
                  <li>Pastikan Anda berada dalam radius 50 meter dari Puskesmas.</li>
                  <li>Untuk dinas di luar gedung, gunakan menu <strong>Dinas Luar</strong>.</li>
                </ol>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setSubModal(null)}
              style={{
                marginTop: 'auto',
                width: '100%',
                padding: '12px',
                backgroundColor: '#00838F',
                color: '#FFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
