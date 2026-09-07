import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService, INITIAL_USERS } from '../services/storage';
import { cloudApiService } from '../services/cloudApi';
import { hashPassword, verifyPassword } from '../utils/crypto';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => storageService.getSession());
  const [users, setUsers] = useState(() => storageService.getUsers());
  const [loading, setLoading] = useState(false);

  const refreshUsersFromCloud = useCallback(async () => {
    const settings = storageService.getSettings();
    try {
      const cloudData = await cloudApiService.fetchAllData(settings?.googleSpreadsheetUrl, settings?.gasWebhookUrl);
      if (cloudData && Array.isArray(cloudData.users)) {
        // Authoritative server users list: Server + Default Admin
        let mergedUsers = [...cloudData.users];
        
        // Ensure default admin exists
        if (!mergedUsers.some(u => u.role === 'admin')) {
          mergedUsers.unshift(INITIAL_USERS[0]);
        }

        storageService.saveUsers(mergedUsers);
        setUsers(mergedUsers);

        // Check if active session is still valid in mergedUsers
        const currentSession = storageService.getSession();
        if (currentSession) {
          const isValidSession = mergedUsers.find(
            u => (u.id && u.id === currentSession.id) || (u.email && u.email?.toLowerCase() === currentSession.email?.toLowerCase())
          );
          if (isValidSession) {
            setCurrentUser(isValidSession);
            storageService.saveSession(isValidSession);
          } else {
            // User was removed/reset from database! Clear active session
            setCurrentUser(null);
            storageService.clearSession();
          }
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data user dari Cloud Backend:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Fetch central settings from backend serverless so all devices are in sync
    cloudApiService.fetchCentralSettings().then(centralSettings => {
      if (centralSettings) {
        const localSettings = storageService.getSettings();
        storageService.saveSettings({ ...localSettings, ...centralSettings });
      }
    });

    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);

    const activeSession = storageService.getSession();
    if (activeSession) {
      const syncedUser = loadedUsers.find(u => u.id === activeSession.id) || activeSession;
      setCurrentUser(syncedUser);
      storageService.saveSession(syncedUser);
    }

    refreshUsersFromCloud();
    setLoading(false);
  }, [refreshUsersFromCloud]);

  const resetLocalAndCloudData = async () => {
    try {
      await cloudApiService.resetCentralDatabase();
    } catch (e) {
      console.warn('Backend reset warning:', e);
    }
    const resetResult = storageService.resetAllData();
    setUsers(resetResult.users);
    setCurrentUser(null);
    return { success: true };
  };

  const login = async (identifier, password, requiredRole = null) => {
    // 1. Refresh latest users from cloud/database first to enforce authoritative check
    await refreshUsersFromCloud();

    const allUsers = storageService.getUsers();
    const cleanId = (identifier || '').toLowerCase().trim();
    const isAdminLogin = requiredRole === 'admin';
    
    // Find user by email or NIP
    const found = allUsers.find(
      u => (u.email?.toLowerCase().trim() === cleanId || u.nip?.toLowerCase().trim() === cleanId)
    );

    if (!found) {
      if (isAdminLogin) {
        return { 
          success: false, 
          message: 'Akun Administrator tidak ditemukan. Jika baru saja mereset data, silakan gunakan email bawaan: admin@siabsen.go.id (kata sandi: admin).' 
        };
      }
      return { 
        success: false, 
        message: 'Akun pegawai tidak ditemukan dalam database. Silakan daftar akun baru terlebih dahulu.' 
      };
    }

    if (requiredRole && found.role !== requiredRole) {
      return { 
        success: false, 
        message: isAdminLogin 
          ? 'Akun ini bukan bertipe Administrator.' 
          : 'Akun ini bukan bertipe Pegawai.' 
      };
    }

    // Verify cryptographic SHA-256 hash (or plaintext fallback)
    const isValidPassword = await verifyPassword(password, found.password);
    if (!isValidPassword) {
      if (isAdminLogin) {
        return { 
          success: false, 
          message: 'Kata sandi Administrator salah. Jika baru mereset data, kata sandi bawaannya adalah "admin".' 
        };
      }
      return { success: false, message: 'NIP / Email atau kata sandi tidak sesuai.' };
    }

    setCurrentUser(found);
    storageService.saveSession(found);
    return { success: true, user: found };
  };

  const register = async ({ name, email, password, nip, skpd }) => {
    // Refresh latest users from cloud first
    await refreshUsersFromCloud();

    const allUsers = storageService.getUsers();
    
    if (!name?.trim()) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }

    const nipClean = (nip || '').trim();
    if (!nipClean) {
      return { success: false, message: 'NIP / Nomor Identitas Pegawai wajib diisi.' };
    }

    const existsNip = allUsers.some(u => u.nip && u.nip.trim() === nipClean);
    if (existsNip) {
      return { success: false, message: 'NIP sudah terdaftar oleh pegawai lain.' };
    }

    const emailClean = (email || '').toLowerCase().trim();
    if (!emailClean) {
      return { success: false, message: 'Email wajib diisi.' };
    }

    const existsEmail = allUsers.some(u => u.email?.toLowerCase().trim() === emailClean);
    if (existsEmail) {
      return { success: false, message: 'Email sudah terdaftar dalam sistem.' };
    }

    if (!skpd?.trim()) {
      return { success: false, message: 'SKPD / Unit Kerja wajib diisi.' };
    }

    // Hash password with SHA-256
    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: `U-${Date.now()}`,
      name: name.trim(),
      email: emailClean,
      password: hashedPassword,
      role: 'pegawai',
      nip: nipClean,
      skpd: skpd.trim(),
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    const saved = storageService.addUser(newUser);
    const updatedUsers = [...allUsers, saved];
    setUsers(updatedUsers);

    // Auto-save session to phone cache so employee stays logged in permanently
    setCurrentUser(saved);
    storageService.saveSession(saved);

    // Sync directly to Google Spreadsheet & Cloud Backend
    const settings = storageService.getSettings();
    await cloudApiService.syncUser(saved, settings?.googleSpreadsheetUrl, settings?.gasWebhookUrl);

    return { success: true, user: saved };
  };

  const logout = () => {
    storageService.clearSession();
    setCurrentUser(null);
  };

  const updateUser = async (userId, updatedData) => {
    const payloadToSave = { ...updatedData };
    
    // Hash password if updating password
    if (payloadToSave.password) {
      payloadToSave.password = await hashPassword(payloadToSave.password);
    }

    const updatedUser = storageService.updateUser(userId, payloadToSave);
    if (updatedUser) {
      const allUsers = storageService.getUsers();
      setUsers(allUsers);
      
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
        storageService.saveSession(updatedUser);
      }

      // Sync updated admin/pegawai to Google Spreadsheet (tab Superadmin or Data Pegawai)
      const settings = storageService.getSettings();
      cloudApiService.syncUser(updatedUser, settings?.googleSpreadsheetUrl, settings?.gasWebhookUrl);

      return { success: true, user: updatedUser };
    }
    return { success: false, message: 'User tidak ditemukan' };
  };

  const deleteUser = (userId) => {
    storageService.deleteUser(userId);
    setUsers(storageService.getUsers());
    return { success: true };
  };

  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      storageService.saveSession(found);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        login,
        register,
        logout,
        switchUser,
        updateUser,
        deleteUser,
        refreshUsersFromCloud,
        resetLocalAndCloudData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
