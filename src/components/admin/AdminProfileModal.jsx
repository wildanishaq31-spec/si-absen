import React, { useState } from 'react';
import { 
  ShieldCheck, User, Mail, Lock, Key, Eye, EyeOff, 
  X, RotateCcw, HelpCircle, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';

export function AdminProfileModal({ isOpen, onClose }) {
  const { currentUser, updateUser } = useAuth();
  const { showToast, showConfirm, showSuccess, showError } = useAttendance();

  const [name, setName] = useState(currentUser?.name || 'Administrator SI-ABSEN');
  const [email, setEmail] = useState(currentUser?.email || 'admin@siabsen.go.id');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotSection, setShowForgotSection] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password Validation Rules
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const isNewPasswordValid = !newPassword || (hasUppercase && hasNumber && hasMinLength);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama Administrator tidak boleh kosong.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Format email tidak valid.');
      return;
    }

    if (newPassword) {
      if (!isNewPasswordValid) {
        setErrorMsg('Kata sandi baru belum memenuhi kriteria keamanan.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setIsSubmitting(true);
    const updateData = { name, email };
    if (newPassword) {
      updateData.password = newPassword;
    }

    const res = updateUser(currentUser.id, updateData);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Profil Administrator berhasil disimpan!');
      if (showSuccess) {
        showSuccess('Profil Administrator berhasil diperbarui!');
      }
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message || 'Gagal memperbarui profil.');
    }
  };

  const handleResetToDefaultPassword = () => {
    showConfirm({
      type: 'warning',
      title: 'RESET KATA SANDI ADMIN',
      message: 'Apakah Anda yakin ingin mengatur ulang kata sandi admin ke default ("admin")?',
      confirmText: 'YA, RESET',
      cancelText: 'BATAL',
      onConfirm: () => {
        const res = updateUser(currentUser.id, { password: 'admin' });
        if (res.success) {
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('Kata sandi berhasil diatur ulang menjadi default ("admin")');
          if (showSuccess) {
            showSuccess('Kata sandi di-reset ke "admin"!');
          }
        }
      }
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="auth-card-animate"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 96, 100, 0.35)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #006064 0%, #00838F 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Pengaturan Akun Administrator
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#B2EBF2' }}>
                Ubah nama, email, kata sandi & pemulihan akun
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          {errorMsg && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Profil Administrator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00838F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👤 Identitas Administrator
            </span>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Nama Lengkap Administrator
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Administrator SI-ABSEN"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Email Login Administrator
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@siabsen.go.id"
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />

          {/* Section 2: Ganti Kata Sandi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00838F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔒 Ganti Kata Sandi
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                (Kosongkan jika tidak diubah)
              </span>
            </div>

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
                  placeholder="Masukkan kata sandi baru (opsional)"
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
            </div>

            {newPassword && (
              <div className="smooth-fade-in">
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
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />

          {/* Section 3: Bantuan / Lupa Kata Sandi / Reset Recovery */}
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px 14px' }}>
            <button
              type="button"
              onClick={() => setShowForgotSection(!showForgotSection)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={16} color="#00838F" />
                <span>Bantuan & Pemulihan Lupa Kata Sandi</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#00838F' }}>
                {showForgotSection ? 'Tutup' : 'Lihat Bantuan'}
              </span>
            </button>

            {showForgotSection && (
              <div className="smooth-fade-in" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  Jika sewaktu-waktu Anda lupa kata sandi admin, Anda dapat mengatur ulang kata sandi melalui verifikasi OTP email atau menggunakan tombol reset darurat.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (typeof window !== 'undefined') {
                        window.history.pushState(null, '', '/administrator/reset-password');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    style={{
                      background: '#E0F2F1',
                      border: '1.5px solid #00838F',
                      color: '#006064',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🔑 Buka Halaman Reset Password OTP
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultPassword}
                    style={{
                      background: '#FFF',
                      border: '1.5px solid #F59E0B',
                      color: '#B45309',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={14} /> Reset Cepat ("admin")
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer / Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#475569',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #00838F, #006064)',
                border: 'none',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 131, 143, 0.3)'
              }}
            >
              {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
