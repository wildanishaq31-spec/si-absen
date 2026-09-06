import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, AlertTriangle, FileText, ExternalLink, X, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../contexts/AttendanceContext';
import { buildWeeklyRecap } from '../../services/attendanceCore';
import { WEEKLY_TARGET_HOURS } from '../../utils/constants';

export function UserHistoryModal({ isOpen, onClose }) {
  const { currentUser, users } = useAuth();
  const { records } = useAttendance();
  const [activeTab, setActiveTab] = useState('LOGS'); // 'LOGS' or 'WEEKLY_TARGET'

  if (!isOpen || !currentUser) return null;

  const userRecords = records.filter(
    r => r.email === currentUser.email || r.userName === currentUser.name
  );

  const weeklyRecap = buildWeeklyRecap(users, records);
  const myWeeklySummaries = weeklyRecap.map(w => {
    const summary = w.users.find(u => u.user.email === currentUser.email) || {};
    return {
      weekKey: w.key,
      weekLabel: w.label,
      totalHours: summary.totalHours || 0,
      isTargetMet: summary.isTargetMet || false,
      targetDifference: summary.targetDifference || 0,
      details: summary.dailyDetails || []
    };
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-indicator" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00838F' }}>Riwayat & Rekap Jam Kerja</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>{currentUser.name} - {currentUser.skpd}</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('LOGS')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'LOGS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'LOGS' ? '#00838F' : '#64748B',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: activeTab === 'LOGS' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            Log Presensi Terkini
          </button>
          <button
            onClick={() => setActiveTab('WEEKLY_TARGET')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'WEEKLY_TARGET' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'WEEKLY_TARGET' ? '#00838F' : '#64748B',
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: activeTab === 'WEEKLY_TARGET' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            Target 41 Jam / Minggu
          </button>
        </div>

        {activeTab === 'LOGS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
            {userRecords.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0', fontSize: '0.9rem' }}>
                Belum ada data presensi yang tercatat.
              </p>
            ) : (
              userRecords.map((rec) => (
                <div 
                  key={rec.id}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: rec.type === 'Masuk' ? '#E0F7FA' : rec.type === 'Pulang' ? '#FFEBEE' : '#F3E8FF',
                        color: rec.type === 'Masuk' ? '#00838F' : rec.type === 'Pulang' ? '#DC2626' : '#9333EA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem'
                      }}
                    >
                      {rec.type === 'Masuk' ? 'IN' : rec.type === 'Pulang' ? 'OUT' : 'IZN'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E293B' }}>
                        {rec.type} • {rec.time}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {rec.date} — <span style={{ color: rec.isLate ? '#D97706' : '#059669', fontWeight: 600 }}>{rec.status}</span>
                      </div>
                      {rec.workDuration && (
                        <div style={{ fontSize: '0.72rem', color: '#00838F', fontWeight: 700 }}>
                          Durasi Kerja: {rec.workDuration}
                        </div>
                      )}
                    </div>
                  </div>

                  {rec.evidenceUrl && (
                    <a
                      href={rec.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Lihat Bukti Foto di Google Drive"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        color: '#00838F',
                        textDecoration: 'none',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Drive</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Weekly 41-Hour Recap */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto' }}>
            <div style={{ background: '#E0F7FA', padding: '12px 16px', borderRadius: '12px', border: '1px solid #B2EBF2', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Award size={32} color="#00838F" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#006064' }}>
                  Target Instansi: 41 Jam / Minggu
                </div>
                <div style={{ fontSize: '0.75rem', color: '#00838F' }}>
                  Senin-Kamis (07.30-15.00), Jumat (07.00-11.30), Sabtu (07.00-13.00)
                </div>
              </div>
            </div>

            {myWeeklySummaries.map((w, idx) => (
              <div 
                key={w.weekKey}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>{w.weekLabel}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: w.isTargetMet ? '#E8F5E9' : '#FFF3E0',
                      color: w.isTargetMet ? '#2E7D32' : '#E65100',
                      border: `1px solid ${w.isTargetMet ? '#C8E6C9' : '#FFE0B2'}`
                    }}
                  >
                    {w.isTargetMet ? `Tercapai (+${w.targetDifference} Jam)` : `Kurang (${w.targetDifference} Jam)`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                  <span>Akumulasi Jam Kerja:</span>
                  <span style={{ fontWeight: 800, color: '#00838F', fontSize: '1rem' }}>{w.totalHours} / 41 Jam</span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{
                      width: `${Math.min(100, (w.totalHours / 41) * 100)}%`,
                      height: '100%',
                      backgroundColor: w.isTargetMet ? '#10B981' : '#F59E0B',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
