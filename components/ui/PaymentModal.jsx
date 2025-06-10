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
  const { theme } = useSettings();
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

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Metode Pembayaran</Text>
            {!processing && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.periodTitle}>
                {payment.periodData?.label ||
                  `Periode ${payment.periodData?.number}`}
              </Text>
              <Text style={styles.amountText}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>

            <View style={styles.methodsSection}>
              <Text style={styles.sectionTitle}>Pilih Metode Pembayaran:</Text>

              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod?.id === method.id &&
                      styles.methodCardSelected,
                  ]}
                  onPress={() => handleMethodSelect(method)}
                  disabled={processing}
                >
                  <View style={styles.methodIcon}>
                    <Text style={styles.methodIconText}>{method.icon}</Text>
                  </View>

                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDescription}>
                      {method.description}
                    </Text>
                    <Text style={styles.methodDetails}>{method.details}</Text>
                  </View>

                  {selectedMethod?.id === method.id && (
                    <View style={styles.selectedIcon}>
                      <Text style={styles.selectedIconText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {processing && (
              <View style={styles.processingSection}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>
                  Memproses pembayaran melalui {selectedMethod?.name}...
                </Text>
                <Text style={styles.processingSubtext}>
                  Mohon tunggu sebentar
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Batal"
              onPress={handleClose}
              variant="outline"
              style={styles.cancelButton}
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

const createStyles = (colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.white,
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
      borderBottomColor: colors.gray200,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.gray900,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray100,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.gray600,
      fontWeight: "600",
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 24,
    },
    paymentInfo: {
      backgroundColor: colors.primary + "10",
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      marginVertical: 20,
    },
    periodTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 8,
    },
    amountText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.primary,
    },
    methodsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
    },
    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.gray200,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    methodCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "08",
    },
    methodIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.gray100,
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
      color: colors.gray900,
      marginBottom: 4,
    },
    methodDescription: {
      fontSize: 14,
      color: colors.gray600,
      marginBottom: 2,
    },
    methodDetails: {
      fontSize: 12,
      color: colors.gray500,
    },
    selectedIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedIconText: {
      color: colors.white,
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
      color: colors.gray900,
      marginTop: 16,
      textAlign: "center",
    },
    processingSubtext: {
      fontSize: 14,
      color: colors.gray600,
      marginTop: 8,
      textAlign: "center",
    },
    modalFooter: {
      flexDirection: "row",
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      borderColor: colors.gray400,
    },
    payButton: {
      flex: 2,
    },
  });

export default PaymentModal;
