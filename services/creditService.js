import { 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export const getUserCreditBalance = async (userId) => {
  try {
    if (!db || !userId) return { success: true, balance: 0 };

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, balance: userData.creditBalance || 0 };
    }

    return { success: true, balance: 0 };
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return { success: false, error: error.message, balance: 0 };
  }
};

export const updateCreditBalance = async (userId, newBalance) => {
  try {
    if (!db || !userId) {
      throw new Error('Database atau User ID tidak tersedia');
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      creditBalance: Math.max(0, newBalance),
      lastCreditUpdate: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating credit balance:', error);
    return { success: false, error: error.message };
  }
};

export const addCreditTransaction = async (userId, transactionData) => {
  try {
    if (!db) {
      throw new Error('Database tidak tersedia');
    }

    const creditTransaction = {
      userId,
      amount: transactionData.amount,
      type: transactionData.type,
      description: transactionData.description,
      relatedPaymentId: transactionData.relatedPaymentId || null,
      periodsAffected: transactionData.periodsAffected || [],
      balanceBefore: transactionData.balanceBefore || 0,
      balanceAfter: transactionData.balanceAfter || 0,
      timestamp: new Date(),
      metadata: transactionData.metadata || {}
    };

    const creditRef = collection(db, 'credit_transactions');
    const docRef = await addDoc(creditRef, creditTransaction);

    return { success: true, transactionId: docRef.id };
  } catch (error) {
    console.error('Error adding credit transaction:', error);
    return { success: false, error: error.message };
  }
};

export const getCreditHistory = async (userId, limit = 20) => {
  try {
    if (!db || !userId) return { success: true, transactions: [] };

    const creditRef = collection(db, 'credit_transactions');
    const q = query(
      creditRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions = [];

    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, transactions: transactions.slice(0, limit) };
  } catch (error) {
    console.error('Error getting credit history:', error);
    return { success: false, error: error.message, transactions: [] };
  }
};

export const calculatePaymentAllocation = (paymentAmount, periods, currentCreditBalance = 0) => {
  try {
    const totalAvailable = paymentAmount + currentCreditBalance;
    const unpaidPeriods = periods.filter(p => p.status !== 'lunas').sort((a, b) => {
      const periodA = parseInt(a.periodKey.replace('period_', ''));
      const periodB = parseInt(b.periodKey.replace('period_', ''));
      return periodA - periodB;
    });

    let remainingAmount = totalAvailable;
    let creditUsed = 0;
    const allocations = [];
    const affectedPeriods = [];

    for (const period of unpaidPeriods) {
      if (remainingAmount <= 0) break;

      const requiredAmount = period.amount;
      const periodCreditApplied = Math.min(currentCreditBalance - creditUsed, requiredAmount);
      const periodPaymentNeeded = requiredAmount - periodCreditApplied;

      if (remainingAmount >= requiredAmount) {
        allocations.push({
          periodKey: period.periodKey,
          periodLabel: period.periodData?.label || `Periode ${period.periodKey.split('_')[1]}`,
          status: 'lunas',
          totalAmount: requiredAmount,
          creditUsed: periodCreditApplied,
          newPayment: periodPaymentNeeded,
          remainingAfter: 0
        });

        affectedPeriods.push(period.periodKey);
        remainingAmount -= requiredAmount;
        creditUsed += periodCreditApplied;
      } else {
        break;
      }
    }

    const totalCreditUsed = Math.min(creditUsed, currentCreditBalance);
    const totalPaymentUsed = paymentAmount - Math.max(0, paymentAmount + currentCreditBalance - (totalCreditUsed + allocations.reduce((sum, a) => sum + a.newPayment, 0)));
    const newCreditBalance = Math.max(0, totalAvailable - allocations.reduce((sum, a) => sum + a.totalAmount, 0));

    return {
      success: true,
      allocations,
      summary: {
        paymentAmount,
        creditUsed: totalCreditUsed,
        paymentUsed: totalPaymentUsed,
        newCreditGenerated: newCreditBalance > currentCreditBalance ? newCreditBalance - currentCreditBalance : 0,
        finalCreditBalance: newCreditBalance,
        periodsCompleted: allocations.length,
        affectedPeriods
      }
    };
  } catch (error) {
    console.error('Error calculating payment allocation:', error);
    return { success: false, error: error.message };
  }
};

export const processPaymentWithCredit = async (userId, timelineId, paymentAmount, periods) => {
  try {
    if (!db) {
      throw new Error('Database tidak tersedia');
    }

    const creditResult = await getUserCreditBalance(userId);
    if (!creditResult.success) {
      throw new Error('Gagal mengambil credit balance');
    }

    const currentCredit = creditResult.balance;
    const allocation = calculatePaymentAllocation(paymentAmount, periods, currentCredit);

    if (!allocation.success || allocation.allocations.length === 0) {
      throw new Error('Tidak dapat mengalokasikan pembayaran');
    }

    const batch = writeBatch(db);
    const paymentId = `payment_${Date.now()}_${userId}`;

    for (const alloc of allocation.allocations) {
      const paymentRef = doc(
        db,
        'payments',
        timelineId,
        'periods',
        alloc.periodKey,
        'santri_payments',
        userId
      );

      const paymentData = {
        status: 'lunas',
        paymentDate: new Date().toISOString(),
        paymentMethod: 'online',
        creditUsed: alloc.creditUsed,
        actualPayment: alloc.newPayment,
        totalAmount: alloc.totalAmount,
        paymentId: paymentId,
        updatedAt: new Date()
      };

      batch.update(paymentRef, paymentData);
    }

    const newBalance = allocation.summary.finalCreditBalance;
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      creditBalance: newBalance,
      lastCreditUpdate: new Date()
    });

    await batch.commit();

    await addCreditTransaction(userId, {
      amount: allocation.summary.creditUsed > 0 ? -allocation.summary.creditUsed : allocation.summary.newCreditGenerated,
      type: allocation.summary.creditUsed > 0 ? 'usage' : 'earned',
      description: allocation.summary.creditUsed > 0 
        ? `Credit digunakan untuk ${allocation.allocations.length} periode`
        : `Credit dari pembayaran Rp ${paymentAmount.toLocaleString('id-ID')}`,
      relatedPaymentId: paymentId,
      periodsAffected: allocation.summary.affectedPeriods,
      balanceBefore: currentCredit,
      balanceAfter: newBalance,
      metadata: {
        paymentAmount,
        periodsCompleted: allocation.allocations.length
      }
    });

    return {
      success: true,
      allocation: allocation.allocations,
      summary: allocation.summary,
      paymentId
    };
  } catch (error) {
    console.error('Error processing payment with credit:', error);
    return { success: false, error: error.message };
  }
};

export const getReducedAmounts = (periods, creditBalance) => {
  if (!creditBalance || creditBalance <= 0) return periods;

  let remainingCredit = creditBalance;
  const unpaidPeriods = periods.filter(p => p.status !== 'lunas').sort((a, b) => {
    const periodA = parseInt(a.periodKey.replace('period_', ''));
    const periodB = parseInt(b.periodKey.replace('period_', ''));
    return periodA - periodB;
  });

  return periods.map(period => {
    if (period.status === 'lunas' || remainingCredit <= 0) {
      return period;
    }

    const creditApplicable = Math.min(remainingCredit, period.amount);
    remainingCredit -= creditApplicable;

    return {
      ...period,
      creditApplied: creditApplicable,
      effectiveAmount: period.amount - creditApplicable
    };
  });
};