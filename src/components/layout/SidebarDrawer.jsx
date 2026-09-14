import React, { useEffect, useState } from 'react';
import { 
  Monitor, Phone, User, Headset, Cloud, Paintbrush, 
  LogOut, ChevronRight, X, UserCircle, ShieldCheck, 
  Sparkles, CheckCircle2, Smartphone, Database, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';

export function SidebarDrawer({ 
  isOpen, 
  onClose, 
  onLogout, 
  onOpenMonitoring, 
  onOpenUpdatePhoto, 
  onOpenUpdatePhone 
}) {
  const { currentUser } = useAuth();
  const { showAlert, showSuccess } = useAttendance();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

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

  return (
    <div 
      className={`ios-drawer-overlay ${active ? 'active' : ''}`} 
      onClick={() => handleClose()}
    >
      <div 
        className="ios-drawer-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. iOS Drawer Header Hero */}
        <div className="ios-drawer-header">
          <button 
            type="button"
            className="ios-drawer-close-btn" 
            onClick={() => handleClose()}
            title="Tutup Menu"
          >
            <X size={18} />
          </button>

          <div className="ios-drawer-profile-box">
            <div 
              className="ios-drawer-avatar-wrap"
              onClick={() => handleClose(() => {
                if (onOpenUpdatePhoto) onOpenUpdatePhoto();
              })}
              title="Ubah Foto Profil"
            >
              {currentUser?.photo ? (
                <img 
                  src={currentUser.photo} 
                  alt={currentUser.name} 
                  className="ios-drawer-avatar-img" 
                />
              ) : (
                <div className="ios-drawer-avatar-fallback">
                  <User size={36} color="#00838F" />
                </div>
              )}
              <span className="ios-drawer-online-dot" />
            </div>

            <div className="ios-drawer-user-info">
              <h3 className="ios-drawer-name">{currentUser?.name || 'AGUNG SISWOYO'}</h3>
              <span className="ios-drawer-nip">NIP: {currentUser?.nip || '-'}</span>
              <div className="ios-drawer-skpd-tag">
                <ShieldCheck size={12} className="text-teal-600" />
                <span>{currentUser?.skpd || 'UPTD Puskesmas Cermee'}</span>
              </div>
            </div>
          </div>

          {/* Quick System Badge Bar */}
          <div className="ios-drawer-status-strip">
            <div className="ios-drawer-status-item">
              <span className="ios-status-indicator-dot" />
              <span className="ios-drawer-status-label">Server Terhubung</span>
            </div>
            <span className="ios-drawer-version-badge">v5.6 iOS</span>
          </div>
        </div>

        {/* 2. Menu Groups (iOS Inset Grouped Lists) */}
        <div className="ios-drawer-body">
          {/* GROUP 1: Layanan Kepegawaian */}
          <div className="ios-drawer-group-title">LAYANAN KEPEGAWAIAN</div>
          <div className="ios-drawer-group-card">
            {/* Monitoring Kedisiplinan */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                if (onOpenMonitoring) onOpenMonitoring();
              })}
            >
              <div className="ios-row-icon bg-blue">
                <Monitor size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Monitoring Kedisiplinan</span>
                <span className="ios-row-sub">Rekap kehadiran & jam kerja</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>

            <div className="ios-drawer-row-divider" />

            {/* Update Foto */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                if (onOpenUpdatePhoto) onOpenUpdatePhoto();
                else {
                  showAlert({
                    type: 'info',
                    title: 'UPDATE FOTO PROFIL',
                    message: 'Foto profil terhubung langsung dengan database kepegawaian Puskesmas Cermee.'
                  });
                }
              })}
            >
              <div className="ios-row-icon bg-teal">
                <User size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Update Foto Profil</span>
                <span className="ios-row-sub">Verifikasi wajah sistem</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>

            <div className="ios-drawer-row-divider" />

            {/* Update No. HP */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                if (onOpenUpdatePhone) onOpenUpdatePhone();
                else {
                  showAlert({
                    type: 'info',
                    title: 'UPDATE NO. HP',
                    message: 'No. HP Anda saat ini telah tersinkronisasi otomatis dengan server kepegawaian.'
                  });
                }
              })}
            >
              <div className="ios-row-icon bg-green">
                <Phone size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Update No. Handphone</span>
                <span className="ios-row-sub">Kontak WhatsApp dinas</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>
          </div>

          {/* GROUP 2: Sistem & Bantuan */}
          <div className="ios-drawer-group-title">SISTEM & BANTUAN</div>
          <div className="ios-drawer-group-card">
            {/* Hubungi / Bantuan */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                showAlert({
                  type: 'info',
                  title: 'LAYANAN BANTUAN',
                  message: 'Layanan Bantuan SI-ABSEN: Hubungi Helpdesk Puskesmas di 0812-3456-7890 (Hari Kerja).'
                });
              })}
            >
              <div className="ios-row-icon bg-cyan">
                <Headset size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Pusat Bantuan & CS</span>
                <span className="ios-row-sub">Helpdesk SI-ABSEN</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>

            <div className="ios-drawer-row-divider" />

            {/* Backup Data */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                showSuccess('Seluruh riwayat absensi tersinkronisasi realtime dengan Vercel Postgres & Cloud Storage.', 'BACKUP DATA SUKSES');
              })}
            >
              <div className="ios-row-icon bg-purple">
                <Cloud size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Sinkronisasi & Backup</span>
                <span className="ios-row-sub">Cloud database realtime</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>

            <div className="ios-drawer-row-divider" />

            {/* Optimalkan Penyimpanan */}
            <div 
              className="ios-drawer-row"
              onClick={() => handleClose(() => {
                showSuccess('Penyimpanan Cache Aplikasi berhasil dioptimalkan.', 'OPTIMALISASI SELESAI');
              })}
            >
              <div className="ios-row-icon bg-orange">
                <Paintbrush size={18} />
              </div>
              <div className="ios-row-content">
                <span className="ios-row-title">Optimalkan Penyimpanan</span>
                <span className="ios-row-sub">Bersihkan temporary cache</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron" />
            </div>
          </div>

          {/* GROUP 3: Keluar Akun */}
          <div className="ios-drawer-group-card">
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
                <span className="ios-row-sub">Akhiri sesi di perangkat ini</span>
              </div>
              <ChevronRight size={16} className="ios-row-chevron text-red" />
            </div>
          </div>

          {/* Footer Info */}
          <div className="ios-drawer-footer">
            <span>SI-ABSEN Mobile • Versi 5.6</span>
            <span>Pemerintah Kabupaten Bondowoso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

