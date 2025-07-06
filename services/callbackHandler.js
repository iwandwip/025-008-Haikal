import { digitalPaymentService } from './digitalPaymentService';
import { midtransService } from './midtransService';

/**
 * Midtrans Callback Handler Service
 * Handles Midtrans payment callbacks and WebView communication
 * 
 * Features:
 * - WebView message handling
 * - Payment result processing
 * - Real-time callback processing
 * - Error handling and retry logic
 */

class CallbackHandler {
  constructor() {
    this._callbacks = new Map(); // Store callback functions
    this._retryAttempts = new Map(); // Track retry attempts
    this.maxRetries = 3;
  }

  /**
   * Register callback untuk payment completion
   * @param {string} orderId - Order ID
   * @param {Function} callback - Callback function
   */
  registerCallback(orderId, callback) {
    if (typeof callback === 'function') {
      this._callbacks.set(orderId, callback);
      console.log(`Callback registered for order: ${orderId}`);
    }
  }

  /**
   * Unregister callback
   * @param {string} orderId - Order ID
   */
  unregisterCallback(orderId) {
    this._callbacks.delete(orderId);
    this._retryAttempts.delete(orderId);
    console.log(`Callback unregistered for order: ${orderId}`);
  }

  /**
   * Handle WebView message dari Midtrans Snap
   * @param {Object} message - WebView message
   * @returns {Promise<Object>} Processing result
   */
  async handleWebViewMessage(message) {
    try {
      console.log('Handling WebView message:', message);

      const { type, data } = message;

      switch (type) {
        case 'PAYMENT_SUCCESS':
          return await this.handlePaymentSuccess(data);
          
        case 'PAYMENT_PENDING':
          return await this.handlePaymentPending(data);
          
        case 'PAYMENT_ERROR':
          return await this.handlePaymentError(data);
          
        case 'PAYMENT_CLOSED':
          return await this.handlePaymentClosed(data);
          
        default:
          console.warn('Unknown WebView message type:', type);
          return {
            success: false,
            error: 'Unknown message type',
            type: type
          };
      }

    } catch (error) {
      console.error('Handle WebView message error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses pesan pembayaran'
      };
    }
  }

  /**
   * Handle successful payment
   * @param {Object} paymentData - Payment success data
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentSuccess(paymentData) {
    try {
      console.log('Handling payment success:', paymentData);

      // Extract order ID dari payment data
      const orderId = this.extractOrderId(paymentData);
      if (!orderId) {
        throw new Error('Order ID not found in payment data');
      }

      // Process payment dengan retry logic
      const result = await this.processPaymentWithRetry(orderId, paymentData);

      // Trigger callback jika ada
      const callback = this._callbacks.get(orderId);
      if (callback) {
        try {
          callback({
            success: true,
            type: 'PAYMENT_SUCCESS',
            data: result
          });
        } catch (callbackError) {
          console.error('Callback execution error:', callbackError);
        }
      }

      return {
        success: true,
        type: 'PAYMENT_SUCCESS',
        orderId: orderId,
        result: result,
        message: 'Pembayaran berhasil diproses'
      };

    } catch (error) {
      console.error('Handle payment success error:', error);
      
      const orderId = this.extractOrderId(paymentData);
      const callback = this._callbacks.get(orderId);
      if (callback) {
        callback({
          success: false,
          type: 'PAYMENT_ERROR',
          error: error.message
        });
      }

      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses pembayaran yang berhasil'
      };
    }
  }

  /**
   * Handle pending payment
   * @param {Object} paymentData - Payment pending data
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentPending(paymentData) {
    try {
      console.log('Handling payment pending:', paymentData);

      const orderId = this.extractOrderId(paymentData);
      
      // For pending payments, we still process them but mark as pending
      const result = await this.processPaymentWithRetry(orderId, {
        ...paymentData,
        transaction_status: 'pending'
      });

      const callback = this._callbacks.get(orderId);
      if (callback) {
        callback({
          success: true,
          type: 'PAYMENT_PENDING',
          data: result
        });
      }

      return {
        success: true,
        type: 'PAYMENT_PENDING',
        orderId: orderId,
        result: result,
        message: 'Pembayaran sedang diproses'
      };

    } catch (error) {
      console.error('Handle payment pending error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses pembayaran pending'
      };
    }
  }

  /**
   * Handle payment error
   * @param {Object} paymentData - Payment error data
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentError(paymentData) {
    try {
      console.log('Handling payment error:', paymentData);

      const orderId = this.extractOrderId(paymentData);
      
      // Mark payment as failed
      if (orderId) {
        await digitalPaymentService.updatePaymentSession(orderId, {
          status: 'failed',
          errorData: paymentData,
          failedAt: new Date().toISOString()
        });
      }

      const callback = this._callbacks.get(orderId);
      if (callback) {
        callback({
          success: false,
          type: 'PAYMENT_ERROR',
          error: 'Payment failed',
          data: paymentData
        });
      }

      return {
        success: false,
        type: 'PAYMENT_ERROR',
        orderId: orderId,
        error: 'Payment failed',
        data: paymentData,
        message: 'Pembayaran gagal'
      };

    } catch (error) {
      console.error('Handle payment error error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses error pembayaran'
      };
    }
  }

  /**
   * Handle payment popup closed
   * @param {Object} data - Close data
   * @returns {Promise<Object>} Processing result
   */
  async handlePaymentClosed(data) {
    try {
      console.log('Handling payment closed:', data);

      // This is just a user interaction, not a payment status change
      // We don't need to process anything, just inform the callback

      return {
        success: true,
        type: 'PAYMENT_CLOSED',
        message: 'Payment popup ditutup oleh user'
      };

    } catch (error) {
      console.error('Handle payment closed error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses penutupan pembayaran'
      };
    }
  }

