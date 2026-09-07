import React, { useState, useEffect } from 'react';
import { LogIn, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage({ initialRole = 'pegawai', onNavigateToRegister, onNavigateToResetPassword, onLoginSuccess }) {
  const { login } = useAuth();
  const [role, setRole] = useState(initialRole); // 'pegawai' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(initialRole);
    setEmail('');
    setPassword('');
  }, [initialRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await login(email, password, role);
    if (!result.success) {
      setErrorMsg(result.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(result.user);
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: isAdmin 
          ? 'linear-gradient(145deg, #052e2b 0%, #004d40 50%, #00695c 100%)' 
          : 'linear-gradient(145deg, #006064 0%, #00838F 60%, #00ACC1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        transition: 'background 0.4s ease'
      }}
    >
      <div 
        className="auth-card-animate"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: '38px 28px',
          boxShadow: '0 20px 40px rgba(0, 30, 35, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
      >
        {/* Header Branding (Murni Logo - Tanpa Fungsi Klik) */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            className="logo-float-animate logo-glow-animate"
            style={{
              width: '66px',
              height: '66px',
              borderRadius: '20px',
              background: isAdmin 
                ? 'linear-gradient(135deg, #0f766e, #0d9488)'
                : 'linear-gradient(135deg, #00838F, #00ACC1)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default',
              userSelect: 'none'
            }}
          >
            <ShieldCheck size={38} />
          </div>

          <h1 
            style={{ 
              fontSize: '1.7rem', 
              fontWeight: 800, 
              color: isAdmin ? '#00796B' : '#00838F', 
              letterSpacing: '-0.5px',
              cursor: 'default',
              userSelect: 'none',
              margin: '2px 0 0'
            }}
          >
            SI-ABSEN <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.85 }}>v5.6</span>
          </h1>

          {isAdmin ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                backgroundColor: '#CCFBF1', 
                color: '#0f766e', 
                fontSize: '0.78rem', 
                fontWeight: 800, 
                padding: '5px 14px', 
                borderRadius: '20px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                🛡️ PORTAL ADMINISTRATOR
              </span>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                Monitoring & Rekapitulasi Presensi Super Admin
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
              Sistem Informasi Presensi PPPKPW
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              {isAdmin ? 'Email Administrator' : 'Email / NIP'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdmin ? "admin@siabsen.go.id" : "email@gmail.com atau NIP"}
                required
                style={{ 
                  width: '100%', 
                  padding: '11px 14px 11px 40px', 
                  borderRadius: '10px', 
                  border: '1px solid #CBD5E1', 
                  fontSize: '0.9rem', 
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%', 
                  padding: '11px 14px 11px 40px', 
                  borderRadius: '10px', 
                  border: '1px solid #CBD5E1', 
                  fontSize: '0.9rem', 
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: isAdmin 
                ? 'linear-gradient(135deg, #00796B, #004D40)' 
                : 'linear-gradient(135deg, #0097A7, #00838F)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: isAdmin 
                ? '0 4px 14px rgba(0, 121, 107, 0.35)' 
                : '0 4px 14px rgba(0, 151, 167, 0.3)',
              marginTop: '6px',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Memproses...' : <><LogIn size={18} /> {isAdmin ? 'Masuk Portal Admin' : 'Masuk Sekarang'}</>}
          </button>
        </form>

        {/* Footer info: Registration link only for Pegawai, Reset Password link for Admin */}
        {!isAdmin ? (
          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', paddingTop: '4px' }}>
            Belum memiliki akun pegawai?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              style={{ background: 'transparent', border: 'none', color: '#00838F', fontWeight: 700, cursor: 'pointer' }}
            >
              Daftar di sini
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748B', paddingTop: '4px' }}>
            Lupa kata sandi administrator?{' '}
            <button
              type="button"
              onClick={onNavigateToResetPassword}
              style={{ background: 'transparent', border: 'none', color: '#00796B', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset di sini
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
