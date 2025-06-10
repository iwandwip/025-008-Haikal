import React, { useState } from "react";
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

function StatusPembayaran() {
  const { userProfile } = useAuth();
  const { theme } = useSettings();
  const colors = getColors(theme);
  const [refreshing, setRefreshing] = useState(false);

  const staticPaymentData = [
    {
      id: 1,
      bulan: "Januari 2024",
      nominal: 40000,
      status: "Lunas",
      tanggalBayar: "2024-01-05",
      metodeBayar: "Tunai",
    },
    {
      id: 2,
      bulan: "Februari 2024",
      nominal: 40000,
      status: "Lunas",
      tanggalBayar: "2024-02-03",
      metodeBayar: "Online",
    },
    {
      id: 3,
      bulan: "Maret 2024",
      nominal: 40000,
      status: "Belum Lunas",
      tanggalBayar: null,
      metodeBayar: null,
    },
    {
      id: 4,
      bulan: "April 2024",
      nominal: 40000,
      status: "Belum Lunas",
      tanggalBayar: null,
      metodeBayar: null,
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Lunas":
        return colors.success;
      case "Belum Lunas":
        return colors.error;
      default:
        return colors.gray500;
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
          {item.bulan}
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
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={[styles.labelText, { color: colors.gray600 }]}>
            Nominal:
          </Text>
          <Text style={[styles.valueText, { color: colors.gray900 }]}>
            {formatCurrency(item.nominal)}
          </Text>
        </View>

        {item.tanggalBayar && (
          <View style={styles.infoRow}>
            <Text style={[styles.labelText, { color: colors.gray600 }]}>
              Tanggal Bayar:
            </Text>
            <Text style={[styles.valueText, { color: colors.gray900 }]}>
              {formatDate(item.tanggalBayar)}
            </Text>
          </View>
        )}

        {item.metodeBayar && (
          <View style={styles.infoRow}>
            <Text style={[styles.labelText, { color: colors.gray600 }]}>
              Metode:
            </Text>
            <Text style={[styles.valueText, { color: colors.gray900 }]}>
              {item.metodeBayar}
            </Text>
          </View>
        )}
      </View>

      {item.status === "Belum Lunas" && (
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Status Pembayaran Bisyaroh</Text>
        {userProfile && (
          <Text style={styles.subtitle}>Santri: {userProfile.namaSantri}</Text>
        )}
      </View>

      <FlatList
        data={staticPaymentData}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id.toString()}
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
  });

export default StatusPembayaran;
