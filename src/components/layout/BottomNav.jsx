import React from 'react';
import { LayoutGrid, Fingerprint, History } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange, onFingerprintClick }) {
  return (
    <div className="ios-bottom-nav-container">
      <nav className="ios-floating-dock">
        <button 
          type="button"
          className={`ios-dock-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
          title="Beranda"
        >
          <LayoutGrid size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="ios-dock-label">Beranda</span>
        </button>

        {/* Floating Pulsing Fingerprint Action Button */}
        <div className="ios-fab-wrapper">
          <button 
            type="button"
            className="ios-fab-fingerprint" 
            onClick={onFingerprintClick}
            title="Tekan untuk Absen / Presensi Cepat"
          >
            <div className="ios-fab-pulse-ring" />
            <div className="ios-fab-inner">
              <Fingerprint size={32} strokeWidth={2.4} />
            </div>
          </button>
        </div>

        <button 
          type="button"
          className={`ios-dock-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
          title="Riwayat Presensi"
        >
          <History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          <span className="ios-dock-label">Riwayat</span>
        </button>
      </nav>
    </div>
  );
}

