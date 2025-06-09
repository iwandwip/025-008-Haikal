import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const PAIRING_COLLECTION = 'rfid_pairing';
const PAIRING_DOC_ID = 'current_session';

export const startPairing = async (santriId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const pairingData = {
      isActive: true,
      santriId: santriId,
      startTime: new Date(),
      rfidCode: null,
      status: 'waiting'
    };

    await setDoc(doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID), pairingData);
    
    setTimeout(async () => {
      try {
        const currentDoc = await getDoc(doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID));
        if (currentDoc.exists() && currentDoc.data().santriId === santriId) {
          await cancelPairing();
        }
      } catch (error) {
        console.error('Error auto-canceling pairing:', error);
      }
    }, 30000);

    return { success: true };
  } catch (error) {
    console.error('Error starting pairing:', error);
    return { success: false, error: error.message };
  }
};

export const cancelPairing = async () => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const docRef = doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        isActive: false,
        status: 'cancelled',
        cancelledTime: new Date()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error canceling pairing:', error);
    return { success: false, error: error.message };
  }
};

export const getPairingStatus = async () => {
  try {
    if (!db) {
      return null;
    }

    const docRef = doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isActive) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting pairing status:', error);
    return null;
  }
};

export const listenToPairingData = (callback) => {
  if (!db) {
    console.warn('Firestore belum diinisialisasi, skip listener');
    return null;
  }

  try {
    const docRef = doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.rfidCode && data.status === 'received' && data.isActive) {
          callback(data.rfidCode);
        }
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up pairing listener:', error);
    return null;
  }
};

export const updateRFIDCode = async (rfidCode) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const docRef = doc(db, PAIRING_COLLECTION, PAIRING_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().isActive) {
      await updateDoc(docRef, {
        rfidCode: rfidCode,
        status: 'received',
        receivedTime: new Date()
      });
      return { success: true };
    }

    return { success: false, error: 'Tidak ada session pairing yang aktif' };
  } catch (error) {
    console.error('Error updating RFID code:', error);
    return { success: false, error: error.message };
  }
};