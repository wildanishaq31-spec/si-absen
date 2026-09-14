import React from 'react';
import { Menu, Bell, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SIPPHeader({ onOpenMenu, onSwitchToAdmin }) {
  const { currentUser } = useAuth();

  return (
    <header className="ios-header">
      <div className="ios-header-left">
        <button 
          type="button"
          className="ios-header-btn" 
          onClick={onOpenMenu} 
          title="Buka Menu Utama"
        >
          <Menu size={20} strokeWidth={2.4} />
        </button>
        <div className="ios-header-brand">
          <span className="ios-brand-title">SI-ABSEN</span>
          <span className="ios-brand-badge">v5.6</span>
        </div>
      </div>

      <div className="ios-header-right">
        {/* Status System Pill */}
        <div className="ios-system-status-pill" title="Sistem Online & Terverifikasi">
          <span className="ios-pulse-dot" />
          <span className="ios-status-text">Online</span>
        </div>

        {/* Notifikasi */}
        <button 
          type="button"
          className="ios-header-btn" 
          title="Pemberitahuan"
        >
          <Bell size={19} strokeWidth={2.2} />
          <span className="ios-bell-badge" />
        </button>

        {/* Admin Shortcut */}
        {currentUser && currentUser.role === 'admin' && (
          <button 
            type="button"
            className="ios-admin-btn"
            onClick={onSwitchToAdmin}
            title="Buka Dashboard Admin"
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
}

