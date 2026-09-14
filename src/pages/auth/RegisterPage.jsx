import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserPlus, User, Mail, Lock, Building, CreditCard,
  ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, LogIn,
  Camera, RefreshCw, ShieldCheck, Sparkles, Check, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCamera } from '../../hooks/useCamera';
import { useFaceMesh } from '../../hooks/useFaceMesh';
import { formatAutoUppercase, formatAutoUnitKerja, formatAutoLowercase } from '../../utils/formatters';

export function RegisterPage({ onNavigateToLogin, onRegisterSuccess }) {
  const { register } = useAuth();
  
  // Step State: 1 = Form, 2 = Face Enrollment Camera, 3 = Completed
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nip, setNip] = useState('');
  const [skpd, setSkpd] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Biometric Enrollment State
  const [enrolledPhoto, setEnrolledPhoto] = useState(null);
  const [enrolledDescriptor, setEnrolledDescriptor] = useState(null);

  // Camera & FaceMesh hooks for Step 2
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

  // Password validation rules
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const score = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasMinLength ? 1 : 0);
  const isPasswordValid = hasUppercase && hasNumber && hasMinLength;

  // Handle Enrollment Success from hook
  const handleEnrollmentSuccess = useCallback((result) => {
    const snap = captureSnapshot();
    if (snap) {
      setEnrolledPhoto(snap);
      setEnrolledDescriptor(result.descriptor);
      
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#00838F', '#10B981', '#34D399']
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
    isVerified
  } = useFaceMesh({
    videoRef,
    canvasRef,
    isActive: currentStep === 2 && !enrolledPhoto,
    isEnrollment: true,
    onLivenessSuccess: handleEnrollmentSuccess
  });

  // Start / Stop camera based on step
  useEffect(() => {
    if (currentStep === 2) {
      startCamera('user');
    } else {
      stopCamera();
    }
  }, [currentStep]);

  // Connect stream to video
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
  }, [stream, videoRef, currentStep, enrolledPhoto]);

  // STEP 1 VALIDATION & PROCEED TO STEP 2
  const handleProceedToFaceCapture = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!nip.trim()) {
      setErrorMsg('NIP / Nomor Identitas Pegawai wajib diisi.');
      return;
    }
    if (!skpd.trim()) {
      setErrorMsg('SKPD / Unit Kerja wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Alamat email valid wajib diisi.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Kata sandi belum memenuhi kriteria keamanan (minimal 8 karakter, 1 huruf besar, dan 1 angka).');
      return;
    }

    setEnrolledPhoto(null);
    setEnrolledDescriptor(null);
    setCurrentStep(2);
  };

  // STEP 2: MANUAL SNAPSHOT FALLBACK
  const handleManualEnrollSnap = () => {
    const snap = captureSnapshot();
    if (snap) {
      setEnrolledPhoto(snap);
      setEnrolledDescriptor(null); // Fallback descriptor
    }
  };

  const handleRetakeFace = () => {
    setEnrolledPhoto(null);
    setEnrolledDescriptor(null);
  };

  // FINAL SUBMIT (Register with Biodata + Face Biometrics)
  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        nip: nip.trim(),
        skpd: skpd.trim(),
        photo: enrolledPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        faceDescriptor: enrolledDescriptor || null
      });

      setLoading(false);

      if (!result.success) {
        setErrorMsg(result.message);
        setCurrentStep(1);
      } else {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00838F', '#00ACC1', '#26A69A', '#10B981']
          });
        } catch (err) {}
        setRegisteredUser(result.user);
        setCurrentStep(3);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Terjadi kesalahan pendaftaran: ' + (err.message || 'Silakan coba lagi.'));
      setCurrentStep(1);
    }
  };

  // ==========================================
  // VIEW 3: SUCCESS VIEW
  // ==========================================
  if (currentStep === 3 && registeredUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #006064 0%, #00838F 60%, #00ACC1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div
          className="auth-card-animate"
          style={{
            width: '100%',
            maxWidth: '440px',
            background: '#FFFFFF',
            borderRadius: '28px',
            padding: '36px 26px',
            boxShadow: '0 24px 48px rgba(0, 96, 100, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          {/* User Enrolled Photo with Green Success Ring */}
          <div style={{ position: 'relative', width: '92px', height: '92px' }}>
            <div
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                backgroundColor: '#ECFDF5',
                border: '4px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              {registeredUser.photo ? (
                <img src={registeredUser.photo} alt={registeredUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} color="#059669" />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF'
              }}
            >
              <Check size={16} strokeWidth={3} />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00838F', margin: '0 0 6px' }}>
              Pendaftaran & Face ID Berhasil!
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
              Akun pegawai atas nama <strong style={{ color: '#1E293B' }}>{registeredUser.name}</strong> telah terdaftar dengan master Face Recognition.
            </p>
          </div>

          {/* Biometric Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#065F46',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            <span>Master Biometrik Wajah Aktif (1:1 Anti-Titip Absen)</span>
          </div>

          {/* Email & NIP Highlight Box */}
          <div
            style={{
              backgroundColor: '#F0FDFA',
              border: '1.5px solid #99F6E4',
              borderRadius: '16px',
              padding: '14px 16px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Alamat Email Terdaftar
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#00838F', wordBreak: 'break-all' }}>
                {registeredUser.email}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#CCFBF1' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                NIP Pegawai
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#00838F', wordBreak: 'break-all' }}>
                {registeredUser.nip}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
            Saat melakukan absensi harian, kamera akan otomatis mencocokkan wajah Anda dengan foto profil master ini.
          </p>

          {/* Primary Action Button: Buka Dashboard Langsung */}
          <button
            onClick={() => {
              if (onRegisterSuccess) onRegisterSuccess();
              else if (onNavigateToLogin) onNavigateToLogin();
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontWeight: 800,
              fontSize: '0.94rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.35)',
              marginTop: '4px'
            }}
          >
            <LogIn size={18} /> Buka Dashboard Presensi Sekarang
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: FACE ENROLLMENT CAMERA
  // ==========================================
  if (currentStep === 2) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#090D16',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#0F172A',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Bar Header */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#0B132B'
            }}
          >
            <button
              onClick={() => setCurrentStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px' }}>
              LANGKAH 2 DARI 2
            </div>
          </div>

          {/* Title Instructions */}
          <div style={{ padding: '16px 20px 8px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', margin: '0 0 4px' }}>
              Perekaman Master Wajah Pegawai
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              Arahkan wajah lurus ke lingkaran dan <strong>kedipkan mata 1x</strong> untuk merekam biometrik <strong>{name}</strong>.
            </p>
          </div>

          {/* Viewport: Live Camera OR Captured Preview */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '350px',
              backgroundColor: '#000000',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {enrolledPhoto ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={enrolledPhoto} alt="Enrolled Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: '#FFF'
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 25px #10B981'
                    }}
                  >
                    <ShieldCheck size={36} />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Master Wajah Siap Digunakan!</span>
                </div>
              </div>
            ) : (
              <>
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

                {/* Directive Pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 20,
                    backgroundColor: (faceDetected && faceInGuide) ? 'rgba(5, 150, 105, 0.85)' : 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: `1.5px solid ${(faceDetected && faceInGuide) ? '#10B981' : (faceDetected && !faceInGuide) ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '14px',
                    padding: '8px 18px',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
                    width: 'max-content',
                    maxWidth: '90%'
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isModelLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Memuat AI Biometrik...</span>
                      </>
                    ) : (
                      promptText
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                    {promptSubtitle}
                  </div>
                  {progress > 0 && progress < 100 && (
                    <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#22C55E', transition: 'width 0.15s ease' }} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div style={{ padding: '16px 20px 20px', backgroundColor: '#0B132B', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {enrolledPhoto ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleRetakeFace}
                  style={{
                    flex: 1,
                    backgroundColor: '#1E293B',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={16} /> Foto Ulang
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSubmit}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  {loading ? 'Mendaftarkan Akun...' : <><UserPlus size={18} /> Selesaikan & Daftarkan</>}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Ganti Kamera"
                >
                  <RefreshCw size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleManualEnrollSnap}
                  style={{
                    flex: 1,
                    backgroundColor: '#00838F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={18} /> Ambil Foto Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: FORM INPUT BIODATA PEGAWAI
  // ==========================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #006064 0%, #00838F 60%, #00ACC1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="auth-register-animate"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '30px 24px',
          boxShadow: '0 20px 40px rgba(0, 96, 100, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        <button
          onClick={onNavigateToLogin}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Login
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00838F', margin: '0 0 4px' }}>Daftar Akun Pegawai</h2>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#00838F', backgroundColor: '#E0F7FA', padding: '3px 8px', borderRadius: '8px' }}>
              Langkah 1/2
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Lengkapi data kepegawaian Anda untuk presensi digital</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleProceedToFaceCapture} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(formatAutoUppercase(e.target.value))}
                placeholder="CONTOH: BUDI SETIADI"
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NIP / Nomor Identitas Pegawai</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Contoh: 199XXXXXXXXXXXXXXX"
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>SKPD / Unit Kerja</label>
            <div style={{ position: 'relative' }}>
              <Building size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={skpd}
                onChange={(e) => setSkpd(formatAutoUnitKerja(e.target.value))}
                placeholder="Contoh: UPTD Puskesmas Cermee"
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(formatAutoLowercase(e.target.value))}
                placeholder="email@gmail.com"
                required
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none', textTransform: 'lowercase' }}
              />
            </div>
          </div>

          {/* Password with Strength Meter & Validation Checklist */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: score >= 1 ? (score === 1 ? '#EF4444' : score === 2 ? '#F59E0B' : '#10B981') : '#E2E8F0',
                    transition: 'background-color 0.2s ease'
                  }} />
                  <div style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: score >= 2 ? (score === 2 ? '#F59E0B' : '#10B981') : '#E2E8F0',
                    transition: 'background-color 0.2s ease'
                  }} />
                  <div style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: score === 3 ? '#10B981' : '#E2E8F0',
                    transition: 'background-color 0.2s ease'
                  }} />
                </div>

                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.78rem',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    {score === 3 ? (
                      <span style={{ color: '#10B981' }}>✓ Kata sandi kuat dan aman.</span>
                    ) : (
                      <span>Kriteria keamanan kata sandi:</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUppercase ? '#10B981' : '#94A3B8', fontWeight: hasUppercase ? 600 : 400 }}>
                      {hasUppercase ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Minimal 1 huruf besar (Uppercase)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#10B981' : '#94A3B8', fontWeight: hasNumber ? 600 : 400 }}>
                      {hasNumber ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Minimal 1 angka</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#10B981' : '#94A3B8', fontWeight: hasMinLength ? 600 : 400 }}>
                      {hasMinLength ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Minimal 8 karakter</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #0097A7, #00838F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontWeight: 800,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 14px rgba(0, 151, 167, 0.3)'
            }}
          >
            <span>Lanjut Perekaman Wajah (Face ID)</span>
            <Camera size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
