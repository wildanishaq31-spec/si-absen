import React, { useState, useEffect } from 'react';
import { 
  Download, Smartphone, ShieldCheck, CheckCircle2, 
  ArrowRight, Share2, PlusSquare, Sparkles, Zap, MapPin, 
  Camera, Clock, Layers, HelpCircle, ExternalLink
} from 'lucide-react';

export function DownloadPage({ onNavigateToLogin }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('android'); // 'android' or 'ios'

  useEffect(() => {
    // 1. Check if running in standalone mode
    const isInStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
    setIsStandalone(isInStandalone);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    if (isIOSDevice) {
      setActiveTab('ios');
    }

    // 3. Listen to beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setActiveTab('ios');
      // Scroll to guide
      const guideEl = document.getElementById('install-guide-section');
      if (guideEl) guideEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If direct prompt not available (e.g. already prompt or browser requires menu)
      const guideEl = document.getElementById('install-guide-section');
      if (guideEl) guideEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      color: '#1E293B',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header */}
      <header style={{
        background: 'linear-gradient(135deg, #006064 0%, #00838F 60%, #00ACC1 100%)',
        padding: '36px 20px 48px',
        color: '#FFFFFF',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Logo Badge */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '22px',
            backgroundColor: '#FFFFFF',
            color: '#00838F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.2)'
          }}>
            <ShieldCheck size={44} />
          </div>

          <span style={{
            display: 'inline-block',
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            PWA OFFICIAL INSTALLER
          </span>

          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            SI-ABSEN <span style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.9 }}>v5.6</span>
          </h1>

          <p style={{ fontSize: '0.95rem', margin: '0 0 24px', opacity: 0.95, lineHeight: 1.5 }}>
            Sistem Informasi Presensi PPPKPW UPTD Puskesmas Cermee berbasis Progressive Web App (PWA). Cepat, Ringan & Mendukung Presensi GPS Wajah.
          </p>

          {/* Call to Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            <button
              onClick={handleInstallClick}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#00838F',
                border: 'none',
                padding: '15px 24px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Download size={20} />
              {isInstalled || isStandalone ? 'Aplikasi Sudah Terpasang' : 'Pasang / Install Aplikasi Sekarang'}
            </button>

            <button
              onClick={onNavigateToLogin}
              style={{
                backgroundColor: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.4)',
                padding: '13px 20px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Buka Halaman Login Pegawai</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 20px 48px' }}>
        
        {/* Keunggulan PWA Cards */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00838F', marginBottom: '16px', textAlign: 'center' }}>
            ✨ Keunggulan Aplikasi SI-ABSEN
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ color: '#00838F', marginBottom: '8px' }}><MapPin size={24} /></div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>Kunci Lokasi GPS Akurat</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>Absensi terkunci dalam radius kantor puskesmas dengan akurasi tinggi.</p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ color: '#00838F', marginBottom: '8px' }}><Camera size={24} /></div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>Verifikasi Wajah Realtime</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>Kamera langsung dengan deteksi anti-kecurangan untuk bukti absensi valid.</p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ color: '#00838F', marginBottom: '8px' }}><Layers size={24} /></div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>Dinas Harian & 3-Shift</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>Mendukung jadwal dinas pagi (41 jam/mgg) serta dinas muter (Pagi, Sore, Malam).</p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ color: '#00838F', marginBottom: '8px' }}><Zap size={24} /></div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>Ringan & Tanpa Play Store</h3>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>Ukuran sangat hemat (&lt; 2 MB) dan selalu terupdate otomatis tanpa beban memori HP.</p>
            </div>
          </div>
        </section>

        {/* Installation Guide Section */}
        <section id="install-guide-section" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                Panduan Pasang Aplikasi di HP
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Pilih jenis perangkat HP yang Anda gunakan di bawah ini:
              </p>
            </div>
          </div>

          {/* Device Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('android')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'android' ? '#00838F' : 'transparent',
                color: activeTab === 'android' ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🤖 HP Android (Chrome)
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'ios' ? '#00838F' : 'transparent',
                color: activeTab === 'ios' ? '#FFFFFF' : '#64748B',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🍎 iPhone / iPad (Safari)
            </button>
          </div>

          {/* Android Guide */}
          {activeTab === 'android' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Buka di Google Chrome</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>Pastikan Anda membuka tautan website ini menggunakan browser Google Chrome.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Klik Tombol Pasang / Menu Titik Tiga (⋮)</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Klik tombol <strong>"Pasang / Install Aplikasi Sekarang"</strong> di bagian atas halaman ini, atau tekan tombol titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome lalu pilih <strong>"Tambahkan ke Layar Utama" (Install app)</strong>.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E0F7FA', color: '#00838F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Konfirmasi & Selesai!</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>Tekan <strong>Install / Tambahkan</strong>. Ikon aplikasi SI-ABSEN akan langsung muncul di beranda HP Anda layaknya aplikasi Play Store.</div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeTab === 'ios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Buka di Browser Safari</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>Buka halaman website ini khusus melalui browser bawaan <strong>Safari</strong> di iPhone/iPad Anda.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Ketuk Tombol Share (Bagikan)</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Ketuk ikon <strong>Share</strong> (ikon kotak dengan tanda panah ke atas <Share2 size={13} style={{ display: 'inline' }} />) di bagian bawah layar Safari.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>Pilih "Tambah ke Layar Utama" (Add to Home Screen)</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Gulir ke bawah dan pilih opsi <strong>"Tambah ke Layar Utama" (Add to Home Screen) <PlusSquare size={13} style={{ display: 'inline' }} /></strong> lalu tekan <strong>Tambah (Add)</strong> di pojok kanan atas.
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '36px', fontSize: '0.82rem', color: '#94A3B8' }}>
          <p style={{ margin: '0 0 6px' }}>SI-ABSEN &bull; UPTD Puskesmas Cermee</p>
          <p style={{ margin: 0 }}>Hak Cipta Terpelihara &copy; 2026</p>
        </div>
      </main>
    </div>
  );
}
