import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export const createDataEntry = async (userId, dataEntry) => {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, skipping data creation');
      return { success: false, error: 'Firestore not available' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const dataCollection = collection(db, 'users', userId, 'data');
    const docRef = await addDoc(dataCollection, {
      ...dataEntry,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { 
      success: true, 
      id: docRef.id,
      data: { id: docRef.id, ...dataEntry }
    };
  } catch (error) {
    console.error('Create data entry error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserData = async (userId, sortOrder = 'desc', startDate = null, endDate = null) => {
  try {
    if (!db) {
      console.warn('Firestore is not initialized, returning empty data');
      return { success: true, data: [] };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required', data: [] };
    }

    const dataCollection = collection(db, 'users', userId, 'data');
    let q = query(dataCollection);

    if (startDate && endDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      q = query(
        dataCollection,
        where('datetime', '>=', startDateTime.toISOString()),
        where('datetime', '<=', endDateTime.toISOString()),
        orderBy('datetime', sortOrder)
      );
    } else {
      q = query(
        dataCollection, 
        orderBy('datetime', sortOrder)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, data };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const updateDataEntry = async (userId, dataId, updates) => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    const dataDoc = doc(db, 'users', userId, 'data', dataId);
    await updateDoc(dataDoc, {
      ...updates,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Update data entry error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteDataEntry = async (userId, dataId) => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    const dataDoc = doc(db, 'users', userId, 'data', dataId);
    await deleteDoc(dataDoc);

    return { success: true };
  } catch (error) {
    console.error('Delete data entry error:', error);
    return { success: false, error: error.message };
  }
};

export const clearAllUserData = async (userId) => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    const dataCollection = collection(db, 'users', userId, 'data');
    const querySnapshot = await getDocs(dataCollection);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Clear all data error:', error);
    return { success: false, error: error.message };
  }
};

export const createBulkData = async (userId, dataEntries) => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }

    const results = [];
    for (const entry of dataEntries) {
      const result = await createDataEntry(userId, entry);
      if (result.success) {
        results.push(result.data);
      }
    }

    return { success: true, data: results };
  } catch (error) {
    console.error('Create bulk data error:', error);
    return { success: false, error: error.message };
  }
};