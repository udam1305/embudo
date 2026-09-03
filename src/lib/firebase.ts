import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDtPK99-o3orVaECs4HQF-YZ1ue7-xAURg",
  authDomain: "embudo-a7011.firebaseapp.com",
  projectId: "embudo-a7011",
  storageBucket: "embudo-a7011.firebasestorage.app",
  messagingSenderId: "815397680038",
  appId: "1:815397680038:web:ee4d0338a94367c1311567"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;
