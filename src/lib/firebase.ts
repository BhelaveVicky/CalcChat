import { initializeApp, getApp, getApps } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVFp5Eq8gyLNQqRlUPV2SxTLRAf4OPAVc",
  authDomain: "linkup--app.firebaseapp.com",
  databaseURL: "https://linkup--app-default-rtdb.firebaseio.com",
  projectId: "linkup--app",
  storageBucket: "linkup--app.firebasestorage.app",
  messagingSenderId: "7898365037",
  appId: "1:7898365037:web:de9ab4a9ab1a80ad849364",
  measurementId: "G-1K8PZQ83SZ"
};

// Always initialize Firebase with provided credentials
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

console.log('🔥 Firebase App initialized:', firebaseApp);
console.log('🔥 Firebase Config:', firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
console.log('🔥 Firebase Auth initialized:', firebaseAuth);

// Set auth persistence to LOCAL to keep user logged in
setPersistence(firebaseAuth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('❌ Error setting auth persistence:', error);
  });

export const googleProvider = new GoogleAuthProvider();
console.log('🔥 Google Provider initialized:', googleProvider);

export const firebaseDb = getFirestore(firebaseApp);
console.log('🔥 Firestore initialized:', firebaseDb);

googleProvider.setCustomParameters({ prompt: 'select_account' });

// Export auth functions
export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut };
