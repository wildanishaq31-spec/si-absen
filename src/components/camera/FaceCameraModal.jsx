import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Check, AlertTriangle, Camera, Image, User, CreditCard } from 'lucide-react';
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const capturedSnapRef = useRef(null);

  const handleLivenessSuccess = useCallback(() => {
    // Automatically capture image on instant blink verification
    const snap = captureSnapshot();
    if (snap) {
      capturedSnapRef.current = snap;
      setPreviewImage(snap);
      setShowSuccessDialog(true);
      
      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }
  }, [captureSnapshot]);

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
      setShowSuccessDialog(false);
      capturedSnapRef.current = null;
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

  const handleConfirmSuccess = () => {
    const finalSnap = capturedSnapRef.current || previewImage;
    if (finalSnap) {
      onCaptureComplete(finalSnap);
    }
    setShowSuccessDialog(false);
    onClose();
  };

  // Manual snapshot fallback
  const handleManualSnap = () => {
    const snap = captureSnapshot();
    if (snap) {
      capturedSnapRef.current = snap;
      setPreviewImage(snap);
      setShowSuccessDialog(true);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
      } catch (e) {}
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
        capturedSnapRef.current = dataUrl;
        setPreviewImage(dataUrl);
        setShowSuccessDialog(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const employeeName = currentUser?.name || 'AGUNG SISWOYO';
  const employeeNip = currentUser?.nip || '199407312025211093';

  // Subtitle for success modal
  const successSubtitle = title.toLowerCase().includes('pulang')
    ? 'Berhasil Presensi Pulang'
    : title.toLowerCase().includes('test')
      ? 'Berhasil Presensi Mode Test'
      : 'Berhasil Presensi Masuk';

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

        {/* Circular Avatar with Blue & Red Circle Frame matching SIPP */}
        <div 
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#0F213E',
            border: '3px solid #1E3A8A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            position: 'relative'
          }}
        >
          {/* Red circular badge background */}
          <div 
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#DE3636',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {/* ASN Illustration Cartoon Avatar */}
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Head / Face */}
              <circle cx="50" cy="42" r="22" fill="#FCD34D" />
              {/* Hair */}
              <path d="M28,38 C28,24 40,16 52,16 C66,16 74,24 74,38 C70,30 60,26 48,26 C36,26 30,32 28,38 Z" fill="#3E2723" />
              {/* Winking Left Eye */}
              <path d="M38,42 Q43,36 48,42" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Right Open Eye */}
              <circle cx="58" cy="41" r="3" fill="#1F2937" />
              <circle cx="59" cy="40" r="1" fill="#FFFFFF" />
              {/* Nose */}
              <path d="M50,44 L48,48 L52,48" stroke="#D97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Confident Smile */}
              <path d="M44,52 Q50,57 56,52" stroke="#B45309" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* PNS / ASN Uniform (Khaki Tan Brown) */}
              <path d="M22,95 L22,78 C22,68 34,64 50,64 C66,64 78,68 78,78 L78,95 Z" fill="#A87948" />
              {/* Uniform Collar */}
              <path d="M42,64 L50,76 L58,64" fill="#FFFFFF" />
              <path d="M36,64 L50,78 L64,64" fill="#8C6239" />
              {/* Badge pin / Buttons */}
              <circle cx="50" cy="84" r="2" fill="#FBBF24" />
              <rect x="30" y="74" width="8" height="4" rx="1" fill="#FBBF24" />
            </svg>
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

      {/* Pop-up Dialog Sukses (Exact Match with Gambar 3 Screenshot) */}
      {showSuccessDialog && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px',
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
              animation: 'scaleUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Big Green Circle Icon with White Checkmark */}
            <div 
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: '#00C853',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(0, 200, 83, 0.4)',
                marginBottom: '16px'
              }}
            >
              <Check size={48} strokeWidth={3.5} />
            </div>

            {/* Title */}
            <h3 
              style={{
                margin: '0 0 6px 0',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#1E293B'
              }}
            >
              Sukses Absensi
            </h3>

            {/* Subtitle */}
            <p 
              style={{
                margin: '0 0 24px 0',
                fontSize: '0.88rem',
                color: '#64748B',
                fontWeight: 500
              }}
            >
              {successSubtitle}
            </p>

            {/* Full Width Green Button "✓ Ok" */}
            <button 
              onClick={handleConfirmSuccess}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#00C853',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0, 200, 83, 0.35)',
                transition: 'transform 0.1s'
              }}
            >
              <Check size={20} strokeWidth={3} /> Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
