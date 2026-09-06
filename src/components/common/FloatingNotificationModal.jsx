import React, { useEffect } from 'react';

/**
 * Modern SVG Illustrations matching the provided UI design (Image 2)
 */

// 1. SUCCESS ILLUSTRATION: Green circular checkmark with dashed arcs and confetti particles
function SuccessIllustration() {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Background Confetti Particles */}
        {/* Mint Squares & Diamonds */}
        <rect x="18" y="24" width="6" height="6" rx="1.5" transform="rotate(25 18 24)" fill="#A7F3D0" />
        <rect x="94" y="22" width="7" height="7" rx="1.5" transform="rotate(-30 94 22)" fill="#6EE7B7" />
        <rect x="22" y="85" width="5" height="5" rx="1" transform="rotate(45 22 85)" fill="#6EE7B7" />
        <rect x="98" y="78" width="6" height="6" rx="1.5" transform="rotate(15 98 78)" fill="#A7F3D0" />
        
        {/* Floating Triangles & Polygons */}
        <polygon points="34,16 39,24 30,24" fill="#6EE7B7" transform="rotate(15 34 20)" />
        <polygon points="86,40 92,46 83,48" fill="#34D399" opacity="0.7" />
        <polygon points="16,55 22,60 14,63" fill="#A7F3D0" />
        
        {/* Tiny Dots */}
        <circle cx="58" cy="14" r="2.5" fill="#34D399" />
        <circle cx="82" cy="18" r="2" fill="#A7F3D0" />
        <circle cx="106" cy="50" r="2.5" fill="#6EE7B7" />
        <circle cx="38" cy="94" r="2" fill="#34D399" opacity="0.6" />
        <circle cx="84" cy="95" r="2.5" fill="#A7F3D0" />

        {/* Ambient Glow */}
        <circle cx="60" cy="60" r="38" fill="#ECFDF5" />

        {/* Modern Dashed / Broken Circle Arc */}
        <path
          d="M60 22 C78 22, 94 36, 96 55"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M96 65 C93 84, 78 98, 60 98 C40 98, 24 82, 24 62 C24 44, 37 28, 52 23"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Subtle accent dot on circle */}
        <circle cx="97" cy="60" r="2.5" fill="#10B981" />

        {/* Checkmark */}
        <path
          d="M44 60 L54 70 L77 47"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// 2. ERROR / OH NO ILLUSTRATION: Modern coral red cone/barrier illustration with cyan shadow & ground line
function ErrorIllustration() {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Blue Shadow Accent inside the cone */}
        <path
          d="M58 36 L70 82 H50 Z"
          fill="#BAE6FD"
          opacity="0.6"
        />

        {/* Ambient Glow */}
        <circle cx="60" cy="60" r="40" fill="#FEF2F2" />

        {/* Left dot */}
        <circle cx="28" cy="84" r="3" fill="#EF4444" />

        {/* Ground Line */}
        <path
          d="M38 84 H48 M52 84 H96"
          stroke="#EF4444"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Modern Geometric Cone (Ladder/Traffic Cone shape exactly like Image 2) */}
        {/* Outer Triangle Shape */}
        <path
          d="M50 32 L40 84 M70 32 L80 84 M50 32 H70"
          stroke="#EF4444"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Stripes */}
        <path
          d="M48 48 H72"
          stroke="#EF4444"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M45 64 H75"
          stroke="#EF4444"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Little decorative cross/dot */}
        <circle cx="94" cy="40" r="2" fill="#FCA5A5" />
        <circle cx="24" cy="45" r="2" fill="#FCA5A5" />
        <rect x="86" y="24" width="4" height="4" rx="1" transform="rotate(25 86 24)" fill="#FECACA" />
      </svg>
    </div>
  );
}

// 3. WARNING / CONFIRMATION ILLUSTRATION: Modern Amber Hazard / Exclamation badge
function WarningIllustration() {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Background Particles */}
        <rect x="20" y="26" width="6" height="6" rx="1.5" transform="rotate(30 20 26)" fill="#FDE68A" />
        <rect x="94" y="28" width="6" height="6" rx="1.5" transform="rotate(-20 94 28)" fill="#FDE68A" />
        <circle cx="24" cy="76" r="2.5" fill="#FCD34D" />
        <circle cx="98" cy="74" r="2.5" fill="#FCD34D" />
        <polygon points="86,84 92,90 84,92" fill="#FDE68A" />
        <polygon points="32,20 37,26 29,27" fill="#FCD34D" />

        {/* Ambient Warm Glow */}
        <circle cx="60" cy="60" r="38" fill="#FFFBEB" />

        {/* Modern Rounded Warning Triangle */}
        <path
          d="M60 25 L92 81 C94.5 85 91.5 90 87 90 H33 C28.5 90 25.5 85 28 81 L60 25 Z"
          stroke="#F59E0B"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#FEF3C7"
        />

        {/* Exclamation Bar & Dot */}
        <path
          d="M60 46 V64"
          stroke="#D97706"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="60" cy="76" r="3" fill="#D97706" />
      </svg>
    </div>
  );
}

