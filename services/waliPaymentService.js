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
import { getActiveTimeline, calculatePaymentStatus } from './timelineService';
import { getUserCreditBalance, getReducedAmounts, processPaymentWithCredit } from './creditService';

let cachedPayments = new Map();
let cachedTimeline = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000;

const isCacheValid = () => {
  return cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

export const getWaliPaymentHistory = async (santriId) => {
  try {
    if (!db) {
      return { success: true, payments: [], timeline: null };
    }

    if (!santriId) {
      return { success: false, error: 'Santri ID tidak ditemukan', payments: [], timeline: null };
    }

    let timeline;
    const cacheKey = santriId;

    if (isCacheValid() && cachedTimeline && cachedPayments.has(cacheKey)) {
      const cachedData = cachedPayments.get(cacheKey);
      const creditResult = await getUserCreditBalance(santriId);
      const creditBalance = creditResult.success ? creditResult.balance : 0;
      
      const paymentsWithCredit = getReducedAmounts(cachedData, creditBalance);
      
      return {
        success: true,
        payments: paymentsWithCredit,
        timeline: cachedTimeline,
        creditBalance
      };
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

    timeline = timelineResult.timeline;
    const activePeriods = Object.keys(timeline.periods).filter(
      periodKey => timeline.periods[periodKey].active
    );

    const paymentPromises = activePeriods.map(async (periodKey) => {
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
        
        const period = timeline.periods[periodKey];
        
        if (querySnapshot.empty) {
          const payment = {
            id: `${santriId}_${periodKey}`,
            santriId: santriId,
            period: periodKey,
            periodLabel: period.label,
            amount: period.amount,
            dueDate: period.dueDate,
            status: 'belum_bayar',
            paymentDate: null,
            paymentMethod: null,
            notes: '',
            creditUsed: 0,
            actualPayment: 0,
            periodData: period,
            periodKey: periodKey,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          payment.status = calculatePaymentStatus(payment, timeline);
          return payment;
        } else {
          const paymentData = querySnapshot.docs[0].data();
          const payment = {
            id: querySnapshot.docs[0].id,
            ...paymentData,
            creditUsed: paymentData.creditUsed || 0,
            actualPayment: paymentData.actualPayment || paymentData.amount || period.amount,
            periodData: period,
            periodKey: periodKey
          };
          
          payment.status = calculatePaymentStatus(payment, timeline);
          return payment;
        }
      } catch (periodError) {
        console.warn(`Error loading period ${periodKey}:`, periodError);
        const period = timeline.periods[periodKey];
        const payment = {
          id: `${santriId}_${periodKey}`,
          santriId: santriId,
          period: periodKey,
          periodLabel: period.label,
          amount: period.amount,
          dueDate: period.dueDate,
          status: 'belum_bayar',
          paymentDate: null,
          paymentMethod: null,
          notes: '',
          creditUsed: 0,
          actualPayment: 0,
          periodData: period,
          periodKey: periodKey,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        payment.status = calculatePaymentStatus(payment, timeline);
        return payment;
      }
    });

    const allPayments = await Promise.all(paymentPromises);

    allPayments.sort((a, b) => {
      const periodA = parseInt(a.periodKey.replace('period_', ''));
      const periodB = parseInt(b.periodKey.replace('period_', ''));
      return periodA - periodB;
    });

    const creditResult = await getUserCreditBalance(santriId);
    const creditBalance = creditResult.success ? creditResult.balance : 0;
    
    const paymentsWithCredit = getReducedAmounts(allPayments, creditBalance);

    cachedPayments.set(cacheKey, allPayments);
    cachedTimeline = timeline;
    cacheTimestamp = Date.now();

    return { 
      success: true, 
      payments: paymentsWithCredit, 
      timeline,
      creditBalance 
    };
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
        const timeline = cachedTimeline || (await getActiveTimeline()).timeline;
        if (timeline) {
          const period = timeline.periods[periodKey];
          
          if (period) {
            const newPaymentData = {
              id: `${santriId}_${periodKey}`,
              santriId: santriId,
              period: periodKey,
              periodLabel: period.label,
              amount: period.amount,
              dueDate: period.dueDate,
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

    cachedPayments.delete(santriId);
    cacheTimestamp = null;

    return { success: true };
  } catch (error) {
    console.error('Error updating wali payment status:', error);
    return { success: false, error: error.message };
  }
};

export const processCustomPayment = async (santriId, timelineId, paymentAmount, paymentMethod, allPayments) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const result = await processPaymentWithCredit(santriId, timelineId, paymentAmount, allPayments);
    
    if (result.success) {
      cachedPayments.delete(santriId);
      cacheTimestamp = null;
      
      return {
        success: true,
        allocation: result.allocation,
        summary: result.summary,
        paymentId: result.paymentId
      };
    }

    return result;
  } catch (error) {
    console.error('Error processing custom payment:', error);
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

export const clearWaliCache = () => {
  cachedPayments.clear();
  cachedTimeline = null;
  cacheTimestamp = null;
};