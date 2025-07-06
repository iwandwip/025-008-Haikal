import Constants from 'expo-constants';

/**
 * Midtrans Snap Configuration Service
 * Handles Midtrans Snap token generation and payment configuration
 * 
 * Features:
 * - Environment-based configuration (sandbox/production)
 * - Snap token generation for WebView integration
 * - Payment configuration dengan Indonesian settings
 * - Error handling and validation
 */

class MidtransService {
  constructor() {
    // Get environment from config or env variables
    this.environment = Constants.expoConfig?.extra?.midtrans?.environment || 
                      process.env.EXPO_PUBLIC_MIDTRANS_ENVIRONMENT || 'sandbox';
    
    // Get client key from config or env variables
    this.clientKey = this.environment === 'sandbox' 
      ? (Constants.expoConfig?.extra?.midtrans?.clientKeySandbox || 
         process.env.EXPO_PUBLIC_MIDTRANS_CLIENT_KEY_SANDBOX)
      : (Constants.expoConfig?.extra?.midtrans?.clientKeyProduction || 
         process.env.EXPO_PUBLIC_MIDTRANS_CLIENT_KEY_PRODUCTION);
    
    this.snapUrl = this.environment === 'sandbox'
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';
      
    this.apiUrl = this.environment === 'sandbox'
      ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
      : 'https://app.midtrans.com/snap/v1/transactions';

    console.log(`Midtrans initialized in ${this.environment} mode`);
    console.log(`Client key available: ${!!this.clientKey}`);
  }

