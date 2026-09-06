import React, { useEffect, useState, useRef } from 'react';
import { Camera, RefreshCw, X, Check, AlertTriangle, Scan, ShieldCheck, Image, Sparkles } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

export function FaceCameraModal({ isOpen, onClose, onCaptureComplete, title = 'Verifikasi Wajah' }) {
  const {
    videoRef,
    stream,
    isReady,
    cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    captureSnapshot
  } = useCamera();

  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewImage(null);
      setScanProgress(0);
      startCamera('user');
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  // Connect stream to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log('Autoplay handled:', e));
    }
  }, [stream, videoRef]);

  // Simulate Biometric Scanning effect
  useEffect(() => {
    if (isOpen && !previewImage) {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 100 : prev + 25));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isOpen, previewImage]);

  if (!isOpen) return null;

  const handleTakeSnap = () => {
    const snap = captureSnapshot();
    if (snap) {
      setPreviewImage(snap);
      stopCamera();
    }
  };

  const handleNativeFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 640, 640);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImage(dataUrl);
        stopCamera();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setScanProgress(0);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!previewImage) return;
    setSubmitting(true);
    setTimeout(() => {
      onCaptureComplete(previewImage);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet" style={{ maxHeight: '95vh' }}>
        <div className="modal-drag-indicator" />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00838F' }}>
              <Scan size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00838F', margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Posisikan wajah Anda tepat di dalam lingkaran panduan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} color="#475569" />
          </button>
        </div>

        {/* Camera Feed or Captured Preview */}
        <div className="camera-view-container" style={{ position: 'relative', height: '360px', borderRadius: '20px', overflow: 'hidden', background: '#0F172A' }}>
          {previewImage ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img 
                src={previewImage} 
                alt="Hasil Verifikasi Wajah" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(6, 95, 70, 0.85)', backdropFilter: 'blur(4px)', color: '#FFF', padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                <ShieldCheck size={18} color="#34D399" />
                <span>Wajah Berhasil Terverifikasi</span>
              </div>
            </div>
          ) : (
            <>
              {/* Video Element */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }} 
              />

              {/* Face Oval Guideline Overlay */}
              <div className="face-oval-guide" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '260px',
                border: '3px dashed #34D399',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Laser Scanning Animation Bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #22C55E, #00ACC1, #22C55E, transparent)',
                  boxShadow: '0 0 15px #22C55E',
                  animation: 'faceLaserScan 2s infinite ease-in-out'
                }} />
              </div>

              {/* Status Header Badge on Camera */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                color: '#FFF',
                padding: '6px 14px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.15)',
                zIndex: 10
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                <span>{scanProgress >= 100 ? '✨ Wajah Terdeteksi (Siap Foto)' : 'Memindai Biometrik...'}</span>
              </div>

              {/* Camera Error Fallback Message */}
              {cameraError && (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#FFF',
                    gap: '14px',
                    zIndex: 20
                  }}
                >
                  <AlertTriangle size={40} color="#FBBF24" />
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{cameraError}</p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => startCamera()}
                      style={{
                        backgroundColor: '#00838F',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Coba Lagi
                    </button>

                    <button 
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Camera size={16} /> Buka Kamera HP
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden File Input for Native HP Camera Direct Fallback */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          capture="user" 
          onChange={handleNativeFileUpload}
          style={{ display: 'none' }} 
        />

        {/* Action Controls */}
        {previewImage ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px' }}>
            <button
              onClick={handleRetake}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#334155',
                padding: '13px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} /> Foto Ulang
            </button>

            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                background: 'linear-gradient(135deg, #0097A7, #00838F)',
                border: 'none',
                color: '#FFFFFF',
                padding: '13px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 151, 167, 0.35)'
              }}
            >
              {submitting ? 'Menyimpan Presensi...' : <><Check size={20} /> Konfirmasi & Absen</>}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 0 12px' }}>
            {/* Toggle Camera (Front / Back) */}
            <button 
              className="icon-btn" 
              onClick={toggleFacingMode} 
              title="Ganti Kamera Depan/Belakang"
              style={{ width: '46px', height: '46px' }}
            >
              <RefreshCw size={20} />
            </button>

            {/* Big Shutter Snapshot Button */}
            <button 
              onClick={handleTakeSnap}
              title="Ambil Foto Verifikasi Wajah"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00ACC1, #00838F)',
                border: '5px solid #E0F7FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0, 131, 143, 0.35)',
                transition: 'transform 0.15s'
              }}
            >
              <Camera size={34} />
            </button>

            {/* Native HP Camera App / Gallery Trigger */}
            <button 
              className="icon-btn" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()} 
              title="Buka Kamera Bawaan HP"
              style={{ width: '46px', height: '46px' }}
            >
              <Image size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
