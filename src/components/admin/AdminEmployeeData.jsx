import React, { useState } from 'react';
import { Pencil, Trash2, UserPlus, Check, X, Shield, Key, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { formatAutoUppercase, formatAutoUnitKerja, formatAutoLowercase } from '../../utils/formatters';

export function AdminEmployeeData() {
  const { users, register, updateUser, deleteUser, currentUser } = useAuth();
  const { showConfirm, showSuccess, showToast } = useAttendance();
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', nip: '', skpd: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Hanya tampilkan data pegawai
  const employeeUsers = users.filter(u => u.role === 'pegawai');

  // Password validation rules (sama persis dengan form pegawai)
  const password = createForm.password || '';
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const score = (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0) + (hasMinLength ? 1 : 0);
  const isPasswordValid = hasUppercase && hasNumber && hasMinLength;

  const handleEditClick = (user) => {
    setIsEditing(user.id);
    setEditForm({ ...user });
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
    setErrorMsg('');
  };

  const handleSaveEdit = (userId) => {
    // Validate NIP doesn't belong to someone else
    const nipExists = users.some(u => u.nip === editForm.nip && u.id !== userId);
    if (nipExists) {
      setErrorMsg('NIP sudah terdaftar pada pengguna lain.');
      return;
    }
    
    // Validate Email doesn't belong to someone else
    const emailExists = users.some(u => u.email.toLowerCase() === editForm.email.toLowerCase() && u.id !== userId);
    if (emailExists) {
      setErrorMsg('Email sudah terdaftar pada pengguna lain.');
      return;
    }

    updateUser(userId, editForm);
    setIsEditing(null);
    setErrorMsg('');
    showSuccess(`Data pegawai ${editForm.name} berhasil diperbarui!`);
  };

  const handleDelete = (userId, name) => {
    showConfirm({
      type: 'warning',
      title: 'KONFIRMASI HAPUS',
      message: `Yakin ingin menghapus akun pegawai ${name}?\n\nRiwayat absensi sebelumnya tetap tersimpan di rekap.`,
      confirmText: 'YA, HAPUS',
      cancelText: 'BATAL',
      onConfirm: () => {
        deleteUser(userId);
        showSuccess(`Akun pegawai ${name} berhasil dihapus.`);
      }
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Kata sandi belum memenuhi kriteria keamanan (minimal 8 karakter, 1 huruf besar, dan 1 angka).');
      return;
    }
    
    const result = register(createForm);
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      const newName = createForm.name;
      setIsCreating(false);
      setCreateForm({ name: '', email: '', nip: '', skpd: '', password: '' });
      setShowPassword(false);
      showSuccess(`Akun pegawai ${newName} berhasil didaftarkan!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00838F' }}>Pengelolaan Data Pegawai</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Total: {employeeUsers.length} Pegawai Terdaftar</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          style={{
            background: '#059669', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px',
            fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          {isCreating ? <><X size={16}/> Batal</> : <><UserPlus size={16}/> Tambah Pegawai</>}
        </button>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {isCreating && (
        <div className="table-card" style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#00838F' }}>Daftarkan Pegawai Baru</h3>
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Nama Lengkap</label>
                <input required type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: formatAutoUppercase(e.target.value)})} placeholder="Nama Lengkap" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>NIP</label>
                <input required type="text" value={createForm.nip} onChange={e => setCreateForm({...createForm, nip: e.target.value.replace(/[^0-9]/g, '')})} placeholder="NIP" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>SKPD / Unit</label>
                <input required type="text" value={createForm.skpd} onChange={e => setCreateForm({...createForm, skpd: formatAutoUnitKerja(e.target.value)})} placeholder="Contoh: UPTD Puskesmas Cermee" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Email</label>
                <input required type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: formatAutoLowercase(e.target.value)})} placeholder="email@gmail.com" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', textTransform: 'lowercase' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Kata Sandi</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={createForm.password} 
                    onChange={e => setCreateForm({...createForm, password: e.target.value})} 
                    placeholder="Minimal 8 karakter"
                    style={{ width: '100%', padding: '8px 34px 8px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3-Segment Password Strength Indicator Bar & Validation Checklist (Muncul jika kata sandi diisi/diketik) */}
            {password.length > 0 && (
              <div className="smooth-fade-in" style={{ backgroundColor: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', maxWidth: '300px' }}>
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

                <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', marginBottom: '6px' }}>
                  {score === 3 ? (
                    <span style={{ color: '#10B981' }}>✓ Kata sandi kuat dan aman.</span>
                  ) : (
                    <span>Kriteria keamanan kata sandi:</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: hasUppercase ? '#10B981' : '#94A3B8', fontWeight: hasUppercase ? 600 : 400 }}>
                    {hasUppercase ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Minimal 1 huruf besar (Uppercase)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: hasNumber ? '#10B981' : '#94A3B8', fontWeight: hasNumber ? 600 : 400 }}>
                    {hasNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Minimal 1 angka</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: hasMinLength ? '#10B981' : '#94A3B8', fontWeight: hasMinLength ? 600 : 400 }}>
                    {hasMinLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>Minimal 8 karakter</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              <button type="submit" style={{ background: '#00838F', color: '#FFF', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 2px 6px rgba(0, 131, 143, 0.3)' }}>
                Simpan Akun
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th>Nama & NIP</th>
                <th>SKPD</th>
                <th>Email</th>
                <th>Password</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employeeUsers.map(user => (
                <tr key={user.id}>
                  {isEditing === user.id ? (
                    <>
                      <td>
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: formatAutoUppercase(e.target.value)})} style={{ width: '100%', marginBottom: '4px', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', textTransform: 'uppercase' }} />
                        <input type="text" value={editForm.nip} onChange={e => setEditForm({...editForm, nip: e.target.value.replace(/[^0-9]/g, '')})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1' }} placeholder="NIP" />
                      </td>
                      <td>
                        <input type="text" value={editForm.skpd} onChange={e => setEditForm({...editForm, skpd: formatAutoUnitKerja(e.target.value)})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                      </td>
                      <td>
                        <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: formatAutoLowercase(e.target.value)})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', textTransform: 'lowercase' }} />
                      </td>
                      <td>
                        <input type="text" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleSaveEdit(user.id)} style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={14} /> Simpan
                          </button>
                          <button onClick={handleCancelEdit} style={{ background: '#64748B', color: '#FFF', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <X size={14} /> Batal
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>{user.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{user.nip}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{user.skpd}</td>
                      <td style={{ fontSize: '0.85rem' }}>{user.email}</td>
                      <td style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Key size={12}/> ••••••••
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEditClick(user)} style={{ background: '#F1F5F9', color: '#00838F', border: '1px solid #CBD5E1', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(user.id, user.name)} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
