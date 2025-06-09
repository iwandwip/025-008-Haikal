import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const createUserProfile = async (uid, profileData) => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, skip pembuatan profil');
      return { 
        success: true, 
        profile: { 
          id: uid, 
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      };
    }

    const userProfile = {
      id: uid,
      email: profileData.email,
      nama: profileData.nama,
      noHp: profileData.noHp,
      role: profileData.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (profileData.role === 'user') {
      userProfile.rfidSantri = profileData.rfidSantri || "";
    }

    await setDoc(doc(db, 'users', uid), userProfile);
    console.log('Profil user berhasil dibuat');
    return { success: true, profile: userProfile };
  } catch (error) {
    console.error('Error membuat profil user:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, return fallback profil');
      return { 
        success: false, 
        error: 'Firestore tidak tersedia' 
      };
    }

    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const profile = docSnap.data();
      return { success: true, profile };
    } else {
      return { success: false, error: 'Profil user tidak ditemukan' };
    }
  } catch (error) {
    console.error('Error mengambil profil user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, updates) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const updateData = { 
      ...updates,
      updatedAt: new Date()
    };

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updateData);

    console.log('Profil user berhasil diupdate');
    return { success: true };
  } catch (error) {
    console.error('Error update profil user:', error);
    return { success: false, error: error.message };
  }
};