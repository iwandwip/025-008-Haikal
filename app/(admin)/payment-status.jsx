import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";
import { getAllUsersPaymentStatus } from "../../services/adminPaymentService";

function PaymentStatus() {
  const { theme } = useSettings();
  const colors = getColors(theme);
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const result = await getAllUsersPaymentStatus();

      if (result.success) {
        setUsers(result.users);
        setTimeline(result.timeline);
        setFilteredUsers(result.users);
      } else {
        setUsers([]);
        setTimeline(null);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error("Error loading payment status:", error);
      setUsers([]);
      setTimeline(null);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.namaSantri?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.namaWali?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handleUserPress = (user) => {
    router.push({
      pathname: "/(admin)/user-payment-detail",
      params: {
        userId: user.id,
        userName: user.namaSantri || "Santri",
        timelineId: timeline?.id,
      },
    });
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

  const getStatusColor = (percentage) => {
    if (percentage === 100) return colors.success;
    if (percentage >= 70) return colors.warning;
    return colors.error;
  };

  const getStatusText = (summary) => {
    if (summary.progressPercentage === 100) return "Lunas Semua";
    if (summary.belumBayar > 0 && summary.terlambat > 0) return "Ada Tunggakan";
    if (summary.belumBayar > 0) return "Belum Bayar";
    if (summary.terlambat > 0) return "Terlambat";
    return "Sebagian Lunas";
  };

  const renderUserItem = ({ item: user }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { backgroundColor: colors.white, borderColor: colors.gray200 },
      ]}
      onPress={() => handleUserPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.gray900 }]}>
            {user.namaSantri || "Nama Santri"}
          </Text>
          <Text style={[styles.parentName, { color: colors.gray600 }]}>
            Wali: {user.namaWali || "Nama Wali"}
          </Text>
          <Text style={[styles.userEmail, { color: colors.gray500 }]}>
            {user.email}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <View
            style={[
              styles.progressCircle,
              {
                borderColor: getStatusColor(
                  user.paymentSummary.progressPercentage
                ),
              },
            ]}
          >
            <Text
              style={[
                styles.progressText,
                {
                  color: getStatusColor(user.paymentSummary.progressPercentage),
                },
              ]}
            >
              {user.paymentSummary.progressPercentage}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentSummary}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.success }]}>
              {user.paymentSummary.lunas}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray600 }]}>
              Lunas
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.error }]}>
              {user.paymentSummary.belumBayar}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray600 }]}>
              Belum
            </Text>
          </View>

          {user.paymentSummary.terlambat > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: colors.warning }]}>
                {user.paymentSummary.terlambat}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.gray600 }]}>
                Terlambat
              </Text>
            </View>
          )}

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: colors.gray900 }]}>
              {user.paymentSummary.total}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray600 }]}>
              Total
            </Text>
          </View>
        </View>

        <View style={styles.amountInfo}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.gray600 }]}>
              Sudah Dibayar:
            </Text>
            <Text style={[styles.amountValue, { color: colors.success }]}>
              {formatCurrency(user.paymentSummary.paidAmount)}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.gray600 }]}>
              Belum Dibayar:
            </Text>
            <Text style={[styles.amountValue, { color: colors.error }]}>
              {formatCurrency(user.paymentSummary.unpaidAmount)}
            </Text>
          </View>
        </View>

        {user.paymentSummary.lastPaymentDate && (
          <View style={styles.lastPayment}>
            <Text style={[styles.lastPaymentText, { color: colors.gray500 }]}>
              Terakhir bayar: {formatDate(user.paymentSummary.lastPaymentDate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text
          style={[
            styles.statusText,
            { color: getStatusColor(user.paymentSummary.progressPercentage) },
          ]}
        >
          {getStatusText(user.paymentSummary)}
        </Text>
        <Text style={[styles.arrowText, { color: colors.gray400 }]}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: colors.gray400 }]}>👥</Text>
      <Text style={[styles.emptyText, { color: colors.gray600 }]}>
        {timeline ? "Belum ada data santri" : "Belum ada timeline aktif"}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.gray500 }]}>
        {timeline
          ? "Data santri akan muncul setelah ada yang mendaftar"
          : "Buat timeline terlebih dahulu"}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.gray600 }]}>
        Memuat data pembayaran santri...
      </Text>
    </View>
  );

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Status Pembayaran Santri</Text>
        </View>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Status Pembayaran Santri</Text>
        {timeline && (
          <Text style={styles.subtitle}>Timeline: {timeline.name}</Text>
        )}
      </View>

      {timeline && (
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.white,
                borderColor: colors.gray300,
                color: colors.gray900,
              },
            ]}
            placeholder="Cari nama santri, wali, atau email..."
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
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
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={15}
          removeClippedSubviews={true}
        />
      ) : (
        renderEmptyState()
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
    backButton: {
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "500",
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
    searchContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
    },
    listContent: {
      padding: 24,
    },
    userCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    userHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    userInfo: {
      flex: 1,
      marginRight: 16,
    },
    userName: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
    parentName: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 12,
    },
    statusBadge: {
      alignItems: "center",
    },
    progressCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    progressText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    paymentSummary: {
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    summaryItem: {
      alignItems: "center",
      flex: 1,
    },
    summaryNumber: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: "500",
    },
    amountInfo: {
      marginBottom: 12,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    amountLabel: {
      fontSize: 14,
      fontWeight: "500",
    },
    amountValue: {
      fontSize: 14,
      fontWeight: "600",
    },
    lastPayment: {
      marginTop: 8,
    },
    lastPaymentText: {
      fontSize: 12,
      fontStyle: "italic",
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.gray200,
      paddingTop: 12,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
    },
    arrowText: {
      fontSize: 18,
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    loadingText: {
      fontSize: 16,
      marginTop: 16,
      textAlign: "center",
    },
  });

export default PaymentStatus;
