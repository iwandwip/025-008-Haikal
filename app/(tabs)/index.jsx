import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import {
  getActiveTimeline,
  getPaymentsByPeriod,
} from "../../services/timelineService";

function StatusPembayaran() {
  const { userProfile } = useAuth();
  const { theme } = useSettings();
  const colors = getColors(theme);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const timelineResult = await getActiveTimeline();
      if (timelineResult.success) {
        setTimeline(timelineResult.timeline);

        if (userProfile?.id) {
          const allPayments = [];

          for (const periodKey of Object.keys(
            timelineResult.timeline.periods
          )) {
            const period = timelineResult.timeline.periods[periodKey];
            if (period.active) {
              const paymentResult = await getPaymentsByPeriod(
                timelineResult.timeline.id,
                periodKey
              );

              if (paymentResult.success) {
                const userPayment = paymentResult.payments.find(
                  (p) => p.santriId === userProfile.id
                );

                if (userPayment) {
                  allPayments.push({
                    ...userPayment,
                    periodData: period,
                  });
                }
              }
            }
          }

          setPayments(allPayments);
        }
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      setPayments([]);
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
      month: "long",
      year: "numeric",
    });
  };

  const renderPaymentItem = ({ item }) => (
    <View
      style={[
        styles.paymentCard,
        { backgroundColor: colors.white, borderColor: colors.gray200 },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.monthText, { color: colors.gray900 }]}>
          {item.periodData.label}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
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
      </View>

      {item.status === "belum_bayar" && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={() => {}}
        >
          <Text style={[styles.payButtonText, { color: colors.white }]}>
            Bayar Sekarang
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Status Pembayaran Bisyaroh</Text>
          {userProfile && (
            <Text style={styles.subtitle}>
              Santri: {userProfile.namaSantri}
            </Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>
            Memuat data pembayaran...
          </Text>
        </View>
      </SafeAreaView>
    );
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
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray600 }]}>
            {timeline
              ? "Belum ada data pembayaran"
              : "Belum ada timeline aktif"}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.gray500 }]}>
            {timeline
              ? "Data pembayaran akan muncul setelah admin generate tagihan"
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
    },
    loadingText: {
      fontSize: 16,
    },
    listContent: {
      padding: 24,
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
      alignItems: "center",
      marginBottom: 12,
    },
    monthText: {
      fontSize: 16,
      fontWeight: "600",
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
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
    },
    valueText: {
      fontSize: 14,
      fontWeight: "600",
    },
    payButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
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
    emptyText: {
      fontSize: 16,
      fontWeight: "500",
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
