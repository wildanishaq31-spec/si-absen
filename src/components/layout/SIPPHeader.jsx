import React from 'react';
import { Menu, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SIPPHeader({ onOpenMenu, onSwitchToAdmin }) {
  const { currentUser } = useAuth();

  return (
    <>
      {/* Main SIPP App Bar */}
      <header className="sipp-header">
        <div className="header-title-group">
          <button className="icon-btn" onClick={onOpenMenu} title="Menu Utama">
            <Menu size={22} />
          </button>
          <div className="sipp-logo-title">SI-ABSEN <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>v5.6</span></div>
        </div>

        <div className="header-action-icons">
          <button className="icon-btn" title="Notifikasi">
            <Bell size={20} />
            <span className="icon-badge-dot" />
          </button>
          
          <div className="verified-badge" title="Status Sistem Online & Terverifikasi">
            <CheckCircle size={22} />
          </div>

          {currentUser && currentUser.role === 'admin' && (
            <button 
              onClick={onSwitchToAdmin}
              style={{
                background: '#00838F',
                color: '#FFF',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Panel Admin
            </button>
          )}
        </div>
      </header>
    </>
  );
}
