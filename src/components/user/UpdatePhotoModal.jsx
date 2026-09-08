import React, { useState, useRef } from 'react';
import { Camera, Image, Check, X, UserCircle, Upload, ShieldCheck, Folder } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { processProfileImage, getProfileDrivePath } from '../../utils/imageUtils';

export function UpdatePhotoModal({ isOpen, onClose }) {
  const { currentUser, updateUser } = useAuth();
  const { showSuccess, showError, settings } = useAttendance();

  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const currentPhoto = previewPhoto || currentUser?.photo || null;
  const driveInfo = getProfileDrivePath(currentUser, settings?.googleDriveFolderUrl);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const croppedBase64 = await processProfileImage(file, 360, 0.88);
      setPreviewPhoto(croppedBase64);
    } catch (err) {
      showError('Gagal memproses foto: ' + err.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSavePhoto = async () => {
    if (!previewPhoto) {
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      await updateUser(currentUser.id, {
        photo: previewPhoto
      });

      showSuccess(`Foto profil ${currentUser.name} berhasil diperbarui!`);
      setPreviewPhoto(null);
      onClose();
    } catch (err) {
      showError('Gagal menyimpan foto profil: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="modal-backdrop active"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-container smooth-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Modal */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
            padding: '18px 20px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Update Foto Profil</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>
              Perbarui foto identitas wajah pegawai
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          
          {/* Avatar Circle Preview (Matching Screenshot 2 & 3) */}
          <div 
            style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              padding: '4px',
              background: 'linear-gradient(135deg, #00E5FF, #00838F)',
              boxShadow: '0 8px 24px rgba(0, 131, 143, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={currentUser?.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <UserCircle size={90} color="#94A3B8" />
              )}
            </div>
          </div>

          {/* User Details */}
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>
              {currentUser?.name || 'Pegawai'}
            </h4>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
              NIP: {currentUser?.nip || '-'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#00838F', fontWeight: 700, marginTop: '2px' }}>
              {currentUser?.skpd || 'UPTD Puskesmas Cermee'}
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <input 
            type="file" 
            ref={cameraInputRef} 
            accept="image/*" 
            capture="user" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />

          {/* Photo Source Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                borderRadius: '12px',
                border: '1.5px solid #00838F',
                backgroundColor: '#E0F7FA',
                color: '#006064',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Camera size={18} />
              <span>Ambil Selfie</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Image size={18} />
              <span>Pilih Galeri</span>
            </button>
          </div>

          {/* Google Drive Hierarchy Info Note */}
          <div 
            style={{
              width: '100%',
              backgroundColor: '#F0FDFA',
              border: '1px solid #CCFBF1',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.74rem',
              color: '#0F766E',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            <Folder size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#0D9488' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#115E59' }}>Penyimpanan Google Drive:</div>
              <div style={{ marginTop: '2px', wordBreak: 'break-all' }}>
                📁 <strong>Folder Utama</strong> ➔ <strong>Profil Pegawai</strong> ➔ <code>{driveInfo.fileName}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div 
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={isProcessing || !previewPhoto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: previewPhoto ? '#00838F' : '#94A3B8',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: previewPhoto ? 'pointer' : 'not-allowed',
              boxShadow: previewPhoto ? '0 4px 12px rgba(0, 131, 143, 0.3)' : 'none'
            }}
          >
            <Check size={16} />
            <span>{isProcessing ? 'Menyimpan...' : 'Simpan Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
