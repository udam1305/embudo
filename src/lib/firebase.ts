import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDtPK99-o3orVaECs4HQF-YZ1ue7-xAURg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "embudo-a7011.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "embudo-a7011",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "embudo-a7011.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "815397680038",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:815397680038:web:ee4d0338a94367c1311567"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