  /**
   * Process payment dengan retry logic
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentWithRetry(orderId, paymentData) {
    const maxRetries = this.maxRetries;
    let attempts = this._retryAttempts.get(orderId) || 0;

    while (attempts < maxRetries) {
      try {
        // Attempt to process payment
        const result = await digitalPaymentService.processPaymentCallback(paymentData);
        
        if (result.success || result.alreadyProcessed) {
          // Success or already processed - clear retry counter
          this._retryAttempts.delete(orderId);
          return result;
        } else {
          // Processing failed, but not a network error
          throw new Error(result.error || 'Payment processing failed');
        }

      } catch (error) {
        attempts++;
        this._retryAttempts.set(orderId, attempts);
        
        console.error(`Payment processing attempt ${attempts}/${maxRetries} failed:`, error);

        if (attempts >= maxRetries) {
          // Max retries reached
          this._retryAttempts.delete(orderId);
          throw new Error(`Payment processing failed after ${maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Extract order ID dari payment data
   * @param {Object} paymentData - Payment data
   * @returns {string|null} Order ID
   */
  extractOrderId(paymentData) {
    return paymentData?.order_id || 
           paymentData?.orderId || 
           paymentData?.transaction_details?.order_id ||
           null;
  }

  /**
   * Create WebView message handler untuk React Native
   * @param {Function} onMessage - Message handler function
   * @returns {Function} WebView onMessage handler
   */
  createWebViewMessageHandler(onMessage) {
    return async (event) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        const result = await this.handleWebViewMessage(message);
        
        if (onMessage && typeof onMessage === 'function') {
          onMessage(result);
        }
        
        return result;

      } catch (error) {
        console.error('WebView message handler error:', error);
        
        const errorResult = {
          success: false,
          error: error.message,
          message: 'Gagal memproses pesan dari WebView'
        };
        
        if (onMessage && typeof onMessage === 'function') {
          onMessage(errorResult);
        }
        
        return errorResult;
      }
    };
  }

  /**
   * Create payment completion promise untuk async handling
   * @param {string} orderId - Order ID
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<Object>} Payment completion promise
   */
  createPaymentPromise(orderId, timeoutMs = 300000) { // 5 minutes default
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.unregisterCallback(orderId);
        reject(new Error('Payment timeout'));
      }, timeoutMs);

      // Register callback
      this.registerCallback(orderId, (result) => {
        clearTimeout(timeout);
        this.unregisterCallback(orderId);
        
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || 'Payment failed'));
        }
      });
    });
  }

  /**
   * Cleanup expired callbacks
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  cleanupExpiredCallbacks(maxAgeMs = 600000) { // 10 minutes default
    const now = Date.now();
    
    for (const [orderId, callback] of this._callbacks.entries()) {
      // Note: This is a simple cleanup. In production, you might want to store timestamps
      // For now, we'll just clean up retry attempts that are too old
      const attempts = this._retryAttempts.get(orderId);
      if (attempts && attempts > 0) {
        // Clean up old retry attempts
        this._retryAttempts.delete(orderId);
      }
    }
  }

  /**
   * Get callback statistics untuk debugging
   * @returns {Object} Callback statistics
   */
  getStatistics() {
    return {
      activeCallbacks: this._callbacks.size,
      retryingPayments: this._retryAttempts.size,
      maxRetries: this.maxRetries
    };
  }
}

// Export singleton instance
export const callbackHandler = new CallbackHandler();
export default callbackHandler;