import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import Button from "./Button";

const PaymentDetailModal = ({ visible, payment, onClose, onPayNow }) => {
  const { theme } = useSettings();
  const colors = getColors(theme);

  if (!payment) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "lunas":
        return colors.success;
      case "belum_bayar":
        return colors.error;
      case "terlambat":
        return colors.warning;
      default:
        return colors.gray500;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "lunas":
        return "Lunas";
      case "belum_bayar":
        return "Belum Bayar";
      case "terlambat":
        return "Terlambat";
      default:
        return "Unknown";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Pembayaran</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.periodSection}>
              <Text style={styles.periodTitle}>
                {payment.periodData?.label ||
                  `Periode ${payment.periodData?.number}`}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(payment.status) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(payment.status) },
                  ]}
                >
                  {getStatusLabel(payment.status)}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nominal Pembayaran:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: getStatusColor(payment.status) },
                  ]}
                >
                  {getStatusLabel(payment.status)}
                </Text>
              </View>

              {payment.paymentDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Pembayaran:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(payment.paymentDate)}
                  </Text>
                </View>
              )}

              {payment.paymentMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
                  <Text style={styles.detailValue}>
                    {payment.paymentMethod === "tunai"
                      ? "Tunai (Di TPQ)"
                      : "Online"}
                  </Text>
                </View>
              )}

              {payment.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Catatan:</Text>
                  <Text style={[styles.detailValue, styles.notesText]}>
                    {payment.notes}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID Transaksi:</Text>
                <Text style={[styles.detailValue, styles.transactionId]}>
                  {payment.id}
                </Text>
              </View>
            </View>

            {payment.status !== "lunas" && (
              <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Opsi Pembayaran</Text>
                <Text style={styles.paymentDescription}>
                  Anda dapat melakukan pembayaran melalui:
                </Text>

                <View style={styles.paymentOptions}>
                  <View style={styles.paymentOption}>
                    <Text style={styles.optionIcon}>🏪</Text>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>Bayar di TPQ</Text>
                      <Text style={styles.optionDesc}>
                        Bayar langsung menggunakan mesin pembayaran di TPQ
                      </Text>
                    </View>
                  </View>

                  <View style={styles.paymentOption}>
                    <Text style={styles.optionIcon}>💳</Text>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>Bayar Online</Text>
                      <Text style={styles.optionDesc}>
                        Transfer bank, QRIS, atau e-wallet
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {payment.status !== "lunas" ? (
              <View style={styles.actionButtons}>
                <Button
                  title="Tutup"
                  onPress={onClose}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <Button
                  title="Bayar Sekarang"
                  onPress={() => onPayNow && onPayNow(payment)}
                  style={[
                    styles.payButton,
                    {
                      backgroundColor:
                        payment.status === "terlambat"
                          ? colors.warning
                          : colors.primary,
                    },
                  ]}
                />
              </View>
            ) : (
              <Button
                title="Tutup"
                onPress={onClose}
                style={styles.closeOnlyButton}
              />
            )}
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
      minHeight: "60%",
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
    periodSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
    },
    periodTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    detailSection: {
      paddingVertical: 20,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.gray600,
      fontWeight: "500",
      flex: 1,
    },
    detailValue: {
      fontSize: 14,
      color: colors.gray900,
      fontWeight: "600",
      flex: 1.5,
      textAlign: "right",
    },
    notesText: {
      fontWeight: "400",
      lineHeight: 20,
    },
    transactionId: {
      fontSize: 12,
      fontFamily: "monospace",
      color: colors.gray500,
    },
    paymentSection: {
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
    },
    paymentTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 8,
    },
    paymentDescription: {
      fontSize: 14,
      color: colors.gray600,
      marginBottom: 16,
      lineHeight: 20,
    },
    paymentOptions: {
      gap: 12,
    },
    paymentOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.gray50,
      padding: 16,
      borderRadius: 12,
      gap: 12,
    },
    optionIcon: {
      fontSize: 24,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 4,
    },
    optionDesc: {
      fontSize: 12,
      color: colors.gray600,
      lineHeight: 16,
    },
    modalFooter: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      borderColor: colors.gray400,
    },
    payButton: {
      flex: 2,
    },
    closeOnlyButton: {
      backgroundColor: colors.gray600,
    },
  });

export default PaymentDetailModal;
