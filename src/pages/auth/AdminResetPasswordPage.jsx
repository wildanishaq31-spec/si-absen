import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ArrowLeft, Mail, Lock, Key, Eye, EyeOff, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Send, Check, Copy 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { storageService } from '../../services/storage';

export function AdminResetPasswordPage({ onNavigateToLogin }) {
  const { updateUser } = useAuth();

  // Multi-step state: 1 (Email), 2 (OTP), 3 (New Password), 4 (Success)
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState('');
  const [targetUser, setTargetUser] = useState(null);
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password validation rules (sama seperti di pegawai)
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const score = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasMinLength ? 1 : 0);
  const isPasswordValid = hasUppercase && hasNumber && hasMinLength;

  // Status & Timing states
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Generate 6-digit OTP
  const createOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // STEP 1: Send OTP to Email
  const handleSendOtp = (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Harap masukkan alamat email administrator.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const allUsers = storageService.getUsers();
      const found = allUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!found) {
        setErrorMsg('Email tidak ditemukan dalam sistem database administrator.');
        setLoading(false);
        return;
      }

      // Check if user is administrator (or allow any user reset)
      const newOtp = createOtp();
      setGeneratedOtp(newOtp);
      setTargetUser(found);
      setResendCooldown(60);
      setLoading(false);
      setStep(2);
      setErrorMsg('');
    }, 600);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const newOtp = createOtp();
    setGeneratedOtp(newOtp);
    setResendCooldown(60);
    setErrorMsg('');
    setOtpInput(['', '', '', '', '', '']);
  };

  // Handle OTP Box Input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // If user pasted a multi-digit code
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otpInput];
      pastedDigits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpInput(updated);
      const nextFocus = Math.min(pastedDigits.length, 5);
      const nextEl = document.getElementById(`otp-box-${nextFocus}`);
      if (nextEl) nextEl.focus();
      return;
    }

    const cleanValue = value.replace(/\D/g, '');
    const updated = [...otpInput];
    updated[index] = cleanValue;
    setOtpInput(updated);

    if (cleanValue && index < 5) {
      const nextEl = document.getElementById(`otp-box-${index + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevEl = document.getElementById(`otp-box-${index - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const enteredOtp = otpInput.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Harap lengkapi 6 digit kode OTP verifikasi.');
      return;
    }

    if (enteredOtp !== generatedOtp) {
      setErrorMsg('Kode OTP yang Anda masukkan salah atau tidak sesuai.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 500);
  };

  // STEP 3: Update Password
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Kata sandi belum memenuhi kriteria keamanan (minimal 8 karakter, 1 huruf besar, dan 1 angka).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = updateUser(targetUser.id, { password: newPassword });
      setLoading(false);

      if (res.success) {
        setStep(4);
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui kata sandi.');
      }
    }, 600);
  };

  const handleCopyDemoOtp = () => {
    if (generatedOtp) {
      navigator.clipboard?.writeText(generatedOtp);
      const updated = generatedOtp.split('');
      setOtpInput(updated);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2500);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #004D40 0%, #00796B 50%, #004D40 100%)',
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
          maxWidth: '460px',
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: '36px 28px',
          boxShadow: '0 24px 48px rgba(0, 30, 25, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
      >
        {/* Back to Login Button */}
        {step !== 4 && (
          <button
            type="button"
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
              alignSelf: 'flex-start',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Login Administrator
          </button>
        )}

        {/* Header Branding */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            className="logo-float-animate logo-glow-animate"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #00796B, #004D40)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={36} />
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#00796B', margin: '2px 0 0' }}>
            Pemulihan Kata Sandi
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Portal Administrator SI-ABSEN
          </p>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                style={{
                  width: step === s ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: step >= s ? '#00796B' : '#CBD5E1',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================
            STEP 1: INPUT EMAIL
           ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="smooth-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Email Administrator
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@siabsen.go.id"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontWeight: 500
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '6px' }}>
                Masukkan alamat email yang Anda gunakan sebelumnya untuk menerima 6-digit kode OTP.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00796B, #004D40)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 121, 107, 0.35)',
                transition: 'transform 0.15s ease'
              }}
            >
              {loading ? (
                <>Mengirim OTP...</>
              ) : (
                <><Send size={16} /> Kirim Kode OTP ke Email</>
              )}
            </button>
          </form>
        )}

        {/* ========================================================
            STEP 2: INPUT OTP CODE
           ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="smooth-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>
                Masukkan Kode Verifikasi OTP
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                Kode 6-digit telah dikirim ke <strong style={{ color: '#00796B' }}>{email}</strong>
              </p>
            </div>

            {/* OTP Boxes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {otpInput.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-box-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '52px',
                    textAlign: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#00796B',
                    borderRadius: '12px',
                    border: digit ? '2px solid #00796B' : '1.5px solid #CBD5E1',
                    backgroundColor: digit ? '#E0F2F1' : '#F8FAFC',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>

            {/* Demo / Simulated Email Notification Banner */}
            <div style={{ backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f766e' }}>
                  📬 Simulasi Notifikasi Email Masuk
                </div>
                <div style={{ fontSize: '0.75rem', color: '#115e59' }}>
                  Kode OTP Anda: <strong style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>{generatedOtp}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyDemoOtp}
                style={{
                  background: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedOtp ? <><Check size={12}/> Terisi</> : <><Copy size={12}/> Isi Otomatis</>}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00796B, #004D40)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 121, 107, 0.35)'
              }}
            >
              {loading ? 'Memverifikasi...' : <><CheckCircle2 size={16}/> Verifikasi Kode OTP</>}
            </button>

            {/* Resend Cooldown */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
              Belum menerima kode?{' '}
              {resendCooldown > 0 ? (
                <span style={{ fontWeight: 700, color: '#00796B' }}>
                  Kirim ulang ({resendCooldown}s)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: '#00796B', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Kirim Ulang OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* ========================================================
            STEP 3: CREATE NEW PASSWORD
           ======================================================== */}
        {step === 3 && (
          <form onSubmit={handleUpdatePassword} className="smooth-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#059669" />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065F46' }}>
                  OTP Berhasil Terverifikasi!
                </div>
                <div style={{ fontSize: '0.74rem', color: '#047857' }}>
                  Silakan buat kata sandi baru untuk akun {email}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Kata Sandi Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* 3-Segment Password Strength Indicator Bar & Validation Checklist (Muncul jika kata sandi diisi/diketik) */}
              {newPassword.length > 0 && (
                <div className="smooth-fade-in">
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

                  {/* Validation Checklist */}
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.78rem'
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
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Konfirmasi Kata Sandi Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00796B, #004D40)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 121, 107, 0.35)',
                marginTop: '4px'
              }}
            >
              {loading ? 'Menyimpan Kata Sandi...' : <><Lock size={16} /> Update Kata Sandi</>}
            </button>
          </form>
        )}

        {/* ========================================================
            STEP 4: SUCCESS STATE
           ======================================================== */}
        {step === 4 && (
          <div className="smooth-fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={44} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065F46', margin: '0 0 6px' }}>
                Kata Sandi Berhasil Diperbarui!
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Kata sandi untuk akun administrator <strong style={{ color: '#00796B' }}>{email}</strong> telah berhasil diperbarui. Silakan login kembali dengan kata sandi baru Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00796B, #004D40)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 121, 107, 0.35)',
                marginTop: '8px'
              }}
            >
              <ArrowLeft size={16} /> Masuk ke Portal Administrator
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
