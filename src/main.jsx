import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/sipp-theme.css';
import './styles/admin.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-update Service Worker to ensure HP/PWA doesn't cache old broken code
const updateSW = registerSW({
  onNeedRefresh() {
    // Force update aggressively for development & rapid fixes
    updateSW(true);
  },
  onOfflineReady() {}
});

// Guard to disable mobile browser pull-to-refresh and horizontal history swipe navigation
if (typeof window !== 'undefined') {
  let touchStartY = 0;
  let touchStartX = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY;
      const deltaX = currentX - touchStartX;

      // 1. Prevent pull-down to refresh when at the top of the page
      if (window.scrollY <= 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }

      // 2. Prevent edge horizontal swipe history back/forward
      const isNearLeftEdge = touchStartX < 25 && deltaX > 10;
      const isNearRightEdge = touchStartX > (window.innerWidth - 25) && deltaX < -10;
      if ((isNearLeftEdge || isNearRightEdge) && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
  }, { passive: false });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
