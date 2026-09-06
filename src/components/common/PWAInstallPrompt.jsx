import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi sudah berjalan dalam mode standalone (terpasang)
    const isInStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    
    setIsStandalone(isInStandalone);
    if (isInStandalone) return;

    // 2. Cek apakah user pernah menutup prompt dalam 3 hari terakhir (Dimatikan sementara untuk testing)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      // Hapus cache prompt agar selalu muncul saat testing
      localStorage.removeItem('pwa_prompt_dismissed');
    }

    // 3. Deteksi platform iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Pada iOS, event beforeinstallprompt tidak didukung, tampilkan panduan setelah delay sejenak
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Handler untuk event beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handler jika aplikasi berhasil di-install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  // Jangan render jika sudah standalone atau tidak perlu tampil
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: '#FFFFFF',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: 9999,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <img src="/pwa-192x192.png" alt="Icon" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1E293B' }}>Install SI-ABSEN App</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>Pasang di layar HP untuk akses presensi lebih cepat & layar penuh.</p>
            </div>
          </div>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button 
            onClick={handleDismiss}
            style={{ flex: 1, padding: '10px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Nanti Saja
          </button>
          <button 
            onClick={handleInstallClick}
            style={{ flex: 1, padding: '10px', background: '#00838F', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            <Download size={16} /> Install Sekarang
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Smartphone size={20}/> Install di iPhone</h3>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>Ketuk tombol <strong>Share</strong> di bawah, lalu pilih <strong>Tambah ke Layar Utama</strong>.</p>
            <button onClick={() => setShowIOSGuide(false)} style={{ width: '100%', padding: '12px', background: '#00838F', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Saya Mengerti</button>
          </div>
        </div>
      )}
    </>
  );
}
