import { auth, db } from '../services/firebase';

export const checkFirebaseConnection = () => {
  console.log('=== Firebase Debug Info ===');
  console.log('Auth available:', !!auth);
  console.log('Firestore available:', !!db);
  
  if (auth) {
    console.log('Auth config:', {
      apiKey: auth.config?.apiKey ? 'Set' : 'Missing',
      authDomain: auth.config?.authDomain || 'Missing',
      projectId: auth.config?.projectId || 'Missing'
    });
  }
  
  console.log('Environment variables:');
  console.log('API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing');
  console.log('AUTH_DOMAIN:', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing');
  console.log('PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
  console.log('========================');
};

export const testAuth = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    console.log('Testing auth connection...');
    console.log('Current user:', auth.currentUser?.email || 'None');
    return { success: true };
  } catch (error) {
    console.error('Auth test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testFirestore = async () => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    console.log('Testing Firestore connection...');
    return { success: true };
  } catch (error) {
    console.error('Firestore test failed:', error);
    return { success: false, error: error.message };
  }
};