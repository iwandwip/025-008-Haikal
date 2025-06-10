import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getActiveTimeline } from './timelineService';

export const getAllUsersPaymentStatus = async () => {
  try {
    if (!db) {
      return { success: true, users: [], timeline: null };
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      return { 
        success: false, 
        error: 'Timeline aktif tidak ditemukan', 
        users: [], 
        timeline: null 
      };
    }

    const timeline = timelineResult.timeline;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'));
    const usersSnapshot = await getDocs(q);
    
    const usersWithPaymentStatus = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      const paymentSummary = await getUserPaymentSummary(userId, timeline);
      
      usersWithPaymentStatus.push({
        id: userId,
        ...userData,
        paymentSummary
      });
    }

    usersWithPaymentStatus.sort((a, b) => {
      if (a.namaSantri && b.namaSantri) {
        return a.namaSantri.localeCompare(b.namaSantri);
      }
      return 0;
    });

    return { success: true, users: usersWithPaymentStatus, timeline };
  } catch (error) {
    console.error('Error getting all users payment status:', error);
    return { success: false, error: error.message, users: [], timeline: null };
  }
};

export const getUserPaymentSummary = async (userId, timeline) => {
  try {
    const allPayments = [];
    
    for (const periodKey of Object.keys(timeline.periods)) {
      const period = timeline.periods[periodKey];
      if (period.active) {
        try {
          const paymentsRef = collection(
            db, 
            'payments', 
            timeline.id, 
            'periods', 
            periodKey, 
            'santri_payments'
          );
          
          const q = query(paymentsRef, where('santriId', '==', userId));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            allPayments.push({
              id: `${userId}_${periodKey}`,
              santriId: userId,
              period: periodKey,
              amount: period.amount,
              status: 'belum_bayar',
              paymentDate: null,
              periodData: period
            });
          } else {
            querySnapshot.forEach((doc) => {
              const paymentData = doc.data();
              allPayments.push({
                id: doc.id,
                ...paymentData,
                periodData: period
              });
            });
          }
        } catch (periodError) {
          console.warn(`Error loading period ${periodKey} for user ${userId}:`, periodError);
          allPayments.push({
            id: `${userId}_${periodKey}`,
            santriId: userId,
            period: periodKey,
            amount: period.amount,
            status: 'belum_bayar',
            paymentDate: null,
            periodData: period
          });
        }
      }
    }

    const total = allPayments.length;
    const lunas = allPayments.filter(p => p.status === 'lunas').length;
    const belumBayar = allPayments.filter(p => p.status === 'belum_bayar').length;
    const terlambat = allPayments.filter(p => p.status === 'terlambat').length;
    
    const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidAmount = allPayments
      .filter(p => p.status === 'lunas')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;

    const progressPercentage = total > 0 ? Math.round((lunas / total) * 100) : 0;

    return {
      total,
      lunas,
      belumBayar,
      terlambat,
      totalAmount,
      paidAmount,
      unpaidAmount,
      progressPercentage,
      lastPaymentDate: getLastPaymentDate(allPayments)
    };
  } catch (error) {
    console.error('Error getting user payment summary:', error);
    return {
      total: 0,
      lunas: 0,
      belumBayar: 0,
      terlambat: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      progressPercentage: 0,
      lastPaymentDate: null
    };
  }
};

export const getUserDetailedPayments = async (userId) => {
  try {
    if (!db) {
      return { success: true, payments: [], timeline: null };
    }

    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan', payments: [], timeline: null };
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      return { 
        success: false, 
        error: 'Timeline aktif tidak ditemukan', 
        payments: [], 
        timeline: null 
      };
    }

    const timeline = timelineResult.timeline;
    const allPayments = [];

    for (const periodKey of Object.keys(timeline.periods)) {
      const period = timeline.periods[periodKey];
      if (period.active) {
        try {
          const paymentsRef = collection(
            db, 
            'payments', 
            timeline.id, 
            'periods', 
            periodKey, 
            'santri_payments'
          );
          
          const q = query(paymentsRef, where('santriId', '==', userId));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            allPayments.push({
              id: `${userId}_${periodKey}`,
              santriId: userId,
              period: periodKey,
              periodLabel: period.label,
              amount: period.amount,
              status: 'belum_bayar',
              paymentDate: null,
              paymentMethod: null,
              notes: '',
              periodData: period,
              periodKey: periodKey,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            querySnapshot.forEach((doc) => {
              const paymentData = doc.data();
              allPayments.push({
                id: doc.id,
                ...paymentData,
                periodData: period,
                periodKey: periodKey
              });
            });
          }
        } catch (periodError) {
          console.warn(`Error loading period ${periodKey}:`, periodError);
          allPayments.push({
            id: `${userId}_${periodKey}`,
            santriId: userId,
            period: periodKey,
            periodLabel: period.label,
            amount: period.amount,
            status: 'belum_bayar',
            paymentDate: null,
            paymentMethod: null,
            notes: '',
            periodData: period,
            periodKey: periodKey,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    allPayments.sort((a, b) => {
      const periodA = parseInt(a.periodKey.replace('period_', ''));
      const periodB = parseInt(b.periodKey.replace('period_', ''));
      return periodA - periodB;
    });

    return { success: true, payments: allPayments, timeline };
  } catch (error) {
    console.error('Error getting user detailed payments:', error);
    return { success: false, error: error.message, payments: [], timeline: null };
  }
};

export const updateUserPaymentStatus = async (timelineId, periodKey, santriId, updateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    if (!timelineId || !periodKey || !santriId) {
      throw new Error('Parameter tidak lengkap untuk update payment');
    }

    const paymentRef = doc(
      db, 
      'payments', 
      timelineId, 
      'periods', 
      periodKey, 
      'santri_payments', 
      santriId
    );

    const updatePayload = {
      ...updateData,
      updatedAt: new Date()
    };

    try {
      await updateDoc(paymentRef, updatePayload);
    } catch (updateError) {
      if (updateError.code === 'not-found') {
        const timelineResult = await getActiveTimeline();
        if (timelineResult.success) {
          const timeline = timelineResult.timeline;
          const period = timeline.periods[periodKey];
          
          if (period) {
            const newPaymentData = {
              id: `${santriId}_${periodKey}`,
              santriId: santriId,
              period: periodKey,
              periodLabel: period.label,
              amount: period.amount,
              ...updatePayload,
              createdAt: new Date()
            };

            await setDoc(paymentRef, newPaymentData);
          } else {
            throw new Error('Period tidak ditemukan dalam timeline');
          }
        } else {
          throw new Error('Timeline aktif tidak ditemukan');
        }
      } else {
        throw updateError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user payment status:', error);
    return { success: false, error: error.message };
  }
};

const getLastPaymentDate = (payments) => {
  const paidPayments = payments.filter(p => p.status === 'lunas' && p.paymentDate);
  if (paidPayments.length === 0) return null;
  
  const sortedPayments = paidPayments.sort((a, b) => {
    const dateA = new Date(a.paymentDate);
    const dateB = new Date(b.paymentDate);
    return dateB - dateA;
  });
  
  return sortedPayments[0].paymentDate;
};