  /**
   * Generate order ID dengan format yang unique
   */
  generateOrderId(santriId, timelineId, periodKey) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `SB-${santriId}-${timelineId}-${periodKey}-${timestamp}-${random}`;
  }

  /**
   * Generate Snap token untuk payment
   * @param {Object} paymentData - Data pembayaran
   * @returns {Promise<Object>} Snap token dan URL
   */
  async generateSnapToken(paymentData) {
    try {
      const {
        orderId,
        grossAmount,
        customerDetails,
        itemDetails,
        metadata = {}
      } = paymentData;

      // Validate required fields
      if (!orderId || !grossAmount || !customerDetails) {
        throw new Error('Missing required payment data');
      }

      const requestPayload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount
        },
        customer_details: {
          first_name: customerDetails.firstName || 'Wali Santri',
          last_name: customerDetails.lastName || '',
          email: customerDetails.email || 'noreply@smartbisyaroh.com',
          phone: customerDetails.phone || '08123456789'
        },
        item_details: itemDetails || [{
          id: 'payment-001',
          price: grossAmount,
          quantity: 1,
          name: 'Pembayaran TPQ',
          category: 'Education'
        }],
        custom_expiry: {
          order_time: new Date().toISOString(),
          expiry_duration: 24,
          unit: 'hour'
        },
        callbacks: {
          finish: `${Constants.expoConfig?.extra?.payment?.redirectUrl || 'payment/result'}?status=finish`,
          error: `${Constants.expoConfig?.extra?.payment?.redirectUrl || 'payment/result'}?status=error`,
          pending: `${Constants.expoConfig?.extra?.payment?.redirectUrl || 'payment/result'}?status=pending`
        },
        credit_card: {
          secure: true
        },
        custom_field1: JSON.stringify({
          santriId: metadata.santriId,
          timelineId: metadata.timelineId,
          periodKey: metadata.periodKey,
          appVersion: '1.3.0'
        })
      };

      console.log('Generating Snap token for order:', orderId);

      // Untuk implementasi client-side, kita akan return konfigurasi yang bisa digunakan di WebView
      const snapConfig = {
        token: null, // Token akan di-generate di frontend
        payload: requestPayload,
        snapUrl: this.snapUrl,
        clientKey: this.clientKey,
        environment: this.environment
      };

      return {
        success: true,
        config: snapConfig,
        orderId: orderId
      };

    } catch (error) {
      console.error('Generate Snap token error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal membuat token pembayaran'
      };
    }
  }

  /**
   * Validate Snap callback data
   * @param {Object} callbackData - Data dari Midtrans callback
   * @returns {Object} Validated payment result
   */
  validateCallback(callbackData) {
    try {
      const {
        order_id,
        status_code,
        transaction_status,
        payment_type,
        transaction_id,
        transaction_time,
        gross_amount,
        fraud_status
      } = callbackData;

      // Basic validation
      if (!order_id || !transaction_status) {
        throw new Error('Invalid callback data');
      }

      // Determine payment status
      let paymentStatus = 'pending';
      let isSuccessful = false;

      if (transaction_status === 'capture' && fraud_status === 'accept') {
        paymentStatus = 'success';
        isSuccessful = true;
      } else if (transaction_status === 'settlement') {
        paymentStatus = 'success';
        isSuccessful = true;
      } else if (transaction_status === 'pending') {
        paymentStatus = 'pending';
      } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
        paymentStatus = 'failed';
      }

      return {
        success: true,
        result: {
          orderId: order_id,
          transactionId: transaction_id,
          paymentStatus: paymentStatus,
          isSuccessful: isSuccessful,
          paymentType: payment_type,
          grossAmount: parseInt(gross_amount),
          transactionTime: transaction_time,
          statusCode: status_code,
          fraudStatus: fraud_status,
          rawData: callbackData
        }
      };

    } catch (error) {
      console.error('Validate callback error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Data pembayaran tidak valid'
      };
    }
  }

  /**
   * Generate WebView HTML untuk Snap payment
   * @param {Object} snapConfig - Konfigurasi Snap
   * @returns {String} HTML untuk WebView
   */
  generateSnapHTML(snapConfig) {
    const { payload, clientKey, environment } = snapConfig;
    
    const snapUrl = environment === 'sandbox'
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Smart Bisyaroh - Pembayaran Digital</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        .payment-info {
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .amount {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
            text-align: center;
        }
        .order-id {
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            margin-top: 4px;
        }
        .pay-button {
            width: 100%;
            background: #059669;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 16px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .pay-button:hover {
            background: #047857;
        }
        .pay-button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
        }
        .loading {
            display: none;
            text-align: center;
            margin-top: 16px;
            color: #6b7280;
        }
        .error {
            display: none;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏫 Smart Bisyaroh</div>
            <div class="subtitle">Pembayaran Digital TPQ</div>
        </div>
        
        <div class="payment-info">
            <div class="amount">Rp ${parseInt(payload.transaction_details.gross_amount).toLocaleString('id-ID')}</div>
            <div class="order-id">Order ID: ${payload.transaction_details.order_id}</div>
        </div>
        
        <button id="payButton" class="pay-button">
            💳 Bayar Sekarang
        </button>
        
        <div id="loading" class="loading">
            Memproses pembayaran...
        </div>
        
        <div id="error" class="error">
            Terjadi kesalahan. Silakan coba lagi.
        </div>
    </div>

    <script src="${snapUrl}" data-client-key="${clientKey}"></script>
    <script>
        document.getElementById('payButton').addEventListener('click', function() {
            this.disabled = true;
            document.getElementById('loading').style.display = 'block';
            
            const payload = ${JSON.stringify(payload)};
            
            snap.pay(payload.transaction_details.order_id, {
                onSuccess: function(result) {
                    console.log('Payment success:', result);
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'PAYMENT_SUCCESS',
                        data: result
                    }));
                },
                onPending: function(result) {
                    console.log('Payment pending:', result);
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'PAYMENT_PENDING', 
                        data: result
                    }));
                },
                onError: function(result) {
                    console.log('Payment error:', result);
                    document.getElementById('payButton').disabled = false;
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('error').style.display = 'block';
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'PAYMENT_ERROR',
                        data: result
                    }));
                },
                onClose: function() {
                    console.log('Payment popup closed');
                    document.getElementById('payButton').disabled = false;
                    document.getElementById('loading').style.display = 'none';
                    
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                        type: 'PAYMENT_CLOSED',
                        data: {}
                    }));
                }
            });
        });
        
        // Auto-trigger payment jika sudah siap
        document.addEventListener('DOMContentLoaded', function() {
            // Optionally auto-trigger payment
            // document.getElementById('payButton').click();
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get payment methods yang tersedia
   * @returns {Array} List payment methods
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: 'qris',
        name: 'QRIS',
        description: 'Bayar dengan scan QR Code',
        icon: '📱',
        enabled: true,
        fee: 0
      },
      {
        id: 'bank_transfer',
        name: 'Transfer Bank',
        description: 'BCA, Mandiri, BNI, BRI',
        icon: '🏦',
        enabled: true,
        fee: 0
      },
      {
        id: 'ewallet',
        name: 'E-Wallet',
        description: 'GoPay, OVO, DANA, ShopeePay',
        icon: '💳',
        enabled: true,
        fee: 0
      },
      {
        id: 'convenience_store',
        name: 'Minimarket',
        description: 'Alfamart, Indomaret',
        icon: '🏪',
        enabled: true,
        fee: 0
      }
    ];
  }

  /**
   * Get client configuration untuk frontend
   * @returns {Object} Client config
   */
  getClientConfig() {
    return {
      clientKey: this.clientKey,
      environment: this.environment,
      snapUrl: this.snapUrl,
      isEnabled: !!this.clientKey
    };
  }
}

// Export singleton instance
export const midtransService = new MidtransService();
export default midtransService;