import { digitalPaymentService } from './digitalPaymentService';
import { waliPaymentService } from './waliPaymentService';
import { adminPaymentService } from './adminPaymentService';
import { timelineService } from './timelineService';
import { paymentStatusManager } from './paymentStatusManager';

/**
 * Unified Payment Method Manager
 * Orchestrates all payment methods: Hardware, Manual, Digital
 * 
 * Features:
 * - Unified payment interface
 * - Payment method selection
 * - Cross-method validation
 * - Payment history aggregation
 * - Mixed payment support
 */

class PaymentMethodManager {
  constructor() {
    this.paymentMethods = {
      hardware: {
        id: 'hardware',
        name: 'Hardware Payment',
        description: 'Pembayaran otomatis dengan ESP32 + RFID',
        icon: '🔌',
        enabled: true,
        requirements: ['rfid_card'],
        features: ['automatic', 'rfid_scan', 'currency_detection'],
        denomination: [2000, 5000, 10000]
      },
      manual: {
        id: 'manual',
        name: 'Manual Payment',
        description: 'Pembayaran manual oleh admin',
        icon: '👨‍💼',
        enabled: true,
        requirements: ['admin_access'],
        features: ['flexible_amount', 'admin_controlled', 'cash_credit_mixed'],
        denomination: 'flexible'
      },
      digital: {
        id: 'digital',
        name: 'Digital Payment',
        description: 'Pembayaran digital dengan Midtrans',
        icon: '💳',
        enabled: digitalPaymentService.isDigitalPaymentEnabled(),
        requirements: [],
        features: ['online', 'multiple_channels', '24_7_available', 'flexible_amount'],
        channels: ['qris', 'bank_transfer', 'ewallet', 'convenience_store']
      }
    };
  }

  /**
   * Get available payment methods untuk user
   * @param {Object} context - Payment context
   * @returns {Array} Available payment methods
   */
  getAvailablePaymentMethods(context = {}) {
    const { userRole, hasRFID, timelineId, periodKey } = context;
    const methods = [];

    // Hardware payment - requires RFID
    if (this.paymentMethods.hardware.enabled && hasRFID) {
      methods.push({
        ...this.paymentMethods.hardware,
        available: true,
        reason: null
      });
    } else if (this.paymentMethods.hardware.enabled) {
      methods.push({
        ...this.paymentMethods.hardware,
        available: false,
        reason: 'RFID card required'
      });
    }

    // Manual payment - admin only
    if (this.paymentMethods.manual.enabled && userRole === 'admin') {
      methods.push({
        ...this.paymentMethods.manual,
        available: true,
        reason: null
      });
    }

    // Digital payment - available untuk semua user
    if (this.paymentMethods.digital.enabled) {
      methods.push({
        ...this.paymentMethods.digital,
        available: true,
        reason: null,
        channels: digitalPaymentService.getAvailablePaymentMethods()
      });
    } else {
      methods.push({
        ...this.paymentMethods.digital,
        available: false,
        reason: 'Digital payment not configured'
      });
    }

    return methods;
  }

