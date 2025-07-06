import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  runTransaction,
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { midtransService } from './midtransService';
import { timelineService } from './timelineService';
import { userService } from './userService';
import { waliPaymentService } from './waliPaymentService';
import { paymentStatusManager } from './paymentStatusManager';

/**
 * Digital Payment Service
 * Handles Midtrans digital payment integration dengan credit system compatibility
 * 
 * Features:
 * - Midtrans Snap integration
 * - Credit system compatibility 
 * - Mixed payment processing (digital + hardware + manual)
 * - Comprehensive payment tracking
 * - Real-time callback handling
 */

class DigitalPaymentService {
  constructor() {
    this._processingPayments = new Map(); // Track ongoing payments
  }

  /**
   * Create digital payment session
   * @param {Object} paymentRequest - Payment request data
   * @returns {Promise<Object>} Payment session result
   */
  async createDigitalPayment(paymentRequest) {
    try {
      const {
        santriId,
        amount,
        paymentType = 'timeline', // 'timeline' | 'custom'
        timelineId = null,
        periodKey = null,
        description = 'Pembayaran TPQ'
      } = paymentRequest;

      console.log(`Creating digital payment: ${santriId}, Amount: ${amount}`);

      // 1. Validate input
      const validation = this.validatePaymentRequest(paymentRequest);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Get student information
      const studentResult = await userService.getUserProfile(santriId);
      if (!studentResult.success) {
        throw new Error('Student not found');
      }

      const student = studentResult.profile;

      // 3. Untuk timeline payment, validate timeline dan period
      let timeline = null;
      let period = null;
      let finalAmount = amount;

      if (paymentType === 'timeline') {
        if (!timelineId || !periodKey) {
          throw new Error('Timeline ID and Period Key required for timeline payment');
        }

        const timelineResult = await timelineService.getTimelineById(timelineId);
        if (!timelineResult.success) {
          throw new Error('Timeline not found');
        }

        timeline = timelineResult.timeline;
        period = timeline.periods[periodKey];

        if (!period) {
          throw new Error('Period not found in timeline');
        }

        // Check if already paid
        const existingPayment = await this.getExistingPayment(timelineId, periodKey, santriId);
        if (existingPayment && existingPayment.status === 'lunas') {
          throw new Error('Payment period already completed');
        }

        // For timeline payment, amount bisa different dari required amount (flexible payment)
        finalAmount = amount;
      }

      // 4. Generate order ID
      const orderId = midtransService.generateOrderId(santriId, timelineId || 'custom', periodKey || 'payment');

      // 5. Prepare customer details
      const customerDetails = {
        firstName: student.namaSantri || student.nama || 'Santri',
        lastName: '',
        email: student.email || 'noreply@smartbisyaroh.com',
        phone: student.noHpWali || '08123456789'
      };

      // 6. Prepare item details
      const itemDetails = [{
        id: `payment-${timelineId || 'custom'}-${periodKey || Date.now()}`,
        price: finalAmount,
        quantity: 1,
        name: description,
        category: 'Education',
        merchant_name: 'TPQ Ibadurrohman'
      }];

      // 7. Generate Snap configuration
      const snapResult = await midtransService.generateSnapToken({
        orderId: orderId,
        grossAmount: finalAmount,
        customerDetails: customerDetails,
        itemDetails: itemDetails,
        metadata: {
          santriId: santriId,
          timelineId: timelineId,
          periodKey: periodKey,
          paymentType: paymentType,
          studentName: student.namaSantri || student.nama,
          originalAmount: finalAmount
        }
      });

      if (!snapResult.success) {
        throw new Error(snapResult.error);
      }

      // 8. Save payment session to database
      const paymentSession = {
        orderId: orderId,
        santriId: santriId,
        timelineId: timelineId,
        periodKey: periodKey,
        amount: finalAmount,
        paymentType: paymentType,
        description: description,
        status: 'pending_payment',
        
        // Student details
        studentName: student.namaSantri || student.nama,
        studentEmail: student.email,
        parentPhone: student.noHpWali,
        
        // Payment details
        snapConfig: snapResult.config,
        customerDetails: customerDetails,
        itemDetails: itemDetails,
        
        // Timeline context (if applicable)
        timelineContext: timeline ? {
          timelineName: timeline.name,
          periodLabel: period.label,
          periodDueDate: period.dueDate,
          periodAmount: period.amount
        } : null,
        
        // Tracking
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
      };

      const sessionRef = await addDoc(collection(db, 'digital_payment_sessions'), paymentSession);

      // 9. Track processing payment
      this._processingPayments.set(orderId, {
        sessionId: sessionRef.id,
        santriId: santriId,
        amount: finalAmount,
        createdAt: Date.now()
      });

      console.log(`Digital payment session created: ${orderId}`);

      return {
        success: true,
        session: {
          sessionId: sessionRef.id,
          orderId: orderId,
          amount: finalAmount,
          snapConfig: snapResult.config,
          description: description,
          customerDetails: customerDetails,
          expiresAt: paymentSession.expiresAt
        },
        student: student,
        timeline: timeline,
        period: period
      };

    } catch (error) {
      console.error('Create digital payment error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal membuat sesi pembayaran digital'
      };
    }
  }

