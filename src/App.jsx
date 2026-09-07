import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AttendanceProvider, useAttendance } from './contexts/AttendanceContext';
import { UserDashboard } from './pages/user/UserDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AdminResetPasswordPage } from './pages/auth/AdminResetPasswordPage';
import { DownloadPage } from './pages/download/DownloadPage';
import { Toast } from './components/common/Toast';

function AppContent() {
  const { currentUser, logout } = useAuth();
  const { toast, closeToast } = useAttendance();

  // Helper to read current URL path
  const getPath = () => (typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/');

  const [currentPath, setCurrentPath] = useState(getPath);

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatically redirect root URL '/' to '/pegawai/login' for employees by default
  useEffect(() => {
    if (currentPath === '/' || currentPath === '') {
      if (!currentUser) {
        navigateTo('/pegawai/login');
      } else if (currentUser.role === 'admin') {
        navigateTo('/administrator/dashboard');
      } else {
        navigateTo('/pegawai/dashboard');
      }
    }
  }, [currentPath, currentUser]);

  // Safe navigation function updating URL and State
  const navigateTo = (path) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path.toLowerCase());
  };

  // Determine current context based on path
  const isAdminPath = currentPath.includes('administrator') || currentPath.includes('admin');
  const isLoginPath = currentPath.includes('login');
  const isRegisterPath = currentPath.includes('register');
  const isResetPasswordPath = currentPath.includes('reset-password');
  const isDownloadPath = currentPath.includes('download') || currentPath.includes('unduh') || currentPath.includes('install');

  // Handle Logout with appropriate redirection URL
  const handleLogout = () => {
    const wasAdmin = currentUser?.role === 'admin' || isAdminPath;
    logout();
    navigateTo(wasAdmin ? '/administrator/login' : '/pegawai/login');
  };

  const renderPage = () => {
    // 1. Download / Install PWA Landing Page (e.g. si-absen.pkmcermee.my.id/download)
    if (isDownloadPath) {
      return <DownloadPage onNavigateToLogin={() => navigateTo('/pegawai/login')} />;
    }

    // 2. Administrator Reset Password Page (/administrator/reset-password)
    if (isResetPasswordPath) {
      return (
        <AdminResetPasswordPage 
          onNavigateToLogin={() => navigateTo('/administrator/login')} 
        />
      );
    }

    // 3. Register Page (/pegawai/register)
    if (isRegisterPath) {
      return (
        <RegisterPage 
          onNavigateToLogin={() => navigateTo('/pegawai/login')}
          onRegisterSuccess={() => navigateTo('/pegawai/dashboard')}
        />
      );
    }

    // 4. Login Page (Always show on /administrator/login or /pegawai/login, or if not logged in)
    if (isLoginPath || !currentUser) {
      return (
        <LoginPage 
          initialRole={isAdminPath ? 'admin' : 'pegawai'}
          onNavigateToRegister={() => navigateTo('/pegawai/register')}
          onNavigateToResetPassword={() => navigateTo('/administrator/reset-password')}
          onLoginSuccess={(user) => {
            if (user.role === 'admin') {
              navigateTo('/administrator/dashboard');
            } else {
              navigateTo('/pegawai/dashboard');
            }
          }}
        />
      );
    }

    // 5. If logged in and on dashboard
    const isViewingAdmin = currentUser.role === 'admin';

    return isViewingAdmin ? (
      <AdminDashboard 
        onSwitchToUser={() => {
          logout();
          navigateTo('/pegawai/login');
        }}
        onLogout={handleLogout}
      />
    ) : (
      <UserDashboard 
        onSwitchToAdmin={() => {
          logout();
          navigateTo('/administrator/login');
        }}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <>
      <Toast toast={toast} onClose={closeToast} />
      {renderPage()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <AppContent />
      </AttendanceProvider>
    </AuthProvider>
  );
}
