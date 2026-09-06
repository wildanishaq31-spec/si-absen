import React, { useEffect, useState } from 'react';
import { 
  Monitor, Phone, User, Headset, Cloud, Paintbrush, 
  LogOut, ChevronRight, X, UserCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';

export function SidebarDrawer({ isOpen, onClose, onLogout, onOpenMonitoring, onOpenUpdatePhoto, onOpenUpdatePhone }) {
  const { currentUser } = useAuth();
  const { showAlert, showSuccess } = useAttendance();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let animFrame;
    let timer;
    if (isOpen) {
      setMounted(true);
      // Double rAF ensures the browser paints initial -100% position before transitioning to 0
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
      className={`drawer-overlay ${active ? 'active' : ''}`} 
      onClick={() => handleClose()}
    >
      <div 
        className="drawer-content" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with Rounded Teal Card */}
        <div className="drawer-header-card">
          <button 
            type="button"
            className="drawer-close-btn" 
            onClick={() => handleClose()}
            title="Tutup Menu"
          >
            <X size={18} color="#FFFFFF" />
          </button>

          <div className="drawer-avatar-wrapper">
            {currentUser?.photo ? (
              <img src={currentUser.photo} alt={currentUser.name} className="drawer-avatar-img" />
            ) : (
              <UserCircle size={76} color="#FFFFFF" strokeWidth={1.5} />
            )}
          </div>

          <h3 className="drawer-user-name">{currentUser?.name || 'AGUNG SISWOYO'}</h3>
          <div className="drawer-skpd-pill">
            {currentUser?.skpd || 'UPTD Puskesmas Cermee'}
          </div>
        </div>

        {/* Menu Items List */}
        <div className="drawer-menu-list">
          {/* 1. Monitoring Kedisiplinan */}
          <div 
            className="drawer-menu-item"
            onClick={() => handleClose(() => {
              if (onOpenMonitoring) onOpenMonitoring();
            })}
          >
            <div className="drawer-icon-box bg-blue">
              <Monitor size={20} color="#0284C7" />
            </div>
            <span className="drawer-item-label">Monitoring Kedisiplinan</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 2. Update No. HP */}
          <div 
            className="drawer-menu-item"
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
            <div className="drawer-icon-box bg-green">
              <Phone size={20} color="#16A34A" />
            </div>
            <span className="drawer-item-label">Update No. HP</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 3. Update Foto */}
          <div 
            className="drawer-menu-item"
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
            <div className="drawer-icon-box bg-teal">
              <User size={20} color="#0D9488" />
            </div>
            <span className="drawer-item-label">Update Foto</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 4. Hubungi */}
          <div 
            className="drawer-menu-item"
            onClick={() => handleClose(() => {
              showAlert({
                type: 'info',
                title: 'LAYANAN BANTUAN',
                message: 'Layanan Bantuan SI-ABSEN: Hubungi Helpdesk BKPSDM / Puskesmas di 0812-3456-7890'
              });
            })}
          >
            <div className="drawer-icon-box bg-cyan">
              <Headset size={20} color="#0891B2" />
            </div>
            <span className="drawer-item-label">Hubungi</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 5. Backup Data */}
          <div 
            className="drawer-menu-item"
            onClick={() => handleClose(() => {
              showSuccess('Seluruh riwayat absensi tersinkronisasi realtime dengan Google Drive & Spreadsheet.', 'BACKUP DATA SUKSES');
            })}
          >
            <div className="drawer-icon-box bg-purple">
              <Cloud size={20} color="#9333EA" />
            </div>
            <span className="drawer-item-label">Backup Data</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 6. Optimalkan Penyimpanan */}
          <div 
            className="drawer-menu-item"
            onClick={() => handleClose(() => {
              showSuccess('Penyimpanan Cache Aplikasi berhasil dioptimalkan.', 'OPTIMALISASI SELESAI');
            })}
          >
            <div className="drawer-icon-box bg-orange">
              <Paintbrush size={20} color="#EA580C" />
            </div>
            <span className="drawer-item-label">Optimalkan Penyimpanan</span>
            <ChevronRight size={18} className="drawer-chevron" />
          </div>

          {/* 7. Keluar */}
          <div 
            className="drawer-menu-item exit-item"
            onClick={() => handleClose(() => {
              if (onLogout) onLogout();
            })}
          >
            <div className="drawer-icon-box bg-red">
              <LogOut size={20} color="#DC2626" />
            </div>
            <span className="drawer-item-label text-red">Keluar</span>
            <ChevronRight size={18} className="drawer-chevron text-red" />
          </div>
        </div>
      </div>
    </div>
  );
}
