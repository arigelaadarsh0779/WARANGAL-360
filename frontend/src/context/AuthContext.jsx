import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('w360_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('w360_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [language, setLanguageState] = useState(() => localStorage.getItem('w360_lang') || 'en');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token && user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getUnreadNotifCount();
      if (res && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  const loginUser = (authData) => {
    setToken(authData.token);
    const userData = {
      id: authData.userId,
      name: authData.name,
      phone: authData.phone,
      role: authData.role,
      departmentId: authData.departmentId,
      departmentName: authData.departmentName,
      designationLevel: authData.designationLevel,
      mustChangePassword: authData.mustChangePassword,
      preferredLanguage: authData.preferredLanguage || 'en',
    };
    setUser(userData);
    if (authData.preferredLanguage) {
      setLanguage(authData.preferredLanguage);
    }
    localStorage.setItem('w360_token', authData.token);
    localStorage.setItem('w360_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUnreadCount(0);
    localStorage.removeItem('w360_token');
    localStorage.removeItem('w360_user');
  };

  const setLanguage = (lang) => {
    const valid = lang === 'te' ? 'te' : 'en';
    setLanguageState(valid);
    localStorage.setItem('w360_lang', valid);
    if (token) {
      api.updateLanguage(valid).catch(() => {});
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  // Translation helper
  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  const isCitizen = user?.role === 'ROLE_CITIZEN';
  const isOfficial = user?.role === 'ROLE_OFFICIAL' || user?.role === 'ROLE_DEPT_HEAD';
  const isDeptHead = user?.role === 'ROLE_DEPT_HEAD';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        language,
        unreadCount,
        loginUser,
        logout,
        setLanguage,
        toggleLanguage,
        t,
        fetchUnreadCount,
        isCitizen,
        isOfficial,
        isDeptHead,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
