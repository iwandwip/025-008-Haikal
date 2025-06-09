import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './userService';

const handleAuthError = (error) => {
  const errorMessages = {
    'auth/user-not-found': 'No user found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email is already registered.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/configuration-not-found': 'Firebase configuration error. Please check setup.',
  };
  return errorMessages[error.code] || `Authentication error: ${error.message}`;
};

const isAdminEmail = (email) => {
  return email === 'admin@gmail.com';
};

export const signInWithEmail = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your configuration.');
    }
    
    console.log('Attempting to sign in with email:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful');
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: handleAuthError(error) };
  }
};

export const signUpWithEmail = async (email, password, profileData) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please check your configuration.');
    }

    console.log('Attempting to create account for:', email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    let profilePayload;
    
    if (isAdminEmail(email)) {
      profilePayload = {
        email,
        name: 'Admin',
        role: 'admin',
        isAdmin: true
      };
    } else {
      profilePayload = {
        email,
        ...profileData,
        role: 'user',
        isAdmin: false
      };
    }

    const profileResult = await createUserProfile(result.user.uid, profilePayload);

    if (!profileResult.success) {
      try {
        await result.user.delete();
      } catch (deleteError) {
        console.error('Error deleting user after profile creation failure:', deleteError);
      }
      throw new Error(profileResult.error);
    }

    console.log('Account created successfully');
    return { success: true, user: result.user, profile: profileResult.profile };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: handleAuthError(error) };
  }
};

export const signOutUser = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    await signOut(auth);
    console.log('Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: handleAuthError(error) };
  }
};

export const resetPassword = async (email) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent');
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: handleAuthError(error) };
  }
};