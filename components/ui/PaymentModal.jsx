import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import {
  getUserCreditBalance,
  calculatePaymentAllocation,
} from "../../services/creditService";
import Button from "./Button";

const PaymentModal = ({
  visible,
  payment,
  allPayments = [],
  onClose,
  onPaymentSuccess,
}) => {
  const { userProfile } = useAuth();
  const { theme, loading: settingsLoading } = useSettings();
  const colors = getColors(theme);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [creditBalance, setCreditBalance] = useState(0);
  const [paymentAllocation, setPaymentAllocation] = useState(null);
  const [loadingCredit, setLoadingCredit] = useState(false);

  if (!payment) return null;

  useEffect(() => {
    if (visible && userProfile?.id) {
      loadCreditBalance();
    }
  }, [visible, userProfile?.id]);

  useEffect(() => {
    if (isCustomPayment && customAmount && allPayments.length > 0) {
      calculateAllocation();
    } else {
      setPaymentAllocation(null);
    }
  }, [customAmount, isCustomPayment, creditBalance, allPayments]);

  const loadCreditBalance = async () => {
    setLoadingCredit(true);
    try {
      const result = await getUserCreditBalance(userProfile.id);
      if (result.success) {
        setCreditBalance(result.balance);
      }
    } catch (error) {
      console.error("Error loading credit balance:", error);
    }
    setLoadingCredit(false);
  };

  const calculateAllocation = () => {
    const amount = parseInt(customAmount.replace(/[^0-9]/g, "")) || 0;
    if (amount <= 0) {
      setPaymentAllocation(null);
      return;
    }

    const result = calculatePaymentAllocation(
      amount,
      allPayments,
      creditBalance
    );
    if (result.success) {
      setPaymentAllocation(result);
    }
  };

  const paymentMethods = [
    {
      id: "bca",
      name: "Transfer BCA",
      icon: "🏦",
      description: "Transfer ke rekening BCA TPQ",
      details: "Rek: 1234567890 a.n. TPQ Ibadurrohman",
    },
    {
      id: "mandiri",
      name: "Transfer Mandiri",
      icon: "🏦",
      description: "Transfer ke rekening Mandiri TPQ",
      details: "Rek: 0987654321 a.n. TPQ Ibadurrohman",
    },
    {
      id: "qris",
      name: "QRIS",
      icon: "📱",
      description: "Scan QRIS untuk pembayaran",
      details: "Scan QR Code dengan aplikasi mobile banking",
    },
    {
      id: "gopay",
      name: "GoPay",
      icon: "💚",
      description: "Bayar dengan GoPay",
      details: "Transfer ke 081234567890",
    },
    {
      id: "ovo",
      name: "OVO",
      icon: "💜",
      description: "Bayar dengan OVO",
      details: "Transfer ke 081234567890",
    },
    {
      id: "dana",
      name: "DANA",
      icon: "💙",
      description: "Bayar dengan DANA",
      details: "Transfer ke 081234567890",
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatInputCurrency = (value) => {
    const number = value.replace(/[^0-9]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleCustomAmountChange = (text) => {
    const formatted = formatInputCurrency(text);
    setCustomAmount(formatted);
  };

  const getEffectiveAmount = () => {
    if (isCustomPayment) {
      return parseInt(customAmount.replace(/[^0-9]/g, "")) || 0;
    }
    return Math.max(0, payment.amount - (payment.creditApplied || 0));
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert(
        "Pilih Metode",
        "Silakan pilih metode pembayaran terlebih dahulu"
      );
      return;
    }

    const paymentAmount = getEffectiveAmount();
    if (paymentAmount <= 0 && !isCustomPayment) {
      Alert.alert("Error", "Nominal pembayaran tidak valid");
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      let successMessage = "";

      if (isCustomPayment && paymentAllocation) {
        const { allocations, summary } = paymentAllocation;
        successMessage = `Pembayaran ${formatCurrency(
          paymentAmount
        )} berhasil!\n\n`;

        if (allocations.length > 0) {
          successMessage += `Periode yang lunas:\n`;
          allocations.forEach((alloc, index) => {
            successMessage += `${index + 1}. ${alloc.periodLabel}\n`;
          });
        }

        if (summary.creditUsed > 0) {
          successMessage += `\nCredit digunakan: ${formatCurrency(
            summary.creditUsed
          )}`;
        }

        if (summary.newCreditGenerated > 0) {
          successMessage += `\nCredit baru: ${formatCurrency(
            summary.newCreditGenerated
          )}`;
        }

        successMessage += `\nSaldo credit: ${formatCurrency(
          summary.finalCreditBalance
        )}`;
      } else {
        successMessage = `Pembayaran ${
          payment.periodData?.label
        } sebesar ${formatCurrency(paymentAmount)} berhasil diproses melalui ${
          selectedMethod.name
        }.`;

        if (creditBalance > 0) {
          const creditUsed = Math.min(creditBalance, payment.amount);
          if (creditUsed > 0) {
            successMessage += `\n\nCredit digunakan: ${formatCurrency(
              creditUsed
            )}`;
          }
        }
      }

      Alert.alert("Pembayaran Berhasil! 🎉", successMessage, [
        {
          text: "OK",
          onPress: () => {
            setProcessing(false);
            setSelectedMethod(null);
            setIsCustomPayment(false);
            setCustomAmount("");
            setPaymentAllocation(null);
            onPaymentSuccess(
              payment,
              selectedMethod.id,
              isCustomPayment ? paymentAmount : null,
              paymentAllocation
            );
            onClose();
          },
        },
      ]);
    }, 2000);
  };

  const handleClose = () => {
    if (!processing) {
      setSelectedMethod(null);
      setIsCustomPayment(false);
      setCustomAmount("");
      setPaymentAllocation(null);
      onClose();
    }
  };

  if (settingsLoading) {
    return null;
  }

  const effectiveAmount = getEffectiveAmount();
  const creditApplied = Math.min(creditBalance, payment.amount);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContainer, { backgroundColor: colors.white }]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.gray200 }]}
          >
            <Text style={[styles.modalTitle, { color: colors.gray900 }]}>
              Pilih Metode Pembayaran
            </Text>
            {!processing && (
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.gray100 },
                ]}
                onPress={handleClose}
              >
                <Text
                  style={[styles.closeButtonText, { color: colors.gray600 }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {creditBalance > 0 && (
              <View
                style={[
                  styles.creditInfo,
                  { backgroundColor: colors.primary + "10" },
                ]}
              >
                <Text style={[styles.creditLabel, { color: colors.primary }]}>
                  💰 Saldo Credit Anda
                </Text>
                <Text style={[styles.creditAmount, { color: colors.primary }]}>
                  {formatCurrency(creditBalance)}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.paymentTypeSelector,
                { backgroundColor: colors.gray50 },
              ]}
            >
              <View style={styles.switchContainer}>
                <Text style={[styles.switchLabel, { color: colors.gray900 }]}>
                  {isCustomPayment ? "Bayar Custom" : "Bayar Tagihan"}
                </Text>
                <Switch
                  value={isCustomPayment}
                  onValueChange={setIsCustomPayment}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            <View
              style={[
                styles.paymentInfo,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              {!isCustomPayment ? (
                <>
                  <Text style={[styles.periodTitle, { color: colors.gray900 }]}>
                    {payment.periodData?.label ||
                      `Periode ${payment.periodData?.number}`}
                  </Text>
                  <Text
                    style={[styles.originalAmount, { color: colors.gray600 }]}
                  >
                    Nominal: {formatCurrency(payment.amount)}
                  </Text>
                  {creditApplied > 0 && (
                    <Text
                      style={[styles.creditUsed, { color: colors.success }]}
                    >
                      Credit digunakan: {formatCurrency(creditApplied)}
                    </Text>
                  )}
                  <Text style={[styles.amountText, { color: colors.primary }]}>
                    Yang harus dibayar: {formatCurrency(effectiveAmount)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.periodTitle, { color: colors.gray900 }]}>
                    Pembayaran Custom
                  </Text>
                  <View style={styles.customInputContainer}>
                    <Text
                      style={[
                        styles.customInputLabel,
                        { color: colors.gray700 },
                      ]}
                    >
                      Nominal (Rp):
                    </Text>
                    <TextInput
                      style={[
                        styles.customInput,
                        { borderColor: colors.gray300, color: colors.gray900 },
                      ]}
                      value={customAmount}
                      onChangeText={handleCustomAmountChange}
                      placeholder="Masukkan nominal"
                      placeholderTextColor={colors.gray500}
                      keyboardType="numeric"
                    />
                  </View>

                  {paymentAllocation &&
                    paymentAllocation.allocations.length > 0 && (
                      <View
                        style={[
                          styles.allocationPreview,
                          { backgroundColor: colors.white },
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewTitle,
                            { color: colors.gray900 },
                          ]}
                        >
                          Preview Pembayaran:
                        </Text>
                        {paymentAllocation.allocations.map((alloc, index) => (
                          <Text
                            key={index}
                            style={[
                              styles.previewItem,
                              { color: colors.success },
                            ]}
                          >
                            ✅ {alloc.periodLabel}:{" "}
                            {formatCurrency(alloc.totalAmount)}
                          </Text>
                        ))}

                        {paymentAllocation.summary.creditUsed > 0 && (
                          <Text
                            style={[
                              styles.previewCredit,
                              { color: colors.warning },
                            ]}
                          >
                            💰 Credit digunakan:{" "}
                            {formatCurrency(
                              paymentAllocation.summary.creditUsed
                            )}
                          </Text>
                        )}

                        {paymentAllocation.summary.newCreditGenerated > 0 && (
                          <Text
                            style={[
                              styles.previewCredit,
                              { color: colors.success },
                            ]}
                          >
                            💰 Credit baru:{" "}
                            {formatCurrency(
                              paymentAllocation.summary.newCreditGenerated
                            )}
                          </Text>
                        )}

                        <Text
                          style={[
                            styles.previewFinal,
                            { color: colors.primary },
                          ]}
                        >
                          Saldo credit akhir:{" "}
                          {formatCurrency(
                            paymentAllocation.summary.finalCreditBalance
                          )}
                        </Text>
                      </View>
                    )}
                </>
              )}
            </View>

            <View style={styles.methodsSection}>
              <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>
                Pilih Metode Pembayaran:
              </Text>

              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: colors.white,
                      borderColor:
                        selectedMethod?.id === method.id
                          ? colors.primary
                          : colors.gray200,
                    },
                    selectedMethod?.id === method.id && {
                      backgroundColor: colors.primary + "08",
                    },
                  ]}
                  onPress={() => handleMethodSelect(method)}
                  disabled={processing}
                >
                  <View
                    style={[
                      styles.methodIcon,
                      { backgroundColor: colors.gray100 },
                    ]}
                  >
                    <Text style={styles.methodIconText}>{method.icon}</Text>
                  </View>

                  <View style={styles.methodInfo}>
                    <Text
                      style={[styles.methodName, { color: colors.gray900 }]}
                    >
                      {method.name}
                    </Text>
                    <Text
                      style={[
                        styles.methodDescription,
                        { color: colors.gray600 },
                      ]}
                    >
                      {method.description}
                    </Text>
                    <Text
                      style={[styles.methodDetails, { color: colors.gray500 }]}
                    >
                      {method.details}
                    </Text>
                  </View>

                  {selectedMethod?.id === method.id && (
                    <View
                      style={[
                        styles.selectedIcon,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectedIconText,
                          { color: colors.white },
                        ]}
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {processing && (
              <View style={styles.processingSection}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.processingText, { color: colors.gray900 }]}
                >
                  Memproses pembayaran melalui {selectedMethod?.name}...
                </Text>
                <Text
                  style={[styles.processingSubtext, { color: colors.gray600 }]}
                >
                  Mohon tunggu sebentar
                </Text>
              </View>
            )}
          </ScrollView>

          <View
            style={[styles.modalFooter, { borderTopColor: colors.gray200 }]}
          >
            <Button
              title="Batal"
              onPress={handleClose}
              variant="outline"
              style={[styles.cancelButton, { borderColor: colors.gray400 }]}
              disabled={processing}
            />
            <Button
              title={processing ? "Memproses..." : "Bayar Sekarang"}
              onPress={handlePayNow}
              style={[
                styles.payButton,
                {
                  backgroundColor:
                    selectedMethod &&
                    (effectiveAmount > 0 || (isCustomPayment && customAmount))
                      ? colors.primary
                      : colors.gray400,
                },
              ]}
              disabled={
                !selectedMethod ||
                processing ||
                (effectiveAmount <= 0 && !isCustomPayment) ||
                (isCustomPayment &&
                  (!customAmount ||
                    parseInt(customAmount.replace(/[^0-9]/g, "")) <= 0))
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "95%",
    minHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  creditInfo: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  creditLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  creditAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  paymentTypeSelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  paymentInfo: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  originalAmount: {
    fontSize: 14,
    marginBottom: 4,
  },
  creditUsed: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  customInputContainer: {
    width: "100%",
    marginTop: 8,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  allocationPreview: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  previewItem: {
    fontSize: 12,
    marginBottom: 2,
  },
  previewCredit: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  previewFinal: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  methodsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  methodDetails: {
    fontSize: 12,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIconText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  processingSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  processingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});

export default PaymentModal;
