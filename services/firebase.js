import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAqIV61dH1wyNNLMT0uI5otGzRVv-FMK3E",
  authDomain: "haikal-99548.firebaseapp.com",
  projectId: "haikal-99548",
  storageBucket: "haikal-99548.firebasestorage.app",
  messagingSenderId: "567375244771",
  appId: "1:567375244771:web:49a2e0d539e61eea8c44d6",
  measurementId: "G-TS9YVYQDKB"
};

let app;
let auth;
let db;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      console.warn('Auth initialization error:', error);
      auth = getAuth(app);
    }
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.error('Firestore initialization error:', error);
    db = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null;
  auth = null;
  db = null;
}

export { auth, db, app };