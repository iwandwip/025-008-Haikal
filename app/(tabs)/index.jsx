import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import {
  getWaliPaymentHistory,
  getPaymentSummary,
} from "../../services/waliPaymentService";

function StatusPembayaran() {
  const { userProfile } = useAuth();
  const { theme } = useSettings();
  const colors = getColors(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Memuat data pembayaran...");

  const loadData = async () => {
    try {
      if (!userProfile?.id) {
        setPayments([]);
        setSummary(null);
        setTimeline(null);
        setLoading(false);
        return;
      }

      setLoadingText("Mengambil timeline aktif...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLoadingText("Memuat data pembayaran...");
      const result = await getWaliPaymentHistory(userProfile.id);

      if (result.success) {
        setLoadingText("Menyiapkan data...");
        await new Promise((resolve) => setTimeout(resolve, 300));

        setPayments(result.payments);
        setTimeline(result.timeline);
        setSummary(getPaymentSummary(result.payments));

        setLoadingText("Menyelesaikan...");
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else {
        setPayments([]);
        setSummary(null);
        setTimeline(null);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      setPayments([]);
      setSummary(null);
      setTimeline(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "lunas":
        return "✅";
      case "belum_bayar":
        return "❌";
      case "terlambat":
        return "⚠️";
      default:
        return "❓";
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
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderLoadingScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Status Pembayaran Bisyaroh</Text>
        {userProfile && (
          <Text style={styles.subtitle}>Santri: {userProfile.namaSantri}</Text>
        )}
      </View>

      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingSpinner}
          />
          <Text style={[styles.loadingMainText, { color: colors.gray900 }]}>
            {loadingText}
          </Text>
          <Text style={[styles.loadingSubText, { color: colors.gray600 }]}>
            Mohon tunggu sebentar...
          </Text>

          <View style={styles.loadingProgress}>
            <View
              style={[styles.progressBar, { backgroundColor: colors.gray200 }]}
            >
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.white, borderColor: colors.gray200 },
        ]}
      >
        <Text style={[styles.summaryTitle, { color: colors.gray900 }]}>
          Ringkasan Pembayaran
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: colors.gray700 }]}>
              Progress: {summary.lunas}/{summary.total} periode
            </Text>
            <Text
              style={[styles.progressPercentage, { color: colors.primary }]}
            >
              {summary.progressPercentage}%
            </Text>
          </View>

          <View
            style={[styles.progressBar, { backgroundColor: colors.gray200 }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.success,
                  width: `${summary.progressPercentage}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {summary.lunas}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray600 }]}>
                Lunas
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.error }]}>
                {summary.belumBayar}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray600 }]}>
                Belum Bayar
              </Text>
            </View>

            {summary.terlambat > 0 && (
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {summary.terlambat}
                </Text>
                <Text style={[styles.statLabel, { color: colors.gray600 }]}>
                  Terlambat
                </Text>
              </View>
            )}
          </View>

          <View style={styles.amountSummary}>
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.gray600 }]}>
                Total Tagihan:
              </Text>
              <Text style={[styles.amountValue, { color: colors.gray900 }]}>
                {formatCurrency(summary.totalAmount)}
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.gray600 }]}>
                Sudah Dibayar:
              </Text>
              <Text style={[styles.amountValue, { color: colors.success }]}>
                {formatCurrency(summary.paidAmount)}
              </Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.gray600 }]}>
                Belum Dibayar:
              </Text>
              <Text style={[styles.amountValue, { color: colors.error }]}>
                {formatCurrency(summary.unpaidAmount)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentItem = ({ item }) => (
    <View
      style={[
        styles.paymentCard,
        { backgroundColor: colors.white, borderColor: colors.gray200 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.periodInfo}>
          <Text style={[styles.periodText, { color: colors.gray900 }]}>
            {item.periodData.label}
          </Text>
          <Text style={[styles.periodNumber, { color: colors.gray500 }]}>
            Periode {item.periodData.number}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "15" },
          ]}
        >
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={[styles.labelText, { color: colors.gray600 }]}>
            Nominal:
          </Text>
          <Text style={[styles.valueText, { color: colors.gray900 }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>

        {item.paymentDate && (
          <View style={styles.infoRow}>
            <Text style={[styles.labelText, { color: colors.gray600 }]}>
              Tanggal Bayar:
            </Text>
            <Text style={[styles.valueText, { color: colors.gray900 }]}>
              {formatDate(item.paymentDate)}
            </Text>
          </View>
        )}

        {item.paymentMethod && (
          <View style={styles.infoRow}>
            <Text style={[styles.labelText, { color: colors.gray600 }]}>
              Metode:
            </Text>
            <Text style={[styles.valueText, { color: colors.gray900 }]}>
              {item.paymentMethod === "tunai" ? "Tunai" : "Online"}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.infoRow}>
            <Text style={[styles.labelText, { color: colors.gray600 }]}>
              Catatan:
            </Text>
            <Text style={[styles.valueText, { color: colors.gray700 }]}>
              {item.notes}
            </Text>
          </View>
        )}
      </View>

      {item.status === "belum_bayar" && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={() => {}}
        >
          <Text style={[styles.payButtonText, { color: colors.white }]}>
            💳 Bayar Sekarang
          </Text>
        </TouchableOpacity>
      )}

      {item.status === "terlambat" && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.warning }]}
          onPress={() => {}}
        >
          <Text style={[styles.payButtonText, { color: colors.white }]}>
            ⚡ Bayar Segera
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = createStyles(colors);

  if (loading) {
    return renderLoadingScreen();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Status Pembayaran Bisyaroh</Text>
        {userProfile && (
          <Text style={styles.subtitle}>Santri: {userProfile.namaSantri}</Text>
        )}
        {timeline && (
          <Text style={styles.timelineInfo}>Timeline: {timeline.name}</Text>
        )}
      </View>

      {payments.length > 0 ? (
        <FlatList
          data={[{ type: "summary" }, ...payments]}
          renderItem={({ item, index }) => {
            if (item.type === "summary") {
              return renderSummaryCard();
            }
            return renderPaymentItem({ item });
          }}
          keyExtractor={(item, index) =>
            item.type === "summary" ? "summary" : item.id
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Memuat ulang..."
              titleColor={colors.gray600}
            />
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: index === 0 ? 250 : 180,
            offset: index === 0 ? 0 : 250 + (index - 1) * 180,
            index,
          })}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyIcon, { color: colors.gray400 }]}>📊</Text>
          <Text style={[styles.emptyText, { color: colors.gray600 }]}>
            {timeline
              ? "Belum ada data pembayaran"
              : "Belum ada timeline aktif"}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.gray500 }]}>
            {timeline
              ? "Data pembayaran akan muncul setelah admin membuat timeline"
              : "Admin belum membuat timeline pembayaran"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
      backgroundColor: colors.white,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.gray900,
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.gray600,
      textAlign: "center",
    },
    timelineInfo: {
      fontSize: 12,
      color: colors.primary,
      textAlign: "center",
      marginTop: 4,
      fontWeight: "500",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    loadingCard: {
      backgroundColor: colors.white,
      borderRadius: 20,
      padding: 40,
      alignItems: "center",
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.gray200,
      minWidth: 300,
    },
    loadingSpinner: {
      marginBottom: 20,
    },
    loadingMainText: {
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 8,
    },
    loadingSubText: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 24,
    },
    loadingProgress: {
      width: "100%",
    },
    listContent: {
      padding: 24,
    },
    summaryCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 20,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      fontWeight: "500",
    },
    progressPercentage: {
      fontSize: 16,
      fontWeight: "700",
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      transition: "width 0.3s ease",
    },
    summaryStats: {
      marginBottom: 16,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 20,
    },
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "500",
    },
    amountSummary: {
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
      paddingTop: 16,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    amountLabel: {
      fontSize: 14,
      fontWeight: "500",
    },
    amountValue: {
      fontSize: 14,
      fontWeight: "600",
    },
    paymentCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    periodInfo: {
      flex: 1,
    },
    periodText: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    periodNumber: {
      fontSize: 12,
      fontWeight: "500",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    statusIcon: {
      fontSize: 14,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    cardContent: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    labelText: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    valueText: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1.5,
      textAlign: "right",
    },
    payButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    payButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
  });

export default StatusPembayaran;
