import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from './firebase';

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
      role: profileData.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (profileData.role === 'admin') {
      userProfile.nama = profileData.nama;
      userProfile.noHp = profileData.noHp;
    } else if (profileData.role === 'user') {
      userProfile.namaSantri = profileData.namaSantri;
      userProfile.namaWali = profileData.namaWali;
      userProfile.noHpWali = profileData.noHpWali;
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

export const getAllSantri = async () => {
  try {
    if (!db) {
      console.warn('Firestore belum diinisialisasi, return empty array');
      return { success: true, data: [] };
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'));
    const querySnapshot = await getDocs(q);
    
    const santriList = [];
    querySnapshot.forEach((doc) => {
      santriList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    santriList.sort((a, b) => a.namaSantri.localeCompare(b.namaSantri));

    return { success: true, data: santriList };
  } catch (error) {
    console.error('Error mengambil data santri:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateSantriRFID = async (santriId, rfidCode) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const santriRef = doc(db, 'users', santriId);
    await updateDoc(santriRef, {
      rfidSantri: rfidCode,
      updatedAt: new Date()
    });

    console.log('RFID santri berhasil diupdate');
    return { success: true };
  } catch (error) {
    console.error('Error update RFID santri:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSantri = async (santriId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const userRef = doc(db, 'users', santriId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Data santri tidak ditemukan');
    }

    const userData = userDoc.data();
    const userEmail = userData.email;

    await deleteDoc(userRef);
    console.log('Data santri berhasil dihapus dari Firestore');

    if (auth && userEmail) {
      try {
        const userRecord = await auth.getUserByEmail(userEmail);
        if (userRecord) {
          await deleteUser(userRecord);
          console.log('User auth berhasil dihapus');
        }
      } catch (authError) {
        console.warn('User auth tidak ditemukan atau sudah terhapus:', authError.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error menghapus santri:', error);
    return { success: false, error: error.message };
  }
};