import React, { useState, useEffect } from 'react';
import { 
  Calendar, Briefcase, Plane, Settings, Clock, ArrowRight, 
  X, FileText, Repeat, Sun, Sunset, Moon, ArrowLeft 
} from 'lucide-react';
import { SHIFT_SCHEDULE } from '../../utils/constants';
import { useAttendance } from '../../contexts/AttendanceContext';

export function PresensiMenuModal({ 
  isOpen, 
  onClose, 
  onSelectMasuk, 
  onSelectPulang, 
  onSelectLeave,
  initialStep = 'MAIN'
}) {
  const { showAlert } = useAttendance();
  const [activeStep, setActiveStep] = useState(initialStep); // 'MAIN' | 'HARIAN_CHOICE' | 'SHIFT_CHOICE' | 'SHIFT_ACTION' | 'D3_CHOICE'
  const [selectedShift, setSelectedShift] = useState('PAGI'); // 'PAGI' | 'SORE' | 'MALAM'

  useEffect(() => {
    if (isOpen) {
      setActiveStep(initialStep || 'MAIN');
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const handleCloseAll = () => {
    setActiveStep(initialStep || 'MAIN');
    onClose();
  };

  const handleSelectShift = (shiftId) => {
    setSelectedShift(shiftId);
    setActiveStep('SHIFT_ACTION');
  };

  const currentShiftConfig = SHIFT_SCHEDULE[selectedShift] || SHIFT_SCHEDULE.PAGI;

  return (
    <div className="modal-backdrop" onClick={handleCloseAll}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-indicator" />

        {/* 1. MAIN MENU PILIH JENIS PRESENSI */}
        {activeStep === 'MAIN' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00838F' }}>PILIH JENIS PRESENSI</h3>
              <button 
                type="button"
                onClick={handleCloseAll}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="modal-grid-menu">
              {/* 1. Harian (Dinas Pagi Standar) */}
              <div 
                className="menu-item-card"
                onClick={() => setActiveStep('HARIAN_CHOICE')}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
                  <Calendar size={28} />
                </div>
                <span className="menu-label">Harian (Pagi)</span>
              </div>

              {/* 2. Dinas Shift (3 Shift / Muter) */}
              <div 
                className="menu-item-card"
                onClick={() => setActiveStep('SHIFT_CHOICE')}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#F0FDFA', color: '#0D9488', border: '1.5px solid #99F6E4' }}>
                  <Repeat size={28} />
                </div>
                <span className="menu-label" style={{ fontWeight: 800, color: '#0F766E' }}>Dinas 3 Shift</span>
              </div>

              {/* 3. D3 */}
              <div 
                className="menu-item-card"
                onClick={() => setActiveStep('D3_CHOICE')}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: '#10B981', border: '1.5px solid #A7F3D0' }}>
                  <Briefcase size={28} />
                </div>
                <span className="menu-label" style={{ fontWeight: 800, color: '#047857' }}>D3</span>
              </div>

              {/* 4. Dinas Luar */}
              <div 
                className="menu-item-card"
                onClick={() => {
                  handleCloseAll();
                  onSelectMasuk('Dinas Luar', 'DINAS_LUAR');
                }}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1.5px solid #FDE68A' }}>
                  <Plane size={28} />
                </div>
                <span className="menu-label" style={{ fontWeight: 800, color: '#B45309' }}>Dinas Luar</span>
              </div>

              {/* 5. Izin / Sakit / Cuti */}
              <div 
                className="menu-item-card"
                onClick={() => {
                  handleCloseAll();
                  onSelectLeave('Izin');
                }}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                  <FileText size={28} />
                </div>
                <span className="menu-label">Izin / Sakit / Cuti</span>
              </div>

              {/* 6. Mode Test */}
              <div 
                className="menu-item-card"
                onClick={() => {
                  handleCloseAll();
                  showAlert({
                    type: 'info',
                    title: 'MODE TEST PRESENSI',
                    message: 'Mode Test Presensi: Simulasi GPS dan Kamera aktif.'
                  });
                }}
              >
                <div className="menu-icon-wrapper" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                  <Settings size={28} />
                </div>
                <span className="menu-label">Mode Test</span>
              </div>
            </div>
          </>
        )}

        {/* 2. SUB-MODAL ABSENSI HARIAN (DINAS PAGI) */}
        {activeStep === 'HARIAN_CHOICE' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={18} color="#00838F" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00838F' }}>PRESENSI HARIAN</span>
              </div>
              <button 
                type="button"
                onClick={handleCloseAll}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '4px 0' }}>
                ABSENSI <span style={{ color: '#00838F' }}>HARIAN</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Presensi dinas pagi standar instansi</p>
            </div>

            <div className="harian-choice-grid">
              {/* MASUK */}
              <div 
                className="choice-card-harian masuk"
                onClick={() => {
                  handleCloseAll();
                  onSelectMasuk('Masuk', 'HARIAN');
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: '#E0F7FA', color: '#00838F' }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-masuk">MASUK</span>
              </div>

              {/* PULANG */}
              <div 
                className="choice-card-harian pulang"
                onClick={() => {
                  handleCloseAll();
                  onSelectPulang('Pulang', 'HARIAN');
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: '#FFEBEE', color: '#DC2626' }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-pulang">PULANG</span>
              </div>
            </div>

            <button 
              type="button"
              className="modal-back-btn"
              onClick={() => setActiveStep('MAIN')}
            >
              <ArrowLeft size={16} /> Kembali ke Menu
            </button>
          </>
        )}

        {/* 3. SUB-MODAL ABSENSI D3 (MASUK & PULANG) */}
        {activeStep === 'D3_CHOICE' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={18} color="#059669" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>PRESENSI D3</span>
              </div>
              <button 
                type="button"
                onClick={handleCloseAll}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '4px 0' }}>
                ABSENSI <span style={{ color: '#059669' }}>D3</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Pilih waktu presensi masuk atau pulang tugas D3 Anda</p>
            </div>

            <div className="harian-choice-grid">
              {/* MASUK D3 */}
              <div 
                className="choice-card-harian masuk-d3"
                onClick={() => {
                  handleCloseAll();
                  onSelectMasuk('D3 Masuk', 'D3');
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-masuk" style={{ color: '#059669' }}>MASUK D3</span>
              </div>

              {/* PULANG D3 */}
              <div 
                className="choice-card-harian pulang"
                onClick={() => {
                  handleCloseAll();
                  onSelectPulang('D3 Pulang', 'D3');
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: '#FFEBEE', color: '#DC2626' }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-pulang">PULANG D3</span>
              </div>
            </div>

            <button 
              type="button"
              className="modal-back-btn"
              onClick={() => setActiveStep('MAIN')}
            >
              <ArrowLeft size={16} /> Kembali ke Menu
            </button>
          </>
        )}

        {/* 3. SUB-MODAL PEMILIHAN SHIFT (3 SHIFT) */}
        {activeStep === 'SHIFT_CHOICE' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Repeat size={18} color="#0D9488" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0D9488' }}>DINAS 3 SHIFT</span>
              </div>
              <button 
                type="button"
                onClick={handleCloseAll}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D9488', margin: '4px 0' }}>
                PILIH SESI DINAS SHIFT
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Pilih jadwal dinas muter bertugas Anda hari ini</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '10px 0 16px 0' }}>
              {/* SHIFT 1: DINAS PAGI (07.00 - 14.00) */}
              <div 
                className="choice-card-shift pagi"
                onClick={() => handleSelectShift('PAGI')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="shift-icon-wrap" style={{ backgroundColor: '#E0F7FA', color: '#00838F' }}>
                    <Sun size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Dinas Pagi</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00838F' }}>07:00 – 14:00 WIB</span>
                  </div>
                </div>
                <span style={{ background: '#CCFBF1', color: '#0F766E', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                  7 Jam
                </span>
              </div>

              {/* SHIFT 2: DINAS SORE (14.00 - 21.00) */}
              <div 
                className="choice-card-shift sore"
                onClick={() => handleSelectShift('SORE')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="shift-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Sunset size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Dinas Sore</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>14:00 – 21:00 WIB</span>
                  </div>
                </div>
                <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                  7 Jam
                </span>
              </div>

              {/* SHIFT 3: DINAS MALAM (21.00 - 07.00) */}
              <div 
                className="choice-card-shift malam"
                onClick={() => handleSelectShift('MALAM')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="shift-icon-wrap" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                    <Moon size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Dinas Malam</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7C3AED' }}>21:00 – 07:00 WIB</span>
                  </div>
                </div>
                <span style={{ background: '#F3E8FF', color: '#6D28D9', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px' }}>
                  10 Jam (Lintas Hari)
                </span>
              </div>
            </div>

            <button 
              type="button"
              className="modal-back-btn"
              onClick={() => setActiveStep('MAIN')}
            >
              <ArrowLeft size={16} /> Kembali ke Menu
            </button>
          </>
        )}

        {/* 4. SUB-MODAL AKSI SHIFT (MASUK / PULANG SHIFT TERPILIH) */}
        {activeStep === 'SHIFT_ACTION' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Repeat size={18} color={currentShiftConfig.color} />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: currentShiftConfig.color }}>
                  {currentShiftConfig.name.toUpperCase()}
                </span>
              </div>
              <button 
                type="button"
                onClick={handleCloseAll}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
              <span style={{ background: currentShiftConfig.bg, color: currentShiftConfig.color, fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>
                {currentShiftConfig.name} ({currentShiftConfig.start} - {currentShiftConfig.end})
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '4px 0' }}>
                ABSENSI <span style={{ color: currentShiftConfig.color }}>{currentShiftConfig.name.toUpperCase()}</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Pilih waktu presensi masuk atau pulang shift Anda</p>
            </div>

            <div className="harian-choice-grid">
              {/* MASUK SHIFT */}
              <div 
                className="choice-card-harian masuk"
                onClick={() => {
                  handleCloseAll();
                  onSelectMasuk('Shift Masuk', 'SHIFT', selectedShift);
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: currentShiftConfig.bg, color: currentShiftConfig.color }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-masuk" style={{ color: currentShiftConfig.color }}>MASUK SHIFT</span>
              </div>

              {/* PULANG SHIFT */}
              <div 
                className="choice-card-harian pulang"
                onClick={() => {
                  handleCloseAll();
                  onSelectPulang('Shift Pulang', 'SHIFT', selectedShift);
                }}
              >
                <div className="choice-card-icon-wrap" style={{ backgroundColor: '#FFEBEE', color: '#DC2626' }}>
                  <Clock size={36} />
                </div>
                <span className="choice-label-pulang">PULANG SHIFT</span>
              </div>
            </div>

            <button 
              type="button"
              className="modal-back-btn"
              onClick={() => setActiveStep('SHIFT_CHOICE')}
            >
              <ArrowLeft size={16} /> Ganti Shift
            </button>
          </>
        )}
      </div>
    </div>
  );
}

