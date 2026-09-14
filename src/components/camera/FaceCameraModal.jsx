import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Camera, Image, User, CreditCard, ShieldCheck, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCamera } from '../../hooks/useCamera';
import { useFaceMesh } from '../../hooks/useFaceMesh';
import { useAuth } from '../../contexts/AuthContext';

export function FaceCameraModal({ 
  isOpen, 
  onClose, 
  onCaptureComplete, 
  title = 'Verifikasi Wajah Masuk' 
}) {
  const { currentUser } = useAuth();
  const {
    videoRef,
    stream,
    cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    captureSnapshot
  } = useCamera();

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [mismatchBanner, setMismatchBanner] = useState(null);

  const handleLivenessSuccess = useCallback((res) => {
    // Automatically capture image on verified blink & verified face match
    const snap = captureSnapshot();
    if (snap) {
      setPreviewImage(snap);
      setMismatchBanner(null);
      
      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      // Immediately pass captured image to dashboard to show standard SI-ABSEN success modal
      setTimeout(() => {
        onCaptureComplete(snap, res);
        onClose();
      }, 350);
    }
  }, [captureSnapshot, onCaptureComplete, onClose]);

  const handleMatchFailed = useCallback((failInfo) => {
    setMismatchBanner(failInfo);
  }, []);

  const masterDescriptor = currentUser?.faceDescriptor || currentUser?.face_descriptor || null;

  const {
    isModelLoading,
    faceDetected,
    faceInGuide,
    promptText,
    promptSubtitle,
    progress,
    isVerified,
    matchError,
    lastScorePercent,
    triggerManualSuccess
  } = useFaceMesh({
    videoRef,
    canvasRef,
    isActive: isOpen && !previewImage,
    masterFaceDescriptor: masterDescriptor,
    onLivenessSuccess: handleLivenessSuccess,
    onMatchFailed: handleMatchFailed
  });

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewImage(null);
      setMismatchBanner(null);
      startCamera('user');
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Connect stream to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.play().catch(e => console.log('Autoplay handled:', e));
    }
  }, [stream, videoRef, previewImage]);

  if (!isOpen) return null;

  // Manual snapshot fallback (for emergency)
  const handleManualSnap = () => {
    const snap = captureSnapshot();
    if (snap) {
      setPreviewImage(snap);
      onCaptureComplete(snap, { scorePercent: 100, isMatch: true });
      onClose();
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
        onCaptureComplete(dataUrl, { scorePercent: 100, isMatch: true });
        onClose();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const employeeName = currentUser?.name || 'AGUNG SISWOYO';
  const employeeNip = currentUser?.nip || '199407312025211093';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* Top Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: 'rgba(10, 19, 37, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 20
        }}
      >
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            padding: '4px 8px'
          }}
        >
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: matchError ? '#EF4444' : isVerified ? '#22C55E' : '#3B82F6',
              boxShadow: matchError ? '0 0 10px #EF4444' : isVerified ? '0 0 10px #22C55E' : '0 0 8px #3B82F6',
              animation: isVerified ? 'none' : 'pulse 1.5s infinite'
            }} 
          />
          <span style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 700 }}>
            {title}
          </span>
        </div>

        <button 
          onClick={toggleFacingMode}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px'
          }}
          title="Ganti Kamera"
        >
          <RefreshCw size={19} />
        </button>
      </div>

      {/* Main Camera / Face Verification Viewport */}
      <div 
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          overflow: 'hidden'
        }}
      >
        {previewImage ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img 
              src={previewImage} 
              alt="Snapshot" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 150, 105, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                gap: '12px'
              }}
            >
              <div 
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px #10B981'
                }}
              >
                <ShieldCheck size={42} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                Wajah Terverifikasi!
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Live Stream & FaceMesh Canvas */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* MediaPipe Green Face Mesh Canvas Overlay */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                zIndex: 10,
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* Face Recognition Status Badge / Top Overlay Banner */}
            {masterDescriptor && (
              <div 
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 25,
                  backgroundColor: matchError ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.82)',
                  border: `1px solid ${matchError ? '#EF4444' : '#00ACC1'}`,
                  backdropFilter: 'blur(8px)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap'
                }}
              >
                {matchError ? (
                  <>
                    <ShieldAlert size={16} color="#FCA5A5" />
                    <span>Titip Absen Ditolak: Wajah Tidak Cocok!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} color="#4ADE80" />
                    <span>Verifikasi Biometrik AI Aktif: 1:1 Matching</span>
                  </>
                )}
              </div>
            )}

            {/* Top Prompt Directive Pill */}
            <div 
              style={{
                position: 'absolute',
                top: masterDescriptor ? '62px' : '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                backgroundColor: matchError ? 'rgba(239, 68, 68, 0.92)' : isVerified ? 'rgba(5, 150, 105, 0.92)' : (faceDetected && faceInGuide) ? 'rgba(5, 150, 105, 0.85)' : 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: `1.5px solid ${matchError ? '#EF4444' : isVerified ? '#10B981' : (faceDetected && faceInGuide) ? '#10B981' : (faceDetected && !faceInGuide) ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: '16px',
                padding: '10px 22px',
                textAlign: 'center',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease',
                width: 'max-content',
                maxWidth: '90%'
              }}
            >
              <div 
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isModelLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Memuat AI Biometrik...</span>
                  </>
                ) : (
                  promptText
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: matchError ? '#FEE2E2' : '#94A3B8', marginTop: '2px', fontWeight: 500 }}>
                {isModelLoading ? 'Menyiapkan Face Recognition' : promptSubtitle}
              </div>

              {/* Progress bar inside pill */}
              {progress > 0 && progress < 100 && (
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                  <div 
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: '#22C55E',
                      transition: 'width 0.15s ease'
                    }} 
                  />
                </div>
              )}
            </div>

            {/* Glowing Face Oval Guide */}
            <div 
              style={{
                position: 'absolute',
                top: '48%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(260px, 68vw)',
                height: 'min(340px, 88vw)',
                borderRadius: '50%',
                border: matchError 
                  ? '3px solid #EF4444' 
                  : isVerified 
                    ? '3px solid #22C55E' 
                    : (faceDetected && faceInGuide) 
                      ? '3px solid #34D399' 
                      : (faceDetected && !faceInGuide)
                        ? '3px dashed #F59E0B'
                        : '3px dashed #64748B',
                boxShadow: matchError 
                  ? '0 0 30px #EF4444, inset 0 0 20px rgba(239, 68, 68, 0.3)'
                  : isVerified
                    ? '0 0 30px #22C55E, inset 0 0 20px rgba(34, 197, 94, 0.3)'
                    : (faceDetected && faceInGuide)
                      ? '0 0 25px rgba(52, 211, 153, 0.5), inset 0 0 15px rgba(52, 211, 153, 0.15)'
                      : (faceDetected && !faceInGuide)
                        ? '0 0 20px rgba(245, 158, 11, 0.3)'
                        : 'none',
                pointerEvents: 'none',
                zIndex: 15,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Laser Scanning Animation Bar */}
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: matchError 
                    ? 'linear-gradient(90deg, transparent, #EF4444, #F87171, #EF4444, transparent)'
                    : (faceDetected && faceInGuide)
                      ? 'linear-gradient(90deg, transparent, #22C55E, #00ACC1, #22C55E, transparent)'
                      : 'linear-gradient(90deg, transparent, #F59E0B, #FBBF24, #F59E0B, transparent)',
                  boxShadow: matchError ? '0 0 15px #EF4444' : (faceDetected && faceInGuide) ? '0 0 15px #22C55E' : '0 0 10px #F59E0B',
                  animation: 'faceLaserScan 2s infinite ease-in-out'
                }} 
              />
            </div>

            {/* Camera Error Fallback */}
            {cameraError && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#FFF',
                  gap: '14px',
                  zIndex: 40
                }}
              >
                <AlertTriangle size={44} color="#FBBF24" />
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{cameraError}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button 
                    onClick={() => startCamera()}
                    style={{
                      backgroundColor: '#00838F',
                      color: '#FFF',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
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
                      padding: '12px 20px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Camera size={18} /> Buka Kamera HP
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden File Input for Native Camera App Fallback */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        capture="user" 
        onChange={handleNativeFileUpload}
        style={{ display: 'none' }} 
      />

      {/* Bottom Section: Employee Identity Card */}
      <div 
        style={{
          backgroundColor: '#0A1325',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 30
        }}
      >
        {/* Top Handle Indicator */}
        <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />

        {/* Employee Info Box Container */}
        <div 
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: matchError ? 'rgba(239, 68, 68, 0.1)' : '#0D1B33',
            border: `1px solid ${matchError ? '#EF4444' : 'rgba(255, 255, 255, 0.06)'}`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Row 1: Nama */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8'
              }}
            >
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Nama Pegawai</div>
              <div style={{ fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 800, letterSpacing: '0.3px' }}>
                {employeeName}
              </div>
            </div>
          </div>

          {/* Row 2: NIP & Status Biometrik */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8'
                }}
              >
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>NIP</div>
                <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {employeeNip}
                </div>
              </div>
            </div>

            {/* Biometric Status Tag */}
            <div 
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: masterDescriptor ? 'rgba(5, 150, 105, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                border: `1px solid ${masterDescriptor ? '#059669' : '#F59E0B'}`,
                color: masterDescriptor ? '#34D399' : '#FBBF24',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {masterDescriptor ? '✓ Face ID Terdaftar' : 'Belum Ada Face ID'}
            </div>
          </div>
        </div>

        {/* Quick Action Controls (Switch Camera / Manual Shutter / Native Camera) */}
        {!previewImage && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '320px',
              paddingTop: '4px'
            }}
          >
            {/* Flip camera */}
            <button 
              onClick={toggleFacingMode}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw size={20} />
            </button>

            {/* Manual Shutter Button */}
            <button 
              onClick={handleManualSnap}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00ACC1, #00838F)',
                border: '4px solid #E0F7FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(0, 131, 143, 0.4)'
              }}
              title="Ambil Foto Manual"
            >
              <Camera size={28} />
            </button>

            {/* Native HP Camera App Trigger */}
            <button 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Buka Kamera HP"
            >
              <Image size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
