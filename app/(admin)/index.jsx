import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getThemeByRole } from "../../constants/Colors";
import Button from "../../components/ui/Button";
import { signOutUser } from "../../services/authService";
import { seederService } from "../../services/seederService";
import { 
  unlockSolenoid, 
  lockSolenoid, 
  getSolenoidStatus,
  listenToSolenoidStatus,
  emergencyUnlock 
} from "../../services/solenoidControlService";

function AdminHome() {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { showGeneralNotification } = useNotification();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = getThemeByRole(true); // Admin theme
  const [loggingOut, setLoggingOut] = useState(false);
  const [seederLoading, setSeederLoading] = useState(false);
  const [seederModalVisible, setSeederModalVisible] = useState(false);
  const [seederCount, setSeederCount] = useState("3");
  const [refreshing, setRefreshing] = useState(false);
  const [seederStats, setSeederStats] = useState({
    total: 0,
    seederUsers: 0,
    highestUserNumber: 0,
    nextUserNumber: 1,
  });
  const [solenoidStatus, setSolenoidStatus] = useState({
    status: 'unknown', // locked, unlocked, unknown
    deviceOnline: false,
    lastUpdate: null,
    batteryLevel: 0
  });
  const [solenoidLoading, setSolenoidLoading] = useState(false);

  useEffect(() => {
    loadSeederStats();
    loadSolenoidStatus();
    
    // Listen to real-time solenoid status
    const unsubscribe = listenToSolenoidStatus((statusData) => {
      setSolenoidStatus(statusData);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadSeederStats = async () => {
    try {
      const stats = await seederService.getSeederStats();
      setSeederStats(stats);
    } catch (error) {
      console.error("Error loading seeder stats:", error);
      showGeneralNotification(
        "Error",
        "Gagal memuat statistik seeder",
        "error"
      );
    }
  };

  const loadSolenoidStatus = async () => {
    try {
      const result = await getSolenoidStatus();
      if (result.success) {
        setSolenoidStatus({
          status: result.status,
          deviceOnline: result.deviceOnline,
          lastUpdate: result.lastUpdate,
          batteryLevel: result.batteryLevel
        });
      }
    } catch (error) {
      console.error("Error loading solenoid status:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSeederStats(), loadSolenoidStatus()]);
      showGeneralNotification(
        "Data Diperbarui",
        "Data berhasil dimuat ulang",
        "success",
        { duration: 2000 }
      );
    } catch (error) {
      showGeneralNotification(
        "Error",
        "Gagal memuat ulang data",
        "error"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          const result = await signOutUser();
          if (result.success) {
            router.replace("/role-selection");
          } else {
            showGeneralNotification(
              "Gagal Logout",
              "Gagal keluar. Silakan coba lagi.",
              "error"
            );
          }
          setLoggingOut(false);
        },
      },
    ]);
  };

  const handleSeeder = () => {
    setSeederModalVisible(true);
  };

  const handleSeederConfirm = async () => {
    const count = parseInt(seederCount);

    if (isNaN(count) || count < 1 || count > 10) {
      Alert.alert("Error", "Jumlah akun harus antara 1-10");
      return;
    }

    setSeederModalVisible(false);

    const nextUser = seederStats.nextUserNumber;
    const emailList = [];
    for (let i = 0; i < count; i++) {
      emailList.push(`user${nextUser + i}@gmail.com`);
    }

    Alert.alert(
      "Generate Data Santri",
      `Akan membuat ${count} akun wali santri baru:\n${emailList.join(
        ", "
      )}\n\nLanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            setSeederLoading(true);

            try {
              const result = await seederService.createSeederUsers(count);

              if (result.success) {
                await loadSeederStats();

                let message = `✅ Berhasil membuat ${result.totalCreated} akun santri!\n\n`;

                result.created.forEach((user, index) => {
                  message += `${index + 1}. ${user.namaSantri}\n`;
                  message += `   Email: ${user.email}\n`;
                  message += `   Wali: ${user.namaWali}\n`;
                  message += `   RFID: ${user.rfidSantri}\n\n`;
                });

                message += `Password semua akun: admin123`;

                if (result.totalErrors > 0) {
                  message += `\n\n⚠️ ${result.totalErrors} akun gagal dibuat`;
                }

                showGeneralNotification(
                  "Seeder Berhasil",
                  `Berhasil membuat ${result.totalCreated} akun santri baru`,
                  "success",
                  { duration: 5000 }
                );

                Alert.alert("Detail Seeder", message);
              } else {
                showGeneralNotification(
                  "Seeder Gagal",
                  result.error || "Terjadi kesalahan saat generate data",
                  "error"
                );
              }
            } catch (error) {
              showGeneralNotification(
                "Error",
                "Terjadi kesalahan: " + error.message,
                "error"
              );
            } finally {
              setSeederLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTambahSantri = () => {
    router.push("/(admin)/tambah-santri");
  };

  const handleDaftarSantri = () => {
    router.push("/(admin)/daftar-santri");
  };

  const handleTimelineManager = () => {
    router.push("/(admin)/timeline-manager");
  };

  const handleCekPembayaran = () => {
    router.push("/(admin)/payment-status");
  };

  const handleUnlockSolenoid = async (duration = 30) => {
    setSolenoidLoading(true);
    
    try {
      const result = await unlockSolenoid(duration);
      
      if (result.success) {
        showGeneralNotification(
          "Perintah Terkirim",
          `Perintah buka alat (${duration}s) telah dikirim ke ESP32`,
          "success",
          { duration: 3000 }
        );
      } else {
        showGeneralNotification(
          "Gagal Mengirim Perintah",
          result.error || "Gagal mengirim perintah buka alat",
          "error"
        );
      }
    } catch (error) {
      showGeneralNotification(
        "Error",
        "Terjadi kesalahan saat mengirim perintah",
        "error"
      );
    } finally {
      setSolenoidLoading(false);
    }
  };

  const handleLockSolenoid = async () => {
    setSolenoidLoading(true);
    
    try {
      const result = await lockSolenoid();
      
      if (result.success) {
        showGeneralNotification(
          "Perintah Terkirim",
          "Perintah tutup alat telah dikirim ke ESP32",
          "success",
          { duration: 3000 }
        );
      } else {
        showGeneralNotification(
          "Gagal Mengirim Perintah",
          result.error || "Gagal mengirim perintah tutup alat",
          "error"
        );
      }
    } catch (error) {
      showGeneralNotification(
        "Error",
        "Terjadi kesalahan saat mengirim perintah",
        "error"
      );
    } finally {
      setSolenoidLoading(false);
    }
  };

  const handleEmergencyUnlock = async () => {
    Alert.alert(
      "Emergency Unlock",
      "Apakah Anda yakin ingin membuka alat secara darurat? Ini akan langsung membuka solenoid tanpa batasan waktu.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Emergency Unlock",
          style: "destructive",
          onPress: async () => {
            setSolenoidLoading(true);
            try {
              const result = await emergencyUnlock();
              if (result.success) {
                showGeneralNotification(
                  "Emergency Unlock",
                  "Perintah emergency unlock telah dikirim!",
                  "warning",
                  { duration: 5000 }
                );
              } else {
                showGeneralNotification(
                  "Gagal Emergency Unlock",
                  result.error,
                  "error"
                );
              }
            } catch (error) {
              showGeneralNotification(
                "Error",
                "Terjadi kesalahan saat emergency unlock",
                "error"
              );
            } finally {
              setSolenoidLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleUnlockWithDuration = () => {
    Alert.alert(
      "Buka Alat Pembayaran",
      "Pilih durasi untuk membuka alat:",
      [
        { text: "Batal", style: "cancel" },
        { text: "30 detik", onPress: () => handleUnlockSolenoid(30) },
        { text: "1 menit", onPress: () => handleUnlockSolenoid(60) },
        { text: "5 menit", onPress: () => handleUnlockSolenoid(300) },
        { text: "Emergency", style: "destructive", onPress: handleEmergencyUnlock }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.gray50 }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Tarik untuk memuat ulang..."
            titleColor={colors.gray600}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.gray900 }]}>Dashboard Admin</Text>
          <Text style={[styles.subtitle, { color: colors.gray600 }]}>TPQ Ibadurrohman</Text>
          {userProfile && (
            <Text style={[styles.welcomeText, { color: colors.primary }]}>
              Selamat datang, {userProfile.nama}
            </Text>
          )}
        </View>

        <View style={styles.solenoidSection}>
          <View style={[styles.solenoidCard, { backgroundColor: colors.white }]}>
            <View style={styles.solenoidHeader}>
              <View style={styles.solenoidTitleSection}>
                <Text style={[styles.solenoidTitle, { color: colors.gray900 }]}>Kontrol Alat Pembayaran</Text>
                <View style={styles.solenoidStatusRow}>
                  <View style={[
                    styles.statusIndicator,
                    { 
                      backgroundColor: solenoidStatus.deviceOnline 
                        ? colors.success 
                        : colors.error 
                    }
                  ]} />
                  <Text style={[styles.statusText, { color: colors.gray600 }]}>
                    {solenoidStatus.deviceOnline ? 'Online' : 'Offline'} • 
                    Status: {solenoidStatus.status === 'locked' ? 'Terkunci' : 
                             solenoidStatus.status === 'unlocked' ? 'Terbuka' : 'Unknown'}
                  </Text>
                </View>
                {solenoidStatus.lastUpdate && (
                  <Text style={[styles.lastUpdateText, { color: colors.gray500 }]}>
                    Update: {new Date(solenoidStatus.lastUpdate).toLocaleString('id-ID')}
                  </Text>
                )}
              </View>
              <View style={[styles.batteryIndicator, { borderColor: colors.gray300 }]}>
                <View 
                  style={[
                    styles.batteryFill,
                    { 
                      width: `${solenoidStatus.batteryLevel}%`,
                      backgroundColor: solenoidStatus.batteryLevel > 50 
                        ? colors.success 
                        : solenoidStatus.batteryLevel > 20 
                        ? colors.warning 
                        : colors.error
                    }
                  ]} 
                />
                <Text style={[styles.batteryText, { color: colors.gray700 }]}>
                  {solenoidStatus.batteryLevel}%
                </Text>
              </View>
            </View>

            <View style={styles.solenoidControls}>
              <TouchableOpacity
                style={[
                  styles.solenoidButton,
                  styles.unlockButton,
                  { backgroundColor: colors.success },
                  solenoidLoading && { opacity: 0.7 }
                ]}
                onPress={handleUnlockWithDuration}
                disabled={solenoidLoading || !solenoidStatus.deviceOnline}
                activeOpacity={0.8}
              >
                {solenoidLoading ? (
                  <ActivityIndicator size={20} color={colors.white} />
                ) : (
                  <Text style={styles.solenoidButtonIcon}>🔓</Text>
                )}
                <Text style={[styles.solenoidButtonText, { color: colors.white }]}>
                  Buka Alat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.solenoidButton,
                  styles.lockButton,
                  { backgroundColor: colors.error },
                  solenoidLoading && { opacity: 0.7 }
                ]}
                onPress={handleLockSolenoid}
                disabled={solenoidLoading || !solenoidStatus.deviceOnline}
                activeOpacity={0.8}
              >
                {solenoidLoading ? (
                  <ActivityIndicator size={20} color={colors.white} />
                ) : (
                  <Text style={styles.solenoidButtonIcon}>🔒</Text>
                )}
                <Text style={[styles.solenoidButtonText, { color: colors.white }]}>
                  Tutup Alat
                </Text>
              </TouchableOpacity>
            </View>

            {!solenoidStatus.deviceOnline && (
              <View style={[styles.offlineWarning, { backgroundColor: colors.warning + '15' }]}>
                <Text style={[styles.offlineWarningText, { color: colors.warning }]}>
                  ⚠️ ESP32 sedang offline. Perintah tidak dapat dikirim.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuCard, { borderColor: colors.primary }]}
            onPress={handleTambahSantri}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.menuIconText}>👤</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.gray900 }]}>Tambah Data Santri</Text>
              <Text style={[styles.menuDesc, { color: colors.gray600 }]}>
                Daftarkan santri baru dan buat akun wali santri
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={[styles.arrowText, { color: colors.gray400 }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuCard, 
              { 
                borderColor: colors.primaryLight,
                backgroundColor: colors.white 
              }
            ]}
            onPress={handleDaftarSantri}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.menuIconText}>📋</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.gray900 }]}>Daftar Santri</Text>
              <Text style={[styles.menuDesc, { color: colors.gray600 }]}>
                Lihat dan kelola data santri yang terdaftar
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={[styles.arrowText, { color: colors.gray400 }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuCard, 
              { 
                borderColor: colors.secondary,
                backgroundColor: colors.white 
              }
            ]}
            onPress={handleTimelineManager}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.menuIconText}>📅</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.gray900 }]}>Timeline Manager</Text>
              <Text style={[styles.menuDesc, { color: colors.gray600 }]}>
                Kelola timeline dan pembayaran bisyaroh
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={[styles.arrowText, { color: colors.gray400 }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuCard, 
              { 
                borderColor: colors.primaryDark,
                backgroundColor: colors.white 
              }
            ]}
            onPress={handleCekPembayaran}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              <Text style={styles.menuIconText}>💰</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: colors.gray900 }]}>Cek Status Pembayaran</Text>
              <Text style={[styles.menuDesc, { color: colors.gray600 }]}>
                Lihat status pembayaran bisyaroh semua santri
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={[styles.arrowText, { color: colors.gray400 }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuCard,
              styles.seederCard,
              seederLoading && styles.seederCardLoading,
            ]}
            onPress={handleSeeder}
            activeOpacity={0.8}
            disabled={seederLoading}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              {seederLoading ? (
                <ActivityIndicator size={24} color={colors.error} />
              ) : (
                <Text style={styles.menuIconText}>🎲</Text>
              )}
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>
                {seederLoading ? "Generating Data..." : "Generate Data Santri"}
              </Text>
              <Text style={styles.menuDesc}>
                {seederLoading
                  ? "Sedang membuat akun santri dengan data sequential..."
                  : "Buat akun santri dengan email sequential untuk testing"}
              </Text>
              <View style={styles.seederStats}>
                <Text style={[styles.seederStatsText, { color: colors.error }]}>
                  Total Santri: {seederStats.total} | Generated:{" "}
                  {seederStats.seederUsers}
                </Text>
                <Text style={[styles.seederNextText, { color: colors.success }]}>
                  Next: user{seederStats.nextUserNumber}@gmail.com
                </Text>
              </View>
            </View>
            <View style={styles.menuArrow}>
              <Text
                style={[styles.arrowText, seederLoading && { opacity: 0.5 }]}
              >
                {seederLoading ? "⏳" : "→"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={loggingOut ? "Sedang Keluar..." : "Keluar"}
            onPress={handleLogout}
            variant="outline"
            disabled={loggingOut}
            style={[styles.logoutButton, { borderColor: colors.error }]}
          />
        </View>
      </ScrollView>

      <Modal
        visible={seederModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !seederLoading && setSeederModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Data Santri</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSeederModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Jumlah Akun (1-10):</Text>
              <TextInput
                style={styles.numberInput}
                value={seederCount}
                onChangeText={setSeederCount}
                keyboardType="numeric"
                placeholder="Masukkan jumlah"
                maxLength={2}
              />

              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Preview Email:</Text>
                {(() => {
                  const count = parseInt(seederCount) || 0;
                  if (count >= 1 && count <= 10) {
                    const emails = [];
                    for (let i = 0; i < count; i++) {
                      emails.push(
                        `user${seederStats.nextUserNumber + i}@gmail.com`
                      );
                    }
                    return emails.map((email, index) => (
                      <Text key={index} style={styles.previewEmail}>
                        {email}
                      </Text>
                    ));
                  }
                  return (
                    <Text style={styles.previewError}>Jumlah harus 1-10</Text>
                  );
                })()}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Batal"
                onPress={() => setSeederModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Generate"
                onPress={handleSeederConfirm}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {seederLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Generating Data Santri</Text>
            <Text style={styles.loadingSubtitle}>
              Membuat {seederCount} akun dengan email sequential...
            </Text>
            <Text style={styles.loadingNote}>
              Next: user{seederStats.nextUserNumber}@gmail.com
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  menuSection: {
    gap: 16,
    marginBottom: 40,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
  },
  seederCard: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  seederCardLoading: {
    opacity: 0.7,
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 8,
  },
  seederStats: {
    marginTop: 4,
  },
  seederStatsText: {
    fontSize: 12,
    fontWeight: "500",
  },
  seederNextText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  menuArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: "#94a3b8",
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    // borderColor will be set dynamically
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  previewSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  previewEmail: {
    fontSize: 12,
    color: "#059669",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  previewError: {
    fontSize: 12,
    color: "#ef4444",
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  loadingNote: {
    fontSize: 12,
    color: "#059669",
    textAlign: "center",
    fontWeight: "600",
  },
  solenoidSection: {
    marginBottom: 24,
  },
  solenoidCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  solenoidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  solenoidTitleSection: {
    flex: 1,
  },
  solenoidTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  solenoidStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  lastUpdateText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  batteryIndicator: {
    width: 60,
    height: 24,
    borderWidth: 1,
    borderRadius: 4,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  batteryFill: {
    position: "absolute",
    left: 1,
    top: 1,
    bottom: 1,
    borderRadius: 2,
  },
  batteryText: {
    fontSize: 10,
    fontWeight: "600",
    zIndex: 1,
  },
  solenoidControls: {
    flexDirection: "row",
    gap: 12,
  },
  solenoidButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  unlockButton: {
    // backgroundColor set dynamically
  },
  lockButton: {
    // backgroundColor set dynamically
  },
  solenoidButtonIcon: {
    fontSize: 20,
  },
  solenoidButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  offlineWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  offlineWarningText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AdminHome;
