import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, Camera, Image, User, CreditCard } from 'lucide-react';
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

  const handleLivenessSuccess = useCallback(() => {
    // Automatically capture image on verified blink
    const snap = captureSnapshot();
    if (snap) {
      setPreviewImage(snap);
      
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
        onCaptureComplete(snap);
        onClose();
      }, 350);
    }
  }, [captureSnapshot, onCaptureComplete, onClose]);

  const {
    isModelLoading,
    faceDetected,
    faceInGuide,
    promptText,
    promptSubtitle,
    progress,
    isVerified,
    triggerManualSuccess
  } = useFaceMesh({
    videoRef,
    canvasRef,
    isActive: isOpen && !previewImage,
    onLivenessSuccess: handleLivenessSuccess
  });

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewImage(null);
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

  // Manual snapshot fallback
  const handleManualSnap = () => {
    const snap = captureSnapshot();
    if (snap) {
      setPreviewImage(snap);
      onCaptureComplete(snap);
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
        onCaptureComplete(dataUrl);
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
          backgroundColor: '#000000',
          color: '#FFFFFF',
          zIndex: 30
        }}
      >
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={24} />
        </button>

        <h2 
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#FFFFFF'
          }}
        >
          {title.toUpperCase()}
        </h2>

        {/* Camera indicator */}
        <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isVerified ? '#22C55E' : '#4ADE80',
              boxShadow: '0 0 10px #22C55E'
            }} 
          />
        </div>
      </div>

      {/* Main Camera / Face Verification Viewport */}
      <div 
        style={{
          position: 'relative',
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#0B0F19'
        }}
      >
        {previewImage ? (
          /* Captured Photo Result Preview */
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img 
              src={previewImage} 
              alt="Verifikasi Wajah Berhasil"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          /* Live Stream & FaceMesh Canvas */
          <>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => {
                e.currentTarget.play().catch(console.warn);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />

            {/* MediaPipe Green Face Mesh Canvas Overlay (Precise Contours) */}
            <canvas 
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                zIndex: 10
              }}
            />

            {/* Top Prompt Floating Card ("Kedipkan Mata (Tahan 1 Detik)") */}
            <div 
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                backgroundColor: 'rgba(28, 28, 30, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                padding: '14px 20px',
                textAlign: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 20
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.3px', color: '#FFFFFF' }}>
                {promptText}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#A1A1AA', marginTop: '2px', fontWeight: 500 }}>
                {promptSubtitle}
              </div>
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
                top: '46%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '240px',
                height: '320px',
                borderRadius: '50%',
                border: isVerified 
                  ? '3px solid #22C55E' 
                  : faceDetected 
                    ? '3px solid #34D399' 
                    : '3px dashed #64748B',
                boxShadow: isVerified
                  ? '0 0 30px #22C55E, inset 0 0 20px rgba(34, 197, 94, 0.3)'
                  : faceDetected
                    ? '0 0 25px rgba(52, 211, 153, 0.5)'
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
                  background: 'linear-gradient(90deg, transparent, #22C55E, #00ACC1, #22C55E, transparent)',
                  boxShadow: '0 0 15px #22C55E',
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

      {/* Bottom Section: Employee Identity Card (Exact SIPP Screenshot Match) */}
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

        {/* Profile Avatar Circle in Bottom Card (Matching Screenshot 2) */}
        <div 
          style={{
            position: 'absolute',
            top: '-42px',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#0F213E',
            border: '3px solid #1E3A8A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
          }}
        >
          <div 
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {currentUser?.photo ? (
              <img 
                src={currentUser.photo} 
                alt={employeeName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={38} color="#94A3B8" />
            )}
          </div>
        </div>

        {/* Employee Info Box Container */}
        <div 
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#0D1B33',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
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
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Nama</div>
              <div style={{ fontSize: '0.95rem', color: '#FFFFFF', fontWeight: 800, letterSpacing: '0.3px' }}>
                {employeeName}
              </div>
            </div>
          </div>

          {/* Row 2: NIP */}
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
        </div>

        {/* Quick Action Controls (Switch Camera / Manual Snapshot / Native Camera) */}
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
