import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  getUserProfile,
  deleteSantri,
  updateSantriRFID,
  deleteSantriRFID,
} from "../../services/userService";
import {
  startRFIDPairingWithTimeout,
  subscribeToRFIDDetection,
  completePairingSession,
  getMode,
  clearModeTimeout,
  resetToIdle
} from "../../services/rtdbModeService";

export default function DetailSantri() {
  const { santriId } = useLocalSearchParams();
  const [santri, setSantri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [pairingActive, setPairingActive] = useState(false);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('idle');
  const [pairingTimeoutId, setPairingTimeoutId] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadSantriData = async () => {
    setLoading(true);
    const result = await getUserProfile(santriId);
    if (result.success) {
      setSantri(result.profile);
    } else {
      Alert.alert("Error", "Gagal memuat data santri");
      router.back();
    }
    setLoading(false);
  };

  const checkCurrentMode = async () => {
    try {
      const mode = await getMode();
      setCurrentMode(mode);
      setPairingActive(mode === 'pairing');
    } catch (error) {
      console.error('Error checking mode:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSantriData();
      checkCurrentMode();
    }, [santriId])
  );

  useEffect(() => {
    // Revolutionary mode-based RFID detection (ultra-simple!)
    const unsubscribe = subscribeToRFIDDetection((rfidCode) => {
      if (pairingActive) {
        handleRFIDReceived(rfidCode);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [pairingActive]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (pairingTimeoutId) {
        clearModeTimeout(pairingTimeoutId);
      }
    };
  }, [pairingTimeoutId]);

  const handleRFIDReceived = async (rfidCode) => {
    Alert.alert(
      "RFID Terdeteksi! 🎉",
      `RFID Code: ${rfidCode}\n\nApakah Anda ingin menyimpan RFID ini untuk ${santri?.namaSantri}?`,
      [
        {
          text: "Batal",
          style: "cancel",
          onPress: async () => {
            await handleCancelPairing();
          },
        },
        {
          text: "Simpan",
          onPress: async () => {
            try {
              // Save to Firestore (permanent storage)
              const result = await updateSantriRFID(santriId, rfidCode);
              
              // Complete mode-based session and cleanup RTDB
              await completePairingSession();
              
              // Clear timeout
              if (pairingTimeoutId) {
                clearModeTimeout(pairingTimeoutId);
                setPairingTimeoutId(null);
              }
              
              setPairingActive(false);
              setCurrentMode('idle');
              
              if (result.success) {
                Alert.alert("Berhasil! ✅", "RFID berhasil dipasangkan dengan sistem mode-based!");
                loadSantriData();
              } else {
                Alert.alert("Error", "Gagal menyimpan RFID");
              }
            } catch (error) {
              Alert.alert("Error", `Terjadi kesalahan: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleStartPairing = async () => {
    setPairingLoading(true);
    
    try {
      // Revolutionary mode-based pairing with automatic timeout!
      const result = await startRFIDPairingWithTimeout(30);
      
      if (result.success) {
        setPairingTimeoutId(result.timeoutId);
        setPairingActive(true);
        setCurrentMode('pairing');
        
        Alert.alert(
          "Mode Pairing Aktif! 🚀",
          "ESP32 telah diatur ke mode pairing via RTDB.\n\n🔥 Sistem mode-based siap!\n• Silakan tap kartu RFID pada ESP32\n• Timeout otomatis dalam 30 detik\n• Real-time detection aktif",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Gagal memulai mode pairing");
      }
    } catch (error) {
      Alert.alert("Error", `Terjadi kesalahan: ${error.message}`);
    }
    
    setPairingLoading(false);
  };

  const handleCancelPairing = async () => {
    Alert.alert(
      "Batalkan Mode Pairing",
      "Apakah Anda yakin ingin membatalkan mode pairing RFID?",
      [
        { text: "Tidak", style: "cancel" },
        {
          text: "Ya, Batalkan",
          style: "destructive",
          onPress: async () => {
            try {
              // Reset to idle mode (self-cleaning)
              await resetToIdle();
              
              // Clear timeout
              if (pairingTimeoutId) {
                clearModeTimeout(pairingTimeoutId);
                setPairingTimeoutId(null);
              }
              
              setPairingActive(false);
              setCurrentMode('idle');
              
              Alert.alert(
                "Mode Pairing Dibatalkan ✅",
                "Sistem telah kembali ke mode idle"
              );
            } catch (error) {
              Alert.alert("Error", `Gagal membatalkan pairing: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleEditSantri = () => {
    router.push({
      pathname: "/(admin)/edit-santri",
      params: { santriId: santriId },
    });
  };

  const handleDeleteSantri = () => {
    Alert.alert(
      "Hapus Santri",
      `Apakah Anda yakin ingin menghapus data ${santri?.namaSantri}?\n\nTindakan ini akan:\n• Menghapus data santri dari sistem\n• Menonaktifkan akun wali (akun login tetap ada)\n• Email ${santri?.email} tidak dapat digunakan lagi\n• Tidak dapat dibatalkan\n\nLanjutkan?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Hapus",
          style: "destructive",
          onPress: confirmDeleteSantri,
        },
      ]
    );
  };

  const confirmDeleteSantri = async () => {
    setDeleting(true);

    try {
      const result = await deleteSantri(santriId);

      if (result.success) {
        Alert.alert(
          "Berhasil Dihapus! ✅",
          `Data santri ${santri?.namaSantri} berhasil dihapus dari sistem.\n\n⚠️ Catatan: Email ${santri?.email} tidak dapat digunakan untuk akun baru karena masih terdaftar di sistem autentikasi.`,
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(admin)/daftar-santri");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", `Gagal menghapus data santri: ${result.error}`);
      }
    } catch (error) {
      Alert.alert("Error", `Terjadi kesalahan tidak terduga: ${error.message}`);
    }

    setDeleting(false);
  };

  const handleDeleteRFID = () => {
    Alert.alert(
      "Hapus RFID",
      `Apakah Anda yakin ingin menghapus RFID untuk ${santri?.namaSantri}?\n\nRFID: ${santri?.rfidSantri}\n\nSetelah dihapus, santri tidak akan bisa menggunakan kartu RFID untuk pembayaran.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Hapus",
          style: "destructive",
          onPress: confirmDeleteRFID,
        },
      ]
    );
  };

  const confirmDeleteRFID = async () => {
    try {
      const result = await deleteSantriRFID(santriId);
      if (result.success) {
        Alert.alert("Berhasil", "RFID berhasil dihapus!");
        loadSantriData();
      } else {
        Alert.alert("Error", `Gagal menghapus RFID: ${result.error}`);
      }
    } catch (error) {
      Alert.alert("Error", `Terjadi kesalahan: ${error.message}`);
    }
  };

  const handleRePairing = () => {
    Alert.alert(
      "Ganti RFID",
      `Apakah Anda ingin mengganti RFID untuk ${santri?.namaSantri}?\n\nRFID saat ini: ${santri?.rfidSantri}\n\nRFID lama akan diganti dengan yang baru.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Ganti",
          onPress: startRePairing,
        },
      ]
    );
  };

  const startRePairing = async () => {
    try {
      // Revolutionary mode-based re-pairing
      const result = await startRFIDPairingWithTimeout(30);
      
      if (result.success) {
        setPairingTimeoutId(result.timeoutId);
        setPairingActive(true);
        setCurrentMode('pairing');
        
        Alert.alert(
          "Mode Re-pairing Aktif! 🔄",
          "ESP32 siap menerima kartu RFID baru via mode-based system.\n\n• Tempelkan kartu RFID baru pada ESP32\n• RFID lama akan diganti otomatis\n• Timeout dalam 30 detik"
        );
      } else {
        Alert.alert("Error", "Gagal memulai mode re-pairing");
      }
    } catch (error) {
      Alert.alert("Error", `Terjadi kesalahan: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Santri</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Memuat data santri..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!santri) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Santri</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Data santri tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canStartPairing = !santri.rfidSantri && !pairingActive;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Santri</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.namaSantri}>{santri.namaSantri}</Text>
          <Text style={styles.santriId}>ID: {santri.id}</Text>
        </View>

        <View style={styles.actionSection}>
          <View style={styles.actionButtons}>
            <Button
              title="✏️ Edit Data"
              onPress={handleEditSantri}
              variant="secondary"
              style={styles.editButton}
              disabled={deleting}
            />
            <Button
              title={deleting ? "Menghapus..." : "🗑️ Hapus Santri"}
              onPress={handleDeleteSantri}
              variant="outline"
              style={styles.deleteButton}
              disabled={deleting}
            />
          </View>
        </View>

        {deleting && (
          <View style={styles.deletingInfo}>
            <Text style={styles.deletingText}>
              🔄 Menghapus data santri dari sistem...
            </Text>
            <Text style={styles.deletingSubtext}>Mohon tunggu sebentar</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Santri</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Santri:</Text>
              <Text style={styles.infoValue}>{santri.namaSantri}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Wali:</Text>
              <Text style={styles.infoValue}>{santri.namaWali}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No HP Wali:</Text>
              <Text style={styles.infoValue}>{santri.noHpWali}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Wali:</Text>
              <Text style={styles.infoValue}>{santri.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rfidSection}>
          <Text style={styles.sectionTitle}>Status RFID</Text>

          <View style={styles.rfidCard}>
            <View style={styles.rfidStatus}>
              {santri.rfidSantri ? (
                <View style={styles.rfidActive}>
                  <Text style={styles.rfidIcon}>✅</Text>
                  <View style={styles.rfidInfo}>
                    <Text style={styles.rfidLabel}>RFID Terpasang</Text>
                    <Text style={styles.rfidCode}>{santri.rfidSantri}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.rfidInactive}>
                  <Text style={styles.rfidIcon}>⚠️</Text>
                  <View style={styles.rfidInfo}>
                    <Text style={styles.rfidLabel}>RFID Belum Terpasang</Text>
                    <Text style={styles.rfidDesc}>
                      Silakan lakukan pairing RFID
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {pairingActive && (
              <View style={styles.pairingActive}>
                <Text style={styles.pairingText}>🔥 Mode Pairing Aktif (RTDB)</Text>
                <Text style={styles.pairingDesc}>
                  ESP32 dalam mode: {currentMode} | Tap kartu RFID sekarang
                </Text>
              </View>
            )}

            <View style={styles.rfidActions}>
              {canStartPairing && (
                <Button
                  title={
                    pairingLoading ? "Memulai Mode Pairing..." : "🚀 Mulai Mode Pairing (RTDB)"
                  }
                  onPress={handleStartPairing}
                  disabled={pairingLoading || deleting}
                  style={styles.pairingButton}
                />
              )}

              {pairingActive && (
                <Button
                  title="❌ Batalkan Mode Pairing"
                  onPress={handleCancelPairing}
                  variant="outline"
                  style={styles.cancelButton}
                  disabled={deleting}
                />
              )}

              {santri.rfidSantri && !pairingActive && (
                <View style={styles.rfidManagement}>
                  <Button
                    title="🔄 Ganti RFID"
                    onPress={handleRePairing}
                    variant="secondary"
                    style={styles.rePairingButton}
                    disabled={deleting}
                  />
                  <Button
                    title="🗑️ Hapus RFID"
                    onPress={handleDeleteRFID}
                    variant="outline"
                    style={styles.deleteRFIDButton}
                    disabled={deleting}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: "#fff",
  },
  namaSantri: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
    textAlign: "center",
  },
  santriId: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "monospace",
  },
  actionSection: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#10b981",
  },
  deleteButton: {
    flex: 1,
    borderColor: "#ef4444",
  },
  deletingInfo: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  deletingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
    textAlign: "center",
  },
  deletingSubtext: {
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    flex: 2,
    textAlign: "right",
  },
  rfidSection: {
    marginBottom: 32,
  },
  rfidCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rfidStatus: {
    marginBottom: 16,
  },
  rfidActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 8,
  },
  rfidInactive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
  },
  rfidIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rfidInfo: {
    flex: 1,
  },
  rfidLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  rfidCode: {
    fontSize: 14,
    color: "#059669",
    fontFamily: "monospace",
  },
  rfidDesc: {
    fontSize: 14,
    color: "#92400e",
  },
  pairingActive: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  pairingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  pairingDesc: {
    fontSize: 14,
    color: "#1e40af",
    textAlign: "center",
  },
  rfidActions: {
    gap: 12,
  },
  pairingButton: {
    backgroundColor: "#10b981",
  },
  cancelButton: {
    borderColor: "#ef4444",
  },
  infoBox: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: "#0369a1",
    lineHeight: 20,
    textAlign: "center",
  },
  rfidManagement: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  rePairingButton: {
    flex: 1,
  },
  deleteRFIDButton: {
    flex: 1,
  },
});
