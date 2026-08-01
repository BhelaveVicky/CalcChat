import { initializeApp, getApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyDlFexstmJH6mckND9UeLKspjlS6dEc_Hg',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'calcchat-app.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'calcchat-app',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'calcchat-app.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '882555211680',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:882555211680:web:53dddbf1c5c718e61b9ec5',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Use the default Firestore instance so the app does not depend on
// cross-tab persistence being available in sandboxed or single-tab sessions.
export const db = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

export { signInWithPopup, signOut };

