import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export const createTimelineTemplate = async (templateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const templateId = `template_${Date.now()}`;
    const template = {
      id: templateId,
      name: templateData.name,
      type: templateData.type,
      duration: templateData.duration,
      baseAmount: templateData.baseAmount,
      holidays: templateData.holidays || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'timeline_templates', templateId), template);
    return { success: true, template };
  } catch (error) {
    console.error('Error creating timeline template:', error);
    return { success: false, error: error.message };
  }
};

export const getTimelineTemplates = async () => {
  try {
    if (!db) {
      return { success: true, templates: [] };
    }

    const templatesRef = collection(db, 'timeline_templates');
    const querySnapshot = await getDocs(templatesRef);
    
    const templates = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, templates };
  } catch (error) {
    console.error('Error getting timeline templates:', error);
    return { success: false, error: error.message, templates: [] };
  }
};

export const createActiveTimeline = async (timelineData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const periods = generatePeriods(timelineData);
    const activeTimeline = {
      id: timelineData.id,
      name: timelineData.name,
      type: timelineData.type,
      duration: timelineData.duration,
      baseAmount: timelineData.baseAmount,
      totalAmount: timelineData.totalAmount,
      amountPerPeriod: timelineData.amountPerPeriod,
      startDate: timelineData.startDate,
      holidays: timelineData.holidays || [],
      periods: periods,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'active_timeline', 'current'), activeTimeline);
    return { success: true, timeline: activeTimeline };
  } catch (error) {
    console.error('Error creating active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const getActiveTimeline = async () => {
  try {
    if (!db) {
      return { success: false, error: 'Firestore tidak tersedia' };
    }

    const docRef = doc(db, 'active_timeline', 'current');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, timeline: docSnap.data() };
    } else {
      return { success: false, error: 'Timeline aktif tidak ditemukan' };
    }
  } catch (error) {
    console.error('Error getting active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const deleteActiveTimeline = async () => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const batch = writeBatch(db);

    Object.keys(timeline.periods).forEach(periodKey => {
      const periodRef = doc(db, 'payments', timeline.id, 'periods', periodKey);
      batch.delete(periodRef);
    });

    const timelineRef = doc(db, 'active_timeline', 'current');
    batch.delete(timelineRef);

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error deleting active timeline:', error);
    return { success: false, error: error.message };
  }
};

export const generatePaymentsForTimeline = async (timelineId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const santriResult = await getAllSantri();
    if (!santriResult.success) {
      throw new Error('Gagal mengambil data santri');
    }

    const batch = writeBatch(db);
    const santriList = santriResult.data;

    Object.keys(timeline.periods).forEach(periodKey => {
      const period = timeline.periods[periodKey];
      if (period.active) {
        santriList.forEach(santri => {
          const paymentId = `${santri.id}_${periodKey}`;
          const paymentRef = doc(db, 'payments', timelineId, 'periods', periodKey, 'santri_payments', santri.id);
          
          const paymentData = {
            id: paymentId,
            santriId: santri.id,
            santriName: santri.namaSantri,
            waliName: santri.namaWali,
            period: periodKey,
            periodLabel: period.label,
            amount: period.amount,
            status: 'belum_bayar',
            paymentDate: null,
            paymentMethod: null,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          batch.set(paymentRef, paymentData);
        });
      }
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error generating payments:', error);
    return { success: false, error: error.message };
  }
};

export const getPaymentsByPeriod = async (timelineId, periodKey) => {
  try {
    if (!db) {
      return { success: true, payments: [] };
    }

    const paymentsRef = collection(db, 'payments', timelineId, 'periods', periodKey, 'santri_payments');
    const querySnapshot = await getDocs(paymentsRef);
    
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, payments };
  } catch (error) {
    console.error('Error getting payments by period:', error);
    return { success: false, error: error.message, payments: [] };
  }
};

export const updatePaymentStatus = async (timelineId, periodKey, santriId, updateData) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const paymentRef = doc(db, 'payments', timelineId, 'periods', periodKey, 'santri_payments', santriId);
    const updatePayload = {
      ...updateData,
      updatedAt: new Date()
    };

    await updateDoc(paymentRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: error.message };
  }
};

export const resetTimelinePayments = async (timelineId) => {
  try {
    if (!db) {
      throw new Error('Firestore belum diinisialisasi');
    }

    const timelineResult = await getActiveTimeline();
    if (!timelineResult.success) {
      throw new Error('Timeline aktif tidak ditemukan');
    }

    const timeline = timelineResult.timeline;
    const batch = writeBatch(db);

    Object.keys(timeline.periods).forEach(periodKey => {
      const periodRef = doc(db, 'payments', timelineId, 'periods', periodKey);
      batch.delete(periodRef);
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error resetting timeline payments:', error);
    return { success: false, error: error.message };
  }
};

const generatePeriods = (timelineData) => {
  const periods = {};
  const activePeriods = timelineData.duration - (timelineData.holidays?.length || 0);
  const amountPerPeriod = Math.ceil(timelineData.totalAmount / activePeriods);

  for (let i = 1; i <= timelineData.duration; i++) {
    const isHoliday = timelineData.holidays?.includes(i) || false;
    const periodKey = `period_${i}`;
    
    periods[periodKey] = {
      number: i,
      label: getPeriodLabel(timelineData.type, i, timelineData.startDate),
      active: !isHoliday,
      amount: isHoliday ? 0 : amountPerPeriod,
      isHoliday: isHoliday
    };
  }

  return periods;
};

const getPeriodLabel = (type, number, startDate) => {
  const start = new Date(startDate);
  
  switch (type) {
    case 'yearly':
      const month = new Date(start.getFullYear(), start.getMonth() + (number - 1), 1);
      return month.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    case 'monthly':
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (number - 1));
      return day.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    case 'weekly':
      const week = new Date(start.getTime() + ((number - 1) * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(week.getTime() + (6 * 24 * 60 * 60 * 1000));
      return `Minggu ${number} (${week.toLocaleDateString('id-ID')} - ${weekEnd.toLocaleDateString('id-ID')})`;
    
    default:
      return `Periode ${number}`;
  }
};

const getAllSantri = async () => {
  try {
    if (!db) {
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

    return { success: true, data: santriList };
  } catch (error) {
    console.error('Error getting santri data:', error);
    return { success: false, error: error.message, data: [] };
  }
};