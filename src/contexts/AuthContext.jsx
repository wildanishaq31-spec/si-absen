import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage';
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
      if (cloudData && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
        const localUsers = storageService.getUsers();
        const mergedMap = new Map();
        localUsers.forEach(u => mergedMap.set(u.id || u.email, u));
        cloudData.users.forEach(cu => {
          const key = cu.id || cu.email;
          const existing = mergedMap.get(key);
          mergedMap.set(key, {
            ...existing,
            ...cu,
            password: cu.password || existing?.password || '12345678'
          });
        });

        const mergedUsers = Array.from(mergedMap.values());
        storageService.saveUsers(mergedUsers);
        setUsers(mergedUsers);

        const currentSession = storageService.getSession();
        if (currentSession) {
          const updatedSession = mergedUsers.find(u => u.id === currentSession.id || u.email === currentSession.email);
          if (updatedSession) {
            setCurrentUser(updatedSession);
            storageService.saveSession(updatedSession);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data user dari Cloud Backend:', err);
    }
  }, []);

  useEffect(() => {
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

  const login = async (identifier, password, requiredRole = null) => {
    const allUsers = storageService.getUsers();
    const cleanId = (identifier || '').toLowerCase().trim();
    
    // Find user by email or NIP
    const found = allUsers.find(
      u => (u.email?.toLowerCase().trim() === cleanId || u.nip?.toLowerCase().trim() === cleanId)
    );

    if (!found) {
      return { success: false, message: 'Email / NIP atau kata sandi tidak sesuai.' };
    }

    // Verify cryptographic SHA-256 hash (or plaintext fallback)
    const isValidPassword = await verifyPassword(password, found.password);
    if (!isValidPassword) {
      return { success: false, message: 'Email / NIP atau kata sandi tidak sesuai.' };
    }

    if (requiredRole && found.role !== requiredRole) {
      return { success: false, message: `Akun ini bukan bertipe ${requiredRole}.` };
    }

    setCurrentUser(found);
    storageService.saveSession(found);
    return { success: true, user: found };
  };

  const register = async ({ name, email, password, nip, skpd }) => {
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

    // Sync directly to Google Spreadsheet & Cloud Backend
    const settings = storageService.getSettings();
    cloudApiService.syncUser(saved, settings?.googleSpreadsheetUrl, settings?.gasWebhookUrl);

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
        refreshUsersFromCloud
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
