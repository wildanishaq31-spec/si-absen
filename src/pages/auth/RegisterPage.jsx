import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  UserPlus, User, Mail, Lock, Building, CreditCard,
  ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle, LogIn
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAutoUppercase, formatAutoUnitKerja, formatAutoLowercase } from '../../utils/formatters';

export function RegisterPage({ onNavigateToLogin, onRegisterSuccess }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nip, setNip] = useState('');
  const [skpd, setSkpd] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Password validation rules
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  // Calculate score (0 to 3)
  const score = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasMinLength ? 1 : 0);
  const isPasswordValid = hasUppercase && hasNumber && hasMinLength;

  const handleSubmit = (e) => {
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

    setLoading(true);

    const result = register({
      name: name.trim(),
      email: email.trim(),
      password,
      nip: nip.trim(),
      skpd: skpd.trim()
    });

    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00838F', '#00ACC1', '#26A69A', '#10B981']
        });
      } catch (err) {}
      setRegisteredUser(result.user);
    }
  };

  // SUCCESS VIEW: Tampilan Sukses Mendaftar Akun
  if (registeredUser) {
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
            padding: '38px 28px',
            boxShadow: '0 24px 48px rgba(0, 96, 100, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '18px'
          }}
        >
          {/* Animated Success Icon */}
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
            }}
          >
            <CheckCircle2 size={46} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#00838F', margin: '0 0 6px' }}>
              Pendaftaran Akun Berhasil!
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
              Akun pegawai atas nama <strong style={{ color: '#1E293B' }}>{registeredUser.name}</strong> telah berhasil didaftarkan ke dalam sistem.
            </p>
          </div>

          {/* Email & NIP Highlight Box */}
          <div
            style={{
              backgroundColor: '#F0FDFA',
              border: '1.5px solid #99F6E4',
              borderRadius: '16px',
              padding: '16px 18px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Alamat Email Terdaftar
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#00838F', wordBreak: 'break-all' }}>
                {registeredUser.email}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#CCFBF1' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                NIP Pegawai
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#00838F', wordBreak: 'break-all' }}>
                {registeredUser.nip}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Silakan kembali ke halaman login untuk masuk menggunakan alamat <strong>Email</strong> atau <strong>NIP</strong> serta kata sandi yang telah Anda buat.
          </p>

          {/* Primary Action Button: Kembali ke Login */}
          <button
            onClick={onNavigateToLogin}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #00838F, #006064)',
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
              boxShadow: '0 4px 14px rgba(0, 131, 143, 0.35)',
              marginTop: '4px',
              transition: 'transform 0.15s ease'
            }}
          >
            <ArrowLeft size={18} /> Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00838F', margin: '0 0 4px' }}>Daftar Akun Pegawai</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Lengkapi data kepegawaian Anda untuk presensi digital</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Nama Lengkap</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(formatAutoUppercase(e.target.value))}
                placeholder="Contoh: BUDI SETIADI"
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

            {/* 3-Segment Password Strength Indicator Bar & Validation Checklist (Muncul jika kata sandi diisi/diketik) */}
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

                {/* Validation Checklist (Sesuai Gambar 2) */}
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
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0097A7, #00838F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 14px rgba(0, 151, 167, 0.3)'
            }}
          >
            {loading ? 'Mendaftarkan...' : <><UserPlus size={18} /> Daftarkan Akun</>}
          </button>
        </form>
      </div>
    </div>
  );
}
