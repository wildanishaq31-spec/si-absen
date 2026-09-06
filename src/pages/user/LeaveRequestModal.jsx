import React, { useState } from 'react';
import { Upload, Camera, Image, X, Check, FileText } from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatDateYMD } from '../../utils/formatters';

export function LeaveRequestModal({ isOpen, onClose, initialType = 'Izin' }) {
  const { submitLeave, showWarning } = useAttendance();
  const [leaveType, setLeaveType] = useState(initialType);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(formatDateYMD(new Date()));
  const [endDate, setEndDate] = useState(formatDateYMD(new Date()));
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Compress using canvas
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setEvidencePreview(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showWarning('Harap isi keterangan/alasan pengajuan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    await submitLeave({
      type: leaveType,
      reason,
      evidenceDataUrl: evidencePreview,
      startDate,
      endDate
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-indicator" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00838F' }}>Pengajuan Ketidakhadiran</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Izin, Cuti, Sakit, atau Dinas Luar</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Tipe Izin */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Jenis Kehadiran / Surat
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLeaveType(t)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: leaveType === t ? '2px solid #00838F' : '1px solid #CBD5E1',
                    background: leaveType === t ? '#E0F7FA' : '#F8FAFC',
                    color: leaveType === t ? '#00838F' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rentang Tanggal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                required
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Alasan / Keterangan Lengkap
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mengikuti diklat dinas luar / Surat dokter terlampir..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              required
            />
          </div>

          {/* Upload Bukti Surat / Kamera / Galeri */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Unggah Bukti Surat / Foto (Kamera / Galeri HP)
            </label>
            
            {evidencePreview ? (
              <div style={{ position: 'relative', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                <img src={evidencePreview} alt="Bukti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setEvidencePreview(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label 
                style={{
                  border: '2px dashed #00ACC1',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#F0FDFA',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', color: '#00838F' }}>
                  <Camera size={22} />
                  <Image size={22} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00838F' }}>
                  Ambil Foto / Pilih dari Galeri
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Foto surat dokter, surat tugas, atau dokumen izin
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'linear-gradient(135deg, #0097A7, #00838F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginTop: '6px'
            }}
          >
            {submitting ? 'Mengunggah ke Drive...' : <><Check size={18} /> Kirim Pengajuan</>}
          </button>
        </form>
      </div>
    </div>
  );
}
