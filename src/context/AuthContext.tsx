import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, QuotaStatus } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  quota: QuotaStatus | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminFO: boolean;
  isAdminDev: boolean;
  isProfileComplete: boolean;
  login: (token: string, user: User) => void;
  loginWithGoogle: (
    emailOrData: string | { access_token?: string; credential?: string; token?: string; email?: string; name?: string; role?: string },
    name?: string,
    role?: string
  ) => Promise<User>;
  updateProfile: (data: { name: string; nim: string; prodi: string; semester: number; kelas: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('user') || localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token') || localStorage.getItem('token'));
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const savedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setQuota(res.data.data.quota);
        sessionStorage.setItem('user', JSON.stringify(res.data.data.user));
        localStorage.removeItem('user');
      }
    } catch (err: any) {
      console.warn('Gagal memuat profil auth me:', err);
      // Jika token kedaluwarsa atau tidak valid (401), bersihkan sesi
      if (err.response?.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setQuota(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = (newToken: string, newUser: User) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(newToken);
    setUser(newUser);
    refreshMe();
  };

  const loginWithGoogle = async (
    emailOrData: string | { access_token?: string; credential?: string; token?: string; email?: string; name?: string; role?: string },
    name?: string,
    role?: string
  ): Promise<User> => {
    const payload =
      typeof emailOrData === 'string'
        ? { email: emailOrData, name, role }
        : emailOrData;

    const res = await api.post('/auth/google', payload);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('user', JSON.stringify(newUser));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(newToken);
      setUser(newUser);
      await refreshMe();
      return newUser;
    }
    throw new Error(res.data.message || 'Login Google gagal');
  };

  const updateProfile = async (data: {
    name: string;
    nim: string;
    prodi: string;
    semester: number;
    kelas: string;
    phone?: string;
  }): Promise<void> => {
    const res = await api.put('/auth/profile', data);
    if (res.data.success) {
      const updatedUser = res.data.data.user;
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.removeItem('user');
      await refreshMe();
    } else {
      throw new Error(res.data.message || 'Gagal memperbarui profil');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setQuota(null);
  };

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'admin_developer';
  const isAdminFO = userRole === 'admin_fo' || userRole === 'admin_developer' || userRole === 'admin';
  const isAdminDev = userRole === 'admin_developer' || userRole === 'admin';

  const isProfileComplete = Boolean(
    user &&
    user.name?.trim() &&
    user.nim?.trim() &&
    user.prodi?.trim() &&
    user.semester &&
    user.semester >= 1 &&
    user.semester <= 8 &&
    user.kelas?.trim()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        quota,
        isLoading,
        isAdmin,
        isAdminFO,
        isAdminDev,
        isProfileComplete,
        login,
        loginWithGoogle,
        updateProfile,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
