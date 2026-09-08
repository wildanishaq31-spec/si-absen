import React, { useState, useEffect } from 'react';

export function SplashScreen({ onFinish, duration = 2400 }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Sedang Memeriksa Koneksi Anda...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = 30; // update every 30ms for 60fps smoothness

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct > 40 && pct <= 80) {
        setStatusText('Menyiapkan Sistem SI-ABSEN...');
      } else if (pct > 80) {
        setStatusText('Membuka Aplikasi...');
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 350);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onFinish]);

  return (
    <div 
      className={`sipp-splash-screen ${isFadingOut ? 'fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundImage: 'url("/splash-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#004D40',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '0 24px 36px 24px'
      }}
    >
      {/* Subtle overlay gradient at the bottom for maximum legibility */}
      <div 
        style={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: '240px',
          background: 'linear-gradient(to top, rgba(0, 30, 30, 0.85) 0%, rgba(0, 30, 30, 0.4) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />

      {/* Bottom Loading Bar Container matching Gambar 2 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        {/* Progress Bar Container Pill */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: '34px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
          }}
        >
          {/* Animated Filled Progress Bar */}
          <div 
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00ACC1 0%, #00E5FF 50%, #10B981 100%)',
              transition: 'width 0.08s linear',
              borderRadius: '9999px',
              boxShadow: '0 0 12px rgba(0, 229, 255, 0.8)'
            }} 
          />

          {/* Text Overlay inside Progress Bar */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.85)',
              pointerEvents: 'none',
              padding: '0 12px',
              whiteSpace: 'nowrap'
            }}
          >
            {statusText}
          </div>
        </div>

        {/* Text DEVELOP BY PUSKESMAS CERMEE matching Gambar 2 */}
        <div 
          style={{
            color: '#FFFFFF',
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 0 16px rgba(0, 229, 255, 0.4)',
            fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif'
          }}
        >
          DEVELOP BY PUSKESMAS CERMEE
        </div>
      </div>
    </div>
  );
}
