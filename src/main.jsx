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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