  /**
   * Process payment berdasarkan method yang dipilih
   * @param {Object} paymentRequest - Payment request
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(paymentRequest) {
    try {
      const {
        method,
        santriId,
        amount,
        timelineId,
        periodKey,
        ...methodSpecificData
      } = paymentRequest;

      console.log(`Processing ${method} payment for ${santriId}: ${amount}`);

      // Validate method
      if (!this.paymentMethods[method]) {
        throw new Error(`Invalid payment method: ${method}`);
      }

      if (!this.paymentMethods[method].enabled) {
        throw new Error(`Payment method ${method} is not enabled`);
      }

      // Route to appropriate payment service
      switch (method) {
        case 'digital':
          return await this.processDigitalPayment({
            santriId,
            amount,
            timelineId,
            periodKey,
            ...methodSpecificData
          });

        case 'manual':
          return await this.processManualPayment({
            santriId,
            amount,
            timelineId,
            periodKey,
            ...methodSpecificData
          });

        case 'hardware':
          return await this.processHardwarePayment({
            santriId,
            amount,
            timelineId,
            periodKey,
            ...methodSpecificData
          });

        default:
          throw new Error(`Unsupported payment method: ${method}`);
      }

    } catch (error) {
      console.error('Process payment error:', error);
      return {
        success: false,
        error: error.message,
        method: paymentRequest.method,
        message: `Gagal memproses pembayaran ${paymentRequest.method}`
      };
    }
  }

  /**
   * Process digital payment
   * @param {Object} paymentData - Digital payment data
   * @returns {Promise<Object>} Payment result
   */
  async processDigitalPayment(paymentData) {
    try {
      const {
        santriId,
        amount,
        timelineId,
        periodKey,
        description,
        customAmount = false
      } = paymentData;

      const paymentType = timelineId && periodKey ? 'timeline' : 'custom';

      const result = await digitalPaymentService.createDigitalPayment({
        santriId: santriId,
        amount: amount,
        paymentType: paymentType,
        timelineId: timelineId,
        periodKey: periodKey,
        description: description || (paymentType === 'timeline' ? 'Pembayaran Timeline TPQ' : 'Pembayaran TPQ')
      });

      return {
        ...result,
        method: 'digital',
        paymentType: paymentType
      };

    } catch (error) {
      console.error('Process digital payment error:', error);
      return {
        success: false,
        error: error.message,
        method: 'digital',
        message: 'Gagal memproses pembayaran digital'
      };
    }
  }

  /**
   * Process manual payment (admin)
   * @param {Object} paymentData - Manual payment data
   * @returns {Promise<Object>} Payment result
   */
  async processManualPayment(paymentData) {
    try {
      const {
        santriId,
        amount,
        timelineId,
        periodKey,
        adminId,
        paymentMethod = 'tunai',
        notes
      } = paymentData;

      if (!timelineId || !periodKey) {
        throw new Error('Timeline ID and Period Key required for manual payment');
      }

      const result = await waliPaymentService.processPaymentWithCredit({
        santriId: santriId,
        timelineId: timelineId,
        periodKey: periodKey,
        paidAmount: amount,
        paymentMethod: paymentMethod,
        processedBy: adminId || 'admin',
        metadata: {
          manualPayment: true,
          adminProcessed: true,
          notes: notes || '',
          processingTimestamp: new Date().toISOString()
        }
      });

      // Update payment status
      if (result.success) {
        await paymentStatusManager.updatePaymentStatus(timelineId, santriId);
      }

      return {
        ...result,
        method: 'manual',
        paymentType: 'timeline'
      };

    } catch (error) {
      console.error('Process manual payment error:', error);
      return {
        success: false,
        error: error.message,
        method: 'manual',
        message: 'Gagal memproses pembayaran manual'
      };
    }
  }

  /**
   * Process hardware payment (ESP32)
   * @param {Object} paymentData - Hardware payment data
   * @returns {Promise<Object>} Payment result
   */
  async processHardwarePayment(paymentData) {
    try {
      // Hardware payment is handled by the ESP32 and mode-based system
      // This method is mainly for validation and status checking
      
      const {
        santriId,
        rfidCode,
        detectedAmount,
        timelineId,
        periodKey
      } = paymentData;

      // For hardware payment, we typically process via the mode-based system
      // This is more of a status/validation method
      
      return {
        success: true,
        method: 'hardware',
        message: 'Hardware payment should be processed via mode-based system',
        note: 'Use rtdbModeService and dataBridgeService for hardware payments'
      };

    } catch (error) {
      console.error('Process hardware payment error:', error);
      return {
        success: false,
        error: error.message,
        method: 'hardware',
        message: 'Gagal memproses pembayaran hardware'
      };
    }
  }