  /**
   * Process Midtrans callback untuk payment verification
   * @param {Object} callbackData - Midtrans callback data
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentCallback(callbackData) {
    try {
      console.log('Processing payment callback:', callbackData);

      // 1. Validate callback data
      const validation = midtransService.validateCallback(callbackData);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const paymentResult = validation.result;
      const { orderId, isSuccessful, paymentStatus } = paymentResult;

      // 2. Get payment session
      const sessionResult = await this.getPaymentSession(orderId);
      if (!sessionResult.success) {
        throw new Error('Payment session not found');
      }

      const session = sessionResult.session;

      // 3. Check if already processed
      if (session.status === 'completed' || session.status === 'failed') {
        console.log(`Payment ${orderId} already processed with status: ${session.status}`);
        return {
          success: true,
          alreadyProcessed: true,
          session: session,
          paymentResult: paymentResult
        };
      }

      // 4. Update session status
      await this.updatePaymentSession(session.sessionId, {
        status: isSuccessful ? 'completed' : 'failed',
        paymentResult: paymentResult,
        processedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 5. Process successful payment
      if (isSuccessful) {
        const processingResult = await this.processSuccessfulPayment(session, paymentResult);
        
        if (processingResult.success) {
          // Remove from processing map
          this._processingPayments.delete(orderId);
          
          return {
            success: true,
            session: session,
            paymentResult: paymentResult,
            processingResult: processingResult
          };
        } else {
          // Mark as failed if processing failed
          await this.updatePaymentSession(session.sessionId, {
            status: 'processing_failed',
            processingError: processingResult.error,
            updatedAt: serverTimestamp()
          });
          
          throw new Error(`Payment processing failed: ${processingResult.error}`);
        }
      } else {
        // Payment failed
        console.log(`Payment ${orderId} failed with status: ${paymentStatus}`);
        this._processingPayments.delete(orderId);
        
        return {
          success: false,
          session: session,
          paymentResult: paymentResult,
          message: 'Pembayaran gagal atau dibatalkan'
        };
      }

    } catch (error) {
      console.error('Process payment callback error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses callback pembayaran'
      };
    }
  }

  /**
   * Process successful payment dengan credit system integration
   * @param {Object} session - Payment session
   * @param {Object} paymentResult - Midtrans payment result
   * @returns {Promise<Object>} Processing result
   */
  async processSuccessfulPayment(session, paymentResult) {
    try {
      console.log(`Processing successful payment: ${session.orderId}`);

      const {
        santriId,
        timelineId,
        periodKey,
        amount,
        paymentType
      } = session;

      if (paymentType === 'timeline' && timelineId && periodKey) {
        // Timeline payment - integrate dengan existing payment system
        const waliPaymentResult = await waliPaymentService.processPaymentWithCredit({
          santriId: santriId,
          timelineId: timelineId,
          periodKey: periodKey,
          paidAmount: amount,
          paymentMethod: 'digital',
          processedBy: 'digital_payment_system',
          digitalPayment: {
            orderId: session.orderId,
            transactionId: paymentResult.transactionId,
            paymentType: paymentResult.paymentType,
            grossAmount: paymentResult.grossAmount,
            transactionTime: paymentResult.transactionTime
          },
          metadata: {
            digitalPayment: true,
            midtransOrderId: session.orderId,
            midtransTransactionId: paymentResult.transactionId,
            processingTimestamp: new Date().toISOString()
          }
        });

        if (!waliPaymentResult.success) {
          throw new Error(`Wali payment processing failed: ${waliPaymentResult.error}`);
        }

        // Update payment status
        await paymentStatusManager.updatePaymentStatus(timelineId, santriId);

        return {
          success: true,
          paymentProcessing: waliPaymentResult,
          paymentType: 'timeline',
          timelineId: timelineId,
          periodKey: periodKey
        };

      } else {
        // Custom payment - add to credit balance
        const creditResult = await this.addToCredit(santriId, amount, {
          source: 'digital_payment',
          orderId: session.orderId,
          transactionId: paymentResult.transactionId,
          description: session.description || 'Pembayaran Digital'
        });

        if (!creditResult.success) {
          throw new Error(`Credit addition failed: ${creditResult.error}`);
        }

        return {
          success: true,
          creditProcessing: creditResult,
          paymentType: 'custom',
          creditAdded: amount
        };
      }

    } catch (error) {
      console.error('Process successful payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add amount to student credit balance
   * @param {string} santriId - Student ID
   * @param {number} amount - Amount to add
   * @param {Object} metadata - Transaction metadata
   * @returns {Promise<Object>} Credit addition result
   */
  async addToCredit(santriId, amount, metadata) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        // Get current user data
        const userRef = doc(db, 'users', santriId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error('Student not found');
        }

        const userData = userDoc.data();
        const currentBalance = userData.creditBalance || 0;
        const newBalance = currentBalance + amount;

        // Update credit balance
        transaction.update(userRef, {
          creditBalance: newBalance,
          updatedAt: serverTimestamp()
        });

        // Log credit transaction
        const creditLogRef = doc(collection(db, 'credit_transactions'));
        transaction.set(creditLogRef, {
          santriId: santriId,
          type: 'credit_addition',
          amount: amount,
          previousBalance: currentBalance,
          newBalance: newBalance,
          source: metadata.source || 'digital_payment',
          description: metadata.description || 'Digital Payment Credit',
          metadata: metadata,
          createdAt: serverTimestamp()
        });

        return {
          previousBalance: currentBalance,
          newBalance: newBalance,
          amountAdded: amount
        };
      });

      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('Add to credit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment session by order ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Session result
   */
  async getPaymentSession(orderId) {
    try {
      const sessionsQuery = query(
        collection(db, 'digital_payment_sessions'),
        where('orderId', '==', orderId),
        limit(1)
      );

      const snapshot = await getDocs(sessionsQuery);
      
      if (snapshot.empty) {
        return {
          success: false,
          error: 'Payment session not found'
        };
      }

      const sessionDoc = snapshot.docs[0];
      const session = {
        sessionId: sessionDoc.id,
        ...sessionDoc.data()
      };

      return {
        success: true,
        session: session
      };

    } catch (error) {
      console.error('Get payment session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update payment session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async updatePaymentSession(sessionId, updates) {
    try {
      const sessionRef = doc(db, 'digital_payment_sessions', sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };

    } catch (error) {
      console.error('Update payment session error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get existing payment record untuk timeline payment
   * @param {string} timelineId - Timeline ID
   * @param {string} periodKey - Period key
   * @param {string} santriId - Student ID
   * @returns {Promise<Object|null>} Existing payment or null
   */
  async getExistingPayment(timelineId, periodKey, santriId) {
    try {
      const paymentRef = doc(
        db,
        'payments',
        timelineId,
        'periods',
        periodKey,
        'santri_payments',
        santriId
      );

      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        return paymentDoc.data();
      }

      return null;

    } catch (error) {
      console.error('Get existing payment error:', error);
      return null;
    }
  }

  /**
   * Validate payment request
   * @param {Object} request - Payment request
   * @returns {Object} Validation result
   */
  validatePaymentRequest(request) {
    const errors = [];
    
    if (!request.santriId) {
      errors.push('Student ID is required');
    }
    
    if (!request.amount || request.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (request.amount < 1000 || request.amount > 10000000) {
      errors.push('Amount must be between Rp 1,000 and Rp 10,000,000');
    }
    
    if (request.paymentType === 'timeline') {
      if (!request.timelineId) {
        errors.push('Timeline ID is required for timeline payment');
      }
      if (!request.periodKey) {
        errors.push('Period key is required for timeline payment');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get payment methods yang tersedia
   * @returns {Array} Available payment methods
   */
  getAvailablePaymentMethods() {
    return midtransService.getAvailablePaymentMethods();
  }

  /**
   * Check if digital payment is enabled
   * @returns {boolean} Is enabled
   */
  isDigitalPaymentEnabled() {
    const config = midtransService.getClientConfig();
    return config.isEnabled;
  }

  /**
   * Get processing payments (untuk debugging)
   * @returns {Map} Processing payments
   */
  getProcessingPayments() {
    return this._processingPayments;
  }

  /**
   * Cleanup expired sessions (should be called periodically)
   * @returns {Promise<number>} Number of cleaned sessions
   */
  async cleanupExpiredSessions() {
    try {
      const expiredQuery = query(
        collection(db, 'digital_payment_sessions'),
        where('expiresAt', '<', new Date()),
        where('status', 'in', ['pending_payment', 'processing'])
      );

      const snapshot = await getDocs(expiredQuery);
      
      if (snapshot.empty) {
        return 0;
      }

      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        count++;
      });

      await batch.commit();
      
      console.log(`Cleaned up ${count} expired payment sessions`);
      return count;

    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const digitalPaymentService = new DigitalPaymentService();
export default digitalPaymentService;