import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import Button from "./Button";

const PaymentModal = ({ visible, payment, onClose, onPaymentSuccess }) => {
  const { theme, loading: settingsLoading } = useSettings();
  const colors = getColors(theme);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  if (!payment) return null;

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

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert(
        "Pilih Metode",
        "Silakan pilih metode pembayaran terlebih dahulu"
      );
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      Alert.alert(
        "Pembayaran Berhasil! 🎉",
        `Pembayaran ${payment.periodData?.label} sebesar ${formatCurrency(
          payment.amount
        )} berhasil diproses melalui ${selectedMethod.name}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setProcessing(false);
              setSelectedMethod(null);
              onPaymentSuccess(payment, selectedMethod.id);
              onClose();
            },
          },
        ]
      );
    }, 2000);
  };

  const handleClose = () => {
    if (!processing) {
      setSelectedMethod(null);
      onClose();
    }
  };

  if (settingsLoading) {
    return null;
  }

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
            <View
              style={[
                styles.paymentInfo,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Text style={[styles.periodTitle, { color: colors.gray900 }]}>
                {payment.periodData?.label ||
                  `Periode ${payment.periodData?.number}`}
              </Text>
              <Text style={[styles.amountText, { color: colors.primary }]}>
                {formatCurrency(payment.amount)}
              </Text>
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
                  backgroundColor: selectedMethod
                    ? colors.primary
                    : colors.gray400,
                },
              ]}
              disabled={!selectedMethod || processing}
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
    maxHeight: "90%",
    minHeight: "70%",
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
  paymentInfo: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "bold",
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
