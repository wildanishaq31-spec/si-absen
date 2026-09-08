import React, { useState } from 'react';
import { 
  ShieldAlert, User, Mail, Lock, Key, Eye, EyeOff, 
  CheckCircle2, XCircle, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';

export function AdminForceSetupModal({ isOpen }) {
  const { currentUser, updateUser } = useAuth();
  const { showToast, triggerSuccessAnimation } = useAttendance();

  const [name, setName] = useState(currentUser?.name || 'Administrator SI-ABSEN');
  const [email, setEmail] = useState(currentUser?.email || 'admin@siabsen.go.id');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation rules (sama seperti di pegawai)
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const score = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasMinLength ? 1 : 0);
  const isPasswordValid = hasUppercase && hasNumber && hasMinLength;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama administrator tidak boleh kosong.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Email administrator tidak boleh kosong.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Kata sandi baru wajib diisi.');
      return;
    }

    if (newPassword.toLowerCase() === 'admin') {
      setErrorMsg('Kata sandi baru tidak boleh menggunakan kata sandi default ("admin"). Gunakan kata sandi yang lebih aman.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Kata sandi belum memenuhi kriteria keamanan (minimal 8 karakter, 1 huruf besar, dan 1 angka).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);

    const updatePayload = {
      name: name.trim(),
      email: email.trim(),
      password: newPassword
    };

    try {
      const res = await updateUser(currentUser.id, updatePayload);
      setLoading(false);

      if (res.success) {
        if (triggerSuccessAnimation) triggerSuccessAnimation();
        if (showToast) {
          showToast('🎉 Akun Administrator berhasil diamankan & dienkripsi! Kredensial telah disinkronkan ke Vercel Postgres.', 'success');
        }
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui data akun.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Gagal memperbarui akun: ' + err.message);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
    >
      <div 
        className="auth-card-animate"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '2px solid #F59E0B',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #B45309 0%, #D97706 60%, #F59E0B 100%)',
          padding: '24px 24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#FFFFFF'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={28} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
              ⚠️ Proteksi Keamanan Wajib
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Setup Akun Administrator
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '82vh', overflowY: 'auto' }}>
          
          {/* Explanation Alert */}
          <div style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.82rem', color: '#92400E', margin: 0, lineHeight: 1.45 }}>
              Akun Anda saat ini masih menggunakan kata sandi bawaan default (<strong>admin</strong>). Demi mencegah peretasan dan pengamanan data presensi, silakan tentukan <strong>Email & Kata Sandi Baru</strong> milik Anda.
            </p>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {/* Section 1: Profil Admin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00838F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. Identitas Akun
            </span>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Nama Administrator
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Admin Puskesmas Cermee"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Email Administrator Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.pkm@gmail.com"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '2px 0' }} />

          {/* Section 2: Kata Sandi Baru */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00838F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              2. Buat Kata Sandi Baru (Wajib)
            </span>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Kata Sandi Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
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
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Konfirmasi Kata Sandi Baru
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
              marginTop: '8px'
            }}
          >
            {loading ? 'Mengamankan Akun...' : <><Lock size={16} /> 🔒 Simpan & Amankan Akun Administrator</>}
          </button>
        </form>
      </div>
    </div>
  );
}
