import React from 'react';
import { LayoutGrid, Fingerprint, History, User } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange, onFingerprintClick }) {
  return (
    <nav className="sipp-bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
        title="Beranda"
      >
        <LayoutGrid size={24} />
      </button>

      {/* Floating Fingerprint Action Button */}
      <button 
        className="fab-fingerprint" 
        onClick={onFingerprintClick}
        title="Tekan untuk Absen / Presensi"
      >
        <Fingerprint size={34} strokeWidth={2.2} />
      </button>

      <button 
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
        title="Riwayat Presensi"
      >
        <History size={24} />
      </button>
    </nav>
  );
}
