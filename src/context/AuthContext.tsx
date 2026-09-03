import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { UserSavedDiagnosis } from '../types';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isAdmin: boolean;
  adminToken: string | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  savedDiagnoses: UserSavedDiagnosis[];
  saveDiagnosis: (item: Omit<UserSavedDiagnosis, 'id' | 'createdAt'>) => void;
  deleteDiagnosis: (id: string) => void;
  clearAllHistory: () => void;
  consentTelemetry: boolean;
  setConsentTelemetry: (consent: boolean) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (pass: string) => Promise<boolean>;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('embudo_admin_token'));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('embudo_theme');
    if (saved) return saved === 'dark';
    return true; // Default sleek dark theme
  });

  const [consentTelemetry, setConsentTelemetryState] = useState<boolean>(() => {
    return localStorage.getItem('embudo_telemetry_consent') === 'true';
  });

  const [savedDiagnoses, setSavedDiagnoses] = useState<UserSavedDiagnosis[]>(() => {
    try {
      const local = localStorage.getItem('embudo_history');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('embudo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('embudo_theme', 'light');
    }
  }, [isDarkMode]);

  // Firebase auth state observer
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase Auth fallback enabled:', e);
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('embudo_history', JSON.stringify(savedDiagnoses));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [savedDiagnoses]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setConsentTelemetry = (consent: boolean) => {
    setConsentTelemetryState(consent);
    localStorage.setItem('embudo_telemetry_consent', String(consent));
  };

  const saveDiagnosis = (item: Omit<UserSavedDiagnosis, 'id' | 'createdAt'>) => {
    const newEntry: UserSavedDiagnosis = {
      ...item,
      id: 'diag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setSavedDiagnoses(prev => [newEntry, ...prev.slice(0, 49)]); // Keep last 50
  };

  const deleteDiagnosis = (id: string) => {
    setSavedDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  const clearAllHistory = () => {
    setSavedDiagnoses([]);
    localStorage.removeItem('embudo_history');
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
  };

  const loginAsAdmin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setIsAdmin(true);
        setAdminToken(data.token);
        localStorage.setItem('embudo_admin_token', data.token);
        return true;
      }
      return false;
    } catch {
      // Local fallback for offline/development
      if (password === 'admin123' || password === 'embudo-admin-2026') {
        setIsAdmin(true);
        setAdminToken('embudo-admin-2026');
        localStorage.setItem('embudo_admin_token', 'embudo-admin-2026');
        return true;
      }
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem('embudo_admin_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: !user,
        isAdmin,
        adminToken,
        isDarkMode,
        toggleDarkMode,
        savedDiagnoses,
        saveDiagnosis,
        deleteDiagnosis,
        clearAllHistory,
        consentTelemetry,
        setConsentTelemetry,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        loginAsAdmin,
        logoutAdmin
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
