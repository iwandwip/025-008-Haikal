import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getActiveTimeline } from './timelineService';

export const getWaliPaymentHistory = async (santriId) => {
  try {
    if (!db) {
      return { success: true, payments: [], timeline: null };
    }

    if (!santriId) {
      return { success: false, error: 'Santri ID tidak ditemukan', payments: [], timeline: null };
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
          
          const q = query(paymentsRef, where('santriId', '==', santriId));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            allPayments.push({
              id: `${santriId}_${periodKey}`,
              santriId: santriId,
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
            id: `${santriId}_${periodKey}`,
            santriId: santriId,
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
    console.error('Error getting wali payment history:', error);
    return { success: false, error: error.message, payments: [], timeline: null };
  }
};

export const updateWaliPaymentStatus = async (timelineId, periodKey, santriId, updateData) => {
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
    console.error('Error updating wali payment status:', error);
    return { success: false, error: error.message };
  }
};

export const getPaymentSummary = (payments) => {
  const total = payments.length;
  const lunas = payments.filter(p => p.status === 'lunas').length;
  const belumBayar = payments.filter(p => p.status === 'belum_bayar').length;
  const terlambat = payments.filter(p => p.status === 'terlambat').length;
  
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = payments
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
    progressPercentage
  };
};