// 4. INFO ILLUSTRATION: Modern Cyan/Teal Information Badge
function InfoIllustration() {
  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ambient Teal Glow */}
        <circle cx="60" cy="60" r="38" fill="#E0F2FE" />
        <circle cx="26" cy="30" r="2.5" fill="#7DD3FC" />
        <circle cx="96" cy="32" r="2.5" fill="#7DD3FC" />
        <rect x="22" y="78" width="5" height="5" rx="1.5" transform="rotate(45 22 78)" fill="#BAE6FD" />
        <rect x="94" y="75" width="6" height="6" rx="1.5" transform="rotate(-30 94 75)" fill="#BAE6FD" />

        {/* Circle Ring with modern broken stroke */}
        <circle
          cx="60"
          cy="60"
          r="34"
          stroke="#0284C7"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* 'i' icon */}
        <circle cx="60" cy="46" r="3" fill="#0284C7" />
        <path
          d="M60 56 V74"
          stroke="#0284C7"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function FloatingNotificationModal({ notification, onClose }) {
  if (!notification) return null;

  const {
    type = 'success', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    isConfirm = false,
    autoClose = false
  } = notification;

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        else if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onClose]);

  // Normalized Theme Configuration
  const isSuccess = type === 'success' || type === 'sukses';
  const isError = type === 'error' || type === 'gagal' || type === 'danger';
  const isWarning = type === 'warning' || type === 'perhatian' || type === 'konfirmasi' || isConfirm;
  const isInfo = !isSuccess && !isError && !isWarning;

  // Default Headers matching Image 2
  let defaultTitle = 'SUCCESS!';
  let titleColor = '#10B981';
  let primaryButtonBg = '#10B981';
  let primaryButtonHoverBg = '#059669';
  let defaultConfirmText = 'DONE';

  if (isSuccess) {
    defaultTitle = title || 'SUCCESS!';
    titleColor = '#10B981';
    primaryButtonBg = '#10B981';
    primaryButtonHoverBg = '#059669';
    defaultConfirmText = confirmText || 'DONE';
  } else if (isError) {
    defaultTitle = title || 'OH NO...';
    titleColor = '#EF4444';
    primaryButtonBg = '#EF4444';
    primaryButtonHoverBg = '#DC2626';
    defaultConfirmText = confirmText || 'TRY AGAIN';
  } else if (isWarning) {
    defaultTitle = title || (isConfirm ? 'KONFIRMASI' : 'PERHATIAN!');
    titleColor = isConfirm ? '#E11D48' : '#F59E0B';
    primaryButtonBg = isConfirm ? '#E11D48' : '#F59E0B';
    primaryButtonHoverBg = isConfirm ? '#BE123C' : '#D97706';
    defaultConfirmText = confirmText || (isConfirm ? 'YA, LANJUTKAN' : 'MENGERTI');
  } else {
    defaultTitle = title || 'INFORMASI';
    titleColor = '#0284C7';
    primaryButtonBg = '#0284C7';
    primaryButtonHoverBg = '#0369A1';
    defaultConfirmText = confirmText || 'OKE';
  }

  const handleConfirmClick = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancelClick = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'backdropFadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        // Close if clicking outside the card unless it's a strict confirmation dialog
        if (e.target === e.currentTarget && !isConfirm) {
          if (onClose) onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          width: '100%',
          maxWidth: '380px',
          padding: '36px 28px 32px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          animation: 'popInCenter 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Minimalist Illustration */}
        {isSuccess && <SuccessIllustration />}
        {isError && <ErrorIllustration />}
        {isWarning && <WarningIllustration />}
        {isInfo && <InfoIllustration />}

        {/* Title */}
        <h3
          style={{
            margin: '0 0 10px 0',
            fontSize: '1.35rem',
            fontWeight: 900,
            color: titleColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {defaultTitle}
        </h3>

        {/* Message */}
        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '0.94rem',
            color: '#475569',
            lineHeight: 1.6,
            fontWeight: 500,
            wordBreak: 'break-word',
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        {isConfirm ? (
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button
              type="button"
              onClick={handleCancelClick}
              style={{
                flex: 1,
                padding: '13px 20px',
                borderRadius: '9999px',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#64748B',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
                e.currentTarget.style.color = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#64748B';
              }}
            >
              {cancelText || 'BATAL'}
            </button>

            <button
              type="button"
              onClick={handleConfirmClick}
              style={{
                flex: 1,
                padding: '13px 20px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: primaryButtonBg,
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: `0 8px 20px -4px ${primaryButtonBg}77`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryButtonHoverBg;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryButtonBg;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {defaultConfirmText}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirmClick}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: primaryButtonBg,
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: `0 10px 25px -5px ${primaryButtonBg}88`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryButtonHoverBg;
              e.currentTarget.style.transform = 'translateY(-1.5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryButtonBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {defaultConfirmText}
          </button>
        )}
      </div>

      <style>{`
        @keyframes popInCenter {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(20px);
          }
          65% {
            transform: scale(1.03) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes backdropFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