  /**
   * Get payment history across all methods
   * @param {string} santriId - Student ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Aggregated payment history
   */
  async getAggregatedPaymentHistory(santriId, options = {}) {
    try {
      const { timelineId, limit = 50 } = options;

      // Get payment history dari wali service (covers manual + hardware + some digital)
      const waliHistory = await waliPaymentService.getWaliPaymentHistory(santriId);
      
      // Get digital payment sessions
      // Note: This would require a new method in digitalPaymentService
      // For now, we'll use the wali history as the primary source
      
      const payments = waliHistory.success ? waliHistory.payments : [];
      
      // Enhance dengan method detection
      const enhancedPayments = payments.map(payment => {
        let detectedMethod = 'manual'; // default
        
        if (payment.hardwarePayment) {
          detectedMethod = 'hardware';
        } else if (payment.digitalPayment || payment.paymentMethod === 'digital') {
          detectedMethod = 'digital';
        } else if (payment.paymentMethod === 'tunai' || payment.paymentMethod === 'manual') {
          detectedMethod = 'manual';
        }
        
        return {
          ...payment,
          detectedMethod: detectedMethod,
          methodInfo: this.paymentMethods[detectedMethod]
        };
      });

      // Sort by date (newest first)
      enhancedPayments.sort((a, b) => {
        const dateA = new Date(a.paidAt || a.createdAt);
        const dateB = new Date(b.paidAt || b.createdAt);
        return dateB - dateA;
      });

      // Apply limit
      const limitedPayments = enhancedPayments.slice(0, limit);

      // Calculate statistics
      const statistics = this.calculatePaymentStatistics(enhancedPayments);

      return {
        success: true,
        payments: limitedPayments,
        statistics: statistics,
        timeline: waliHistory.timeline,
        total: enhancedPayments.length,
        methods: this.getAvailablePaymentMethods({ hasRFID: true }) // Assume RFID untuk stats
      };

    } catch (error) {
      console.error('Get aggregated payment history error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil riwayat pembayaran'
      };
    }
  }

  /**
   * Calculate payment statistics by method
   * @param {Array} payments - Payment array
   * @returns {Object} Payment statistics
   */
  calculatePaymentStatistics(payments) {
    const stats = {
      total: {
        count: payments.length,
        amount: 0
      },
      byMethod: {},
      byStatus: {},
      timeRange: null
    };

    // Initialize method stats
    Object.keys(this.paymentMethods).forEach(method => {
      stats.byMethod[method] = {
        count: 0,
        amount: 0,
        percentage: 0
      };
    });

    // Initialize status stats
    ['lunas', 'belum_bayar', 'terlambat', 'sebagian'].forEach(status => {
      stats.byStatus[status] = {
        count: 0,
        amount: 0,
        percentage: 0
      };
    });

    // Calculate stats
    let totalAmount = 0;
    let earliestDate = null;
    let latestDate = null;

    payments.forEach(payment => {
      const amount = payment.paidAmount || 0;
      const method = payment.detectedMethod || 'manual';
      const status = payment.status || 'belum_bayar';
      const date = new Date(payment.paidAt || payment.createdAt);

      // Total stats
      totalAmount += amount;

      // Method stats
      if (stats.byMethod[method]) {
        stats.byMethod[method].count++;
        stats.byMethod[method].amount += amount;
      }

      // Status stats
      if (stats.byStatus[status]) {
        stats.byStatus[status].count++;
        stats.byStatus[status].amount += amount;
      }

      // Date range
      if (!earliestDate || date < earliestDate) {
        earliestDate = date;
      }
      if (!latestDate || date > latestDate) {
        latestDate = date;
      }
    });

    // Calculate percentages
    Object.keys(stats.byMethod).forEach(method => {
      if (payments.length > 0) {
        stats.byMethod[method].percentage = (stats.byMethod[method].count / payments.length) * 100;
      }
    });

    Object.keys(stats.byStatus).forEach(status => {
      if (payments.length > 0) {
        stats.byStatus[status].percentage = (stats.byStatus[status].count / payments.length) * 100;
      }
    });

    stats.total.amount = totalAmount;
    stats.timeRange = {
      earliest: earliestDate,
      latest: latestDate,
      days: earliestDate && latestDate ? Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) : 0
    };

