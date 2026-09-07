import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage';
import { gasApiService } from '../services/gasApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => storageService.getSession());
  const [users, setUsers] = useState(() => storageService.getUsers());
  const [loading, setLoading] = useState(false);

  const refreshUsersFromCloud = useCallback(async () => {
    const settings = storageService.getSettings();
    if (!settings?.gasWebhookUrl) return;

    try {
      const cloudData = await gasApiService.fetchAllData(settings.gasWebhookUrl, settings.googleSpreadsheetUrl);
      if (cloudData && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
        const localUsers = storageService.getUsers();
        // Merge cloud users with local users (preserve any local passwords if missing)
        const mergedMap = new Map();
        localUsers.forEach(u => mergedMap.set(u.id, u));
        cloudData.users.forEach(cu => {
          const existing = mergedMap.get(cu.id);
          mergedMap.set(cu.id, {
            ...cu,
            password: cu.password || existing?.password || '12345678'
          });
        });

        const mergedUsers = Array.from(mergedMap.values());
        storageService.saveUsers(mergedUsers);
        setUsers(mergedUsers);

        const currentSession = storageService.getSession();
        if (currentSession) {
          const updatedSession = mergedUsers.find(u => u.id === currentSession.id);
          if (updatedSession) {
            setCurrentUser(updatedSession);
            storageService.saveSession(updatedSession);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal sinkronisasi data user dari Google Sheets:', err);
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

    // Background sync from cloud if configured
    refreshUsersFromCloud();
    setLoading(false);
  }, [refreshUsersFromCloud]);

  const login = (identifier, password, requiredRole = null) => {
    const allUsers = storageService.getUsers();
    const cleanId = (identifier || '').toLowerCase().trim();
    const found = allUsers.find(
      u => (u.email?.toLowerCase().trim() === cleanId || u.nip?.toLowerCase().trim() === cleanId) && u.password === password
    );

    if (!found) {
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

    const newUser = {
      id: `U-${Date.now()}`,
      name: name.trim(),
      email: emailClean,
      password,
      role: 'pegawai',
      nip: nipClean,
      skpd: skpd.trim(),
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    const saved = storageService.addUser(newUser);
    const updatedUsers = [...allUsers, saved];
    setUsers(updatedUsers);

    // Sync directly to Google Spreadsheet
    const settings = storageService.getSettings();
    if (settings?.gasWebhookUrl) {
      gasApiService.syncUser(settings.gasWebhookUrl, saved, settings.googleSpreadsheetUrl);
    }

    return { success: true, user: saved };
  };

  const logout = () => {
    storageService.clearSession();
    setCurrentUser(null);
  };

  const updateUser = (userId, updatedData) => {
    const updatedUser = storageService.updateUser(userId, updatedData);
    if (updatedUser) {
      const allUsers = storageService.getUsers();
      setUsers(allUsers);
      
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
        storageService.saveSession(updatedUser);
      }

      // Sync updated admin/pegawai to Google Spreadsheet
      const settings = storageService.getSettings();
      if (settings?.gasWebhookUrl) {
        gasApiService.syncUser(settings.gasWebhookUrl, updatedUser, settings.googleSpreadsheetUrl);
      }

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
