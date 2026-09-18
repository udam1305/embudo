import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { UserSavedDiagnosis } from '../types';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isAdmin: boolean;
  adminToken: string | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  savedDiagnoses: UserSavedDiagnosis[];
  saveDiagnosis: (item: Omit<UserSavedDiagnosis, 'id' | 'createdAt'>) => Promise<void>;
  deleteDiagnosis: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  consentTelemetry: boolean;
  setConsentTelemetry: (consent: boolean) => void;
  isCloudSynced: boolean;
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
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
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

  const unsubscribeDiagnosesRef = useRef<(() => void) | null>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('embudo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('embudo_theme', 'light');
    }
  }, [isDarkMode]);

  // Firebase auth state observer & Firestore User Data Sync
  useEffect(() => {
    try {
      const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);

        // Clean up previous Firestore listener
        if (unsubscribeDiagnosesRef.current) {
          unsubscribeDiagnosesRef.current();
          unsubscribeDiagnosesRef.current = null;
        }

        if (currentUser) {
          setIsCloudSynced(true);

          // Check for primary admin email or previously verified admin token
          const isPrimaryAdmin = currentUser.email?.toLowerCase() === 'adamarmoza@gmail.com';
          const savedAdminToken = localStorage.getItem('embudo_admin_token');

          if (isPrimaryAdmin || savedAdminToken === 'embudo-admin-2026') {
            setIsAdmin(true);
            setAdminToken('embudo-admin-2026');
            localStorage.setItem('embudo_admin_token', 'embudo-admin-2026');
          } else {
            setIsAdmin(false);
            setAdminToken(null);
            localStorage.removeItem('embudo_admin_token');
          }

          const userRef = doc(db, 'users', currentUser.uid);

          // 1. Sync User Profile in Firestore
          try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
                photoURL: currentUser.photoURL || '',
                role: isPrimaryAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                preferences: {
                  theme: isDarkMode ? 'dark' : 'light',
                  consentTelemetry: consentTelemetry
                }
              });
            } else {
              const data = userSnap.data();
              if (data?.role === 'admin' || isPrimaryAdmin) {
                setIsAdmin(true);
                setAdminToken('embudo-admin-2026');
                localStorage.setItem('embudo_admin_token', 'embudo-admin-2026');
              }
              if (data?.preferences?.theme) {
                setIsDarkMode(data.preferences.theme === 'dark');
              }
              if (typeof data?.preferences?.consentTelemetry === 'boolean') {
                setConsentTelemetryState(data.preferences.consentTelemetry);
              }
              await setDoc(
                userRef,
                {
                  lastLoginAt: new Date().toISOString(),
                  email: currentUser.email || '',
                  displayName: currentUser.displayName || data.displayName || currentUser.email?.split('@')[0] || 'Usuario',
                  ...(isPrimaryAdmin ? { role: 'admin' } : {})
                },
                { merge: true }
              );
            }
          } catch (profileErr) {
            console.warn('Could not sync user profile to Firestore:', profileErr);
          }

          // 2. Auto-migrate existing guest local history if available
          try {
            const local = localStorage.getItem('embudo_history');
            if (local) {
              const parsed: UserSavedDiagnosis[] = JSON.parse(local);
              if (parsed.length > 0) {
                for (const item of parsed) {
                  await setDoc(
                    doc(db, 'users', currentUser.uid, 'diagnoses', item.id),
                    {
                      id: item.id,
                      userId: currentUser.uid,
                      title: item.title,
                      createdAt: item.createdAt,
                      config: item.config,
                      result: item.result,
                      isFavorite: !!item.isFavorite
                    },
                    { merge: true }
                  );
                }
              }
            }
          } catch (migErr) {
            console.warn('Guest history migration note:', migErr);
          }

          // 3. Realtime Listener on User's Diagnoses Collection
          try {
            const diagCol = collection(db, 'users', currentUser.uid, 'diagnoses');
            const unsub = onSnapshot(
              diagCol,
              (snapshot) => {
                const cloudList: UserSavedDiagnosis[] = [];
                snapshot.forEach((dSnap) => {
                  const data = dSnap.data();
                  cloudList.push({
                    id: dSnap.id,
                    title: data.title || 'Diagnóstico',
                    createdAt: data.createdAt || new Date().toISOString(),
                    config: data.config,
                    result: data.result,
                    isFavorite: !!data.isFavorite
                  });
                });
                cloudList.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
                setSavedDiagnoses(cloudList);
                localStorage.setItem('embudo_history', JSON.stringify(cloudList));
              },
              (err) => {
                console.warn('Firestore diagnoses listener:', err);
                try {
                  handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}/diagnoses`);
                } catch {
                  // Fallback to local storage if Firestore rules or offline
                }
              }
            );
            unsubscribeDiagnosesRef.current = unsub;
          } catch (listenerErr) {
            console.warn('Diagnoses subscription fallback to local:', listenerErr);
          }
        } else {
          setIsCloudSynced(false);
          setIsAdmin(false);
          setAdminToken(null);
          localStorage.removeItem('embudo_admin_token');
          // Restore from local storage for guest
          try {
            const local = localStorage.getItem('embudo_history');
            setSavedDiagnoses(local ? JSON.parse(local) : []);
          } catch {
            setSavedDiagnoses([]);
          }
        }
      });

      return () => {
        unsubscribeAuth();
        if (unsubscribeDiagnosesRef.current) {
          unsubscribeDiagnosesRef.current();
        }
      };
    } catch (e) {
      console.warn('Firebase Auth fallback enabled:', e);
    }
  }, []);

  // Save history to local storage backup
  useEffect(() => {
    try {
      localStorage.setItem('embudo_history', JSON.stringify(savedDiagnoses));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [savedDiagnoses]);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { preferences: { theme: nextMode ? 'dark' : 'light' } },
        { merge: true }
      ).catch(() => {});
    }
  };

  const setConsentTelemetry = (consent: boolean) => {
    setConsentTelemetryState(consent);
    localStorage.setItem('embudo_telemetry_consent', String(consent));
    if (user) {
      setDoc(
        doc(db, 'users', user.uid),
        { preferences: { consentTelemetry: consent } },
        { merge: true }
      ).catch(() => {});
    }
  };

  const saveDiagnosis = async (item: Omit<UserSavedDiagnosis, 'id' | 'createdAt'>) => {
    const newId = 'diag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newEntry: UserSavedDiagnosis = {
      ...item,
      id: newId,
      createdAt
    };

    // Optimistically update local state
    setSavedDiagnoses((prev) => [newEntry, ...prev.slice(0, 49)]);

    // If user is authenticated, persist to Firestore
    if (user) {
      try {
        const diagRef = doc(db, 'users', user.uid, 'diagnoses', newId);
        await setDoc(diagRef, {
          id: newId,
          userId: user.uid,
          title: item.title,
          createdAt,
          config: item.config,
          result: item.result,
          isFavorite: !!item.isFavorite
        });
      } catch (err) {
        console.error('Failed to save diagnosis to Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/diagnoses/${newId}`);
        } catch {
          // Gracefully continue with local backup
        }
      }
    }
  };

  const deleteDiagnosis = async (id: string) => {
    setSavedDiagnoses((prev) => prev.filter((d) => d.id !== id));

    if (user) {
      try {
        const diagRef = doc(db, 'users', user.uid, 'diagnoses', id);
        await deleteDoc(diagRef);
      } catch (err) {
        console.error('Failed to delete diagnosis from Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/diagnoses/${id}`);
        } catch {
          // Graceful fallback
        }
      }
    }
  };

  const clearAllHistory = async () => {
    const currentList = [...savedDiagnoses];
    setSavedDiagnoses([]);
    localStorage.removeItem('embudo_history');

    if (user) {
      try {
        const batch = writeBatch(db);
        currentList.forEach((d) => {
          const dRef = doc(db, 'users', user.uid, 'diagnoses', d.id);
          batch.delete(dRef);
        });
        await batch.commit();
      } catch (err) {
        console.error('Failed to clear Firestore diagnoses history:', err);
      }
    }
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
    if (unsubscribeDiagnosesRef.current) {
      unsubscribeDiagnosesRef.current();
      unsubscribeDiagnosesRef.current = null;
    }
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Signout note:', e);
    }
    setUser(null);
    setIsCloudSynced(false);
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem('embudo_admin_token');
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
        isCloudSynced,
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