    return stats;
  }

  /**
   * Get payment method recommendations untuk user
   * @param {Object} context - User context
   * @returns {Array} Recommended payment methods
   */
  getPaymentMethodRecommendations(context = {}) {
    const { 
      userRole, 
      hasRFID, 
      creditBalance = 0, 
      requiredAmount = 0,
      paymentHistory = [],
      deviceConnectivity = 'good'
    } = context;

    const recommendations = [];
    const availableMethods = this.getAvailablePaymentMethods(context);

    // Digital payment recommendation
    const digitalMethod = availableMethods.find(m => m.id === 'digital');
    if (digitalMethod && digitalMethod.available) {
      recommendations.push({
        ...digitalMethod,
        priority: 1,
        reason: '24/7 tersedia, multiple channel pembayaran',
        benefits: ['Tidak perlu ke sekolah', 'Berbagai metode pembayaran', 'Konfirmasi instant'],
        suitable: true
      });
    }

    // Hardware payment recommendation
    const hardwareMethod = availableMethods.find(m => m.id === 'hardware');
    if (hardwareMethod && hardwareMethod.available) {
      const isExactAmount = [2000, 5000, 10000].includes(requiredAmount);
      recommendations.push({
        ...hardwareMethod,
        priority: isExactAmount ? 2 : 3,
        reason: isExactAmount ? 'Jumlah pas dengan denominasi tersedia' : 'Memerlukan uang pas',
        benefits: ['Pembayaran otomatis', 'Tidak perlu admin', 'Langsung terdeteksi'],
        suitable: isExactAmount
      });
    }

    // Manual payment recommendation (admin only)
    const manualMethod = availableMethods.find(m => m.id === 'manual');
    if (manualMethod && manualMethod.available) {
      recommendations.push({
        ...manualMethod,
        priority: 4,
        reason: 'Fleksibel untuk semua jumlah pembayaran',
        benefits: ['Jumlah fleksibel', 'Bisa mix cash + credit', 'Diverifikasi admin'],
        suitable: true
      });
    }

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    return recommendations;
  }

  /**
   * Validate payment request across methods
   * @param {Object} paymentRequest - Payment request
   * @returns {Object} Validation result
   */
  validatePaymentRequest(paymentRequest) {
    const errors = [];
    const warnings = [];
    
    const {
      method,
      santriId,
      amount,
      timelineId,
      periodKey
    } = paymentRequest;

    // Basic validation
    if (!method) {
      errors.push('Payment method is required');
    } else if (!this.paymentMethods[method]) {
      errors.push(`Invalid payment method: ${method}`);
    } else if (!this.paymentMethods[method].enabled) {
      errors.push(`Payment method ${method} is not enabled`);
    }

    if (!santriId) {
      errors.push('Student ID is required');
    }

    if (!amount || amount <= 0) {
      errors.push('Valid amount is required');
    }

    // Method-specific validation
    if (method === 'hardware') {
      if (![2000, 5000, 10000].includes(amount)) {
        warnings.push('Hardware payment works best with exact denominations (2K, 5K, 10K)');
      }
    }

    if (method === 'digital') {
      if (amount < 1000) {
        errors.push('Digital payment minimum amount is Rp 1,000');
      }
      if (amount > 10000000) {
        errors.push('Digital payment maximum amount is Rp 10,000,000');
      }
    }

    // Timeline validation
    if (timelineId && periodKey) {
      // This would require additional timeline validation
      // For now, just check if both are provided together
      if (!timelineId || !periodKey) {
        errors.push('Both timeline ID and period key must be provided for timeline payments');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      method: method
    };
  }

  /**
   * Get payment method statistics untuk analytics
   * @returns {Object} Method statistics
   */
  getPaymentMethodStatistics() {
    return {
      methods: Object.keys(this.paymentMethods).map(key => ({
        id: key,
        ...this.paymentMethods[key]
      })),
      enabled: Object.values(this.paymentMethods).filter(m => m.enabled).length,
      total: Object.keys(this.paymentMethods).length,
      capabilities: {
        automaticPayment: this.paymentMethods.hardware.enabled,
        digitalPayment: this.paymentMethods.digital.enabled,
        manualPayment: this.paymentMethods.manual.enabled,
        mixedPayment: true,
        creditSystem: true,
        flexibleAmount: true
      }
    };
  }
}

// Export singleton instance
export const paymentMethodManager = new PaymentMethodManager();
export default paymentMethodManager;