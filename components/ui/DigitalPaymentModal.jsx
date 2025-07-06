import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getThemeByRole } from '../../constants/Colors';
import { digitalPaymentService } from '../../services/digitalPaymentService';
import { midtransService } from '../../services/midtransService';
import { callbackHandler } from '../../services/callbackHandler';
import { formatCurrency } from '../../utils/dateUtils';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

/**
 * Digital Payment Modal Component
 * Handles Midtrans Snap integration dengan WebView
 * 
 * Features:
 * - Amount selection (quick amounts + custom)
 * - Midtrans Snap WebView integration
 * - Real-time payment processing
 * - Credit system compatibility
 * - Error handling dan recovery
 */

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DigitalPaymentModal = ({
  visible,
  onClose,
  santriId,
  timelineId = null,
  periodKey = null,
  studentName,
  requiredAmount = null,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { isAdmin } = useAuth();
  const colors = getThemeByRole(isAdmin);
  const { 
    showGeneralNotification, 
    showErrorNotification
  } = useNotification();

  // State management
  const [step, setStep] = useState('amount_selection'); // 'amount_selection' | 'payment_processing' | 'payment_result'
  const [selectedAmount, setSelectedAmount] = useState(requiredAmount || 5000);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [webViewHtml, setWebViewHtml] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  // Refs
  const webViewRef = useRef(null);

  // Quick amount options
  const quickAmounts = [5000, 10000, 15000, 20000, 25000, 50000];

  // Payment methods info
  const paymentMethods = [
    { id: 'qris', name: 'QRIS', icon: '📱', description: 'Scan QR Code' },
    { id: 'bank_transfer', name: 'Transfer Bank', icon: '🏦', description: 'BCA, Mandiri, BNI, BRI' },
    { id: 'ewallet', name: 'E-Wallet', icon: '💳', description: 'GoPay, OVO, DANA, ShopeePay' },
    { id: 'convenience_store', name: 'Minimarket', icon: '🏪', description: 'Alfamart, Indomaret' }
  ];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('amount_selection');
      setSelectedAmount(requiredAmount || 5000);
      setCustomAmount('');
      setUseCustomAmount(false);
      setLoading(false);
      setPaymentSession(null);
      setWebViewHtml('');
      setPaymentResult(null);
    }
  }, [visible, requiredAmount]);

  // Get final amount to pay
  const getFinalAmount = () => {
    if (useCustomAmount) {
      return parseInt(customAmount) || 0;
    }
    return selectedAmount;
  };

  // Validate amount
  const isAmountValid = () => {
    const amount = getFinalAmount();
    return amount >= 1000 && amount <= 10000000;
  };

  // Handle amount selection
  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setUseCustomAmount(false);
    setCustomAmount('');
  };

  // Handle custom amount input
  const handleCustomAmountChange = (text) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericText);
    setUseCustomAmount(true);
  };

  // Start payment process
  const handleStartPayment = async () => {
    try {
      if (!isAmountValid()) {
        Alert.alert('Error', 'Jumlah pembayaran tidak valid. Minimum Rp 1.000, maksimum Rp 10.000.000');
        return;
      }

      setLoading(true);
      setStep('payment_processing');

      const amount = getFinalAmount();
      const description = timelineId && periodKey 
        ? `Pembayaran Timeline TPQ - ${studentName}`
        : `Top Up Saldo TPQ - ${studentName}`;

      console.log(`Starting digital payment: ${amount} for ${santriId}`);

      // Create payment session
      const result = await digitalPaymentService.createDigitalPayment({
        santriId: santriId,
        amount: amount,
        paymentType: timelineId && periodKey ? 'timeline' : 'custom',
        timelineId: timelineId,
        periodKey: periodKey,
        description: description
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment session');
      }

      setPaymentSession(result.session);

      // Generate WebView HTML
      const html = midtransService.generateSnapHTML(result.session.snapConfig);
      setWebViewHtml(html);

      // Register callback untuk payment completion
      callbackHandler.registerCallback(result.session.orderId, handlePaymentCallback);

      setLoading(false);

    } catch (error) {
      console.error('Start payment error:', error);
      setLoading(false);
      showErrorNotification('Gagal memulai pembayaran', error.message);
      setStep('amount_selection');
    }
  };

  // Handle payment callback
  const handlePaymentCallback = (callbackResult) => {
    console.log('Payment callback received:', callbackResult);

    if (callbackResult.success) {
      setPaymentResult(callbackResult);
      setStep('payment_result');
      
      showGeneralNotification(
        'Pembayaran Berhasil!',
        `Pembayaran sebesar ${formatCurrency(getFinalAmount())} telah berhasil diproses.`,
        'success'
      );

      if (onPaymentSuccess) {
        onPaymentSuccess(callbackResult);
      }
    } else {
      showErrorNotification('Pembayaran Gagal', callbackResult.error || 'Pembayaran tidak dapat diproses');
      
      if (onPaymentError) {
        onPaymentError(callbackResult);
      }
      
      setStep('amount_selection');
    }
  };

  // Handle WebView message
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', message);
      
      callbackHandler.handleWebViewMessage(message);
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (paymentSession) {
      callbackHandler.unregisterCallback(paymentSession.orderId);
    }
    onClose();
  };

  // Render amount selection step
  const renderAmountSelection = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>💳 Pembayaran Digital</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {studentName}
        </Text>
        {requiredAmount && (
          <Text style={[styles.requiredAmount, { color: colors.primary }]}>
            Jumlah yang diperlukan: {formatCurrency(requiredAmount)}
          </Text>
        )}
      </View>

      {/* Quick amounts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Jumlah</Text>
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickAmountButton,
                { 
                  backgroundColor: selectedAmount === amount && !useCustomAmount 
                    ? colors.primary 
                    : colors.surface,
                  borderColor: colors.border
                }
              ]}
              onPress={() => handleAmountSelect(amount)}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  { 
                    color: selectedAmount === amount && !useCustomAmount 
                      ? 'white' 
                      : colors.text 
                  }
                ]}
              >
                {formatCurrency(amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom amount */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Jumlah Custom</Text>
        <TextInput
          style={[
            styles.customAmountInput,
            { 
              backgroundColor: colors.surface,
              borderColor: useCustomAmount ? colors.primary : colors.border,
              color: colors.text
            }
          ]}
          placeholder="Masukkan jumlah (min Rp 1.000)"
          placeholderTextColor={colors.textSecondary}
          value={customAmount}
          onChangeText={handleCustomAmountChange}
          keyboardType="numeric"
          onFocus={() => setUseCustomAmount(true)}
        />
        {useCustomAmount && customAmount && (
          <Text style={[styles.customAmountDisplay, { color: colors.primary }]}>
            {formatCurrency(parseInt(customAmount) || 0)}
          </Text>
        )}
      </View>

      {/* Payment methods info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Metode Pembayaran Tersedia</Text>
        <View style={styles.paymentMethods}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={[styles.paymentMethod, { backgroundColor: colors.surface }]}>
              <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodName, { color: colors.text }]}>
                  {method.name}
                </Text>
                <Text style={[styles.paymentMethodDesc, { color: colors.textSecondary }]}>
                  {method.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="Batal"
          onPress={handleClose}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={`Bayar ${formatCurrency(getFinalAmount())}`}
          onPress={handleStartPayment}
          disabled={!isAmountValid() || loading}
          loading={loading}
          style={styles.payButton}
        />
      </View>
    </ScrollView>
  );

  // Render payment processing step
  const renderPaymentProcessing = () => (
    <View style={styles.paymentContainer}>
      {webViewHtml ? (
        <WebView
          ref={webViewRef}
          source={{ html: webViewHtml }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <LoadingSpinner 
              message="Memuat pembayaran..." 
              style={styles.webViewLoading}
            />
          )}
          onError={(error) => {
            console.error('WebView error:', error);
            showErrorNotification('Error WebView', 'Gagal memuat interface pembayaran');
          }}
        />
      ) : (
        <LoadingSpinner 
          message="Menyiapkan pembayaran..." 
          subMessage="Mohon tunggu sebentar"
        />
      )}
      
      {/* Cancel button */}
      <View style={styles.cancelContainer}>
        <Button
          title="Batalkan Pembayaran"
          onPress={handleClose}
          variant="outline"
          style={styles.cancelWebViewButton}
        />
      </View>
    </View>
  );

  // Render payment result step
  const renderPaymentResult = () => (
    <View style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultIcon}>✅</Text>
        <Text style={[styles.resultTitle, { color: colors.success }]}>
          Pembayaran Berhasil!
        </Text>
        <Text style={[styles.resultAmount, { color: colors.text }]}>
          {formatCurrency(getFinalAmount())}
        </Text>
      </View>

      {paymentResult && (
        <View style={styles.resultDetails}>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
            Order ID: {paymentResult.data?.orderId || paymentSession?.orderId}
          </Text>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
            Transaksi ID: {paymentResult.data?.transactionId || 'N/A'}
          </Text>
          <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
            Waktu: {new Date().toLocaleString('id-ID')}
          </Text>
        </View>
      )}

      <Button
        title="Selesai"
        onPress={handleClose}
        style={styles.finishButton}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {step === 'amount_selection' && renderAmountSelection()}
        {step === 'payment_processing' && renderPaymentProcessing()}
        {step === 'payment_result' && renderPaymentResult()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  requiredAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customAmountInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  customAmountDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  paymentMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
  paymentContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    width: screenWidth,
    height: screenHeight - 100,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cancelWebViewButton: {
    backgroundColor: '#f5f5f5',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  resultDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  finishButton: {
    minWidth: 200,
  },
});

export default DigitalPaymentModal;