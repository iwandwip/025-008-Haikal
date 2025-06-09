import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './userService';

const handleAuthError = (error) => {
  const errorMessages = {
    'auth/user-not-found': 'Email tidak terdaftar.',
    'auth/wrong-password': 'Password salah.',
    'auth/email-already-in-use': 'Email sudah terdaftar.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/network-request-failed': 'Periksa koneksi internet Anda.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/user-disabled': 'Akun ini telah dinonaktifkan.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/configuration-not-found': 'Konfigurasi Firebase error.',
  };
  return errorMessages[error.code] || `Error: ${error.message}`;
};

export const signInWithEmail = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth belum diinisialisasi.');
    }
    
    console.log('Mencoba login dengan email:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login berhasil');
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error login:', error);
    return { success: false, error: handleAuthError(error) };
  }
};

export const signUpWithEmail = async (email, password, profileData) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth belum diinisialisasi.');
    }

    console.log('Mencoba membuat akun untuk:', email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    const profilePayload = {
      email,
      ...profileData,
    };

    const profileResult = await createUserProfile(result.user.uid, profilePayload);

    if (!profileResult.success) {
      try {
        await result.user.delete();
      } catch (deleteError) {
        console.error('Error menghapus user setelah gagal buat profil:', deleteError);
      }
      throw new Error(profileResult.error);
    }

    console.log('Akun berhasil dibuat');
    return { success: true, user: result.user, profile: profileResult.profile };
  } catch (error) {
    console.error('Error registrasi:', error);
    return { success: false, error: handleAuthError(error) };
  }
};

export const signOutUser = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth belum diinisialisasi');
    }
    await signOut(auth);
    console.log('Logout berhasil');
    return { success: true };
  } catch (error) {
    console.error('Error logout:', error);
    return { success: false, error: handleAuthError(error) };
  }
};