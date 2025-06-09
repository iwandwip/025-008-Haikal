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
} from "../../services/userService";
import {
  startPairing,
  cancelPairing,
  getPairingStatus,
  listenToPairingData,
} from "../../services/pairingService";

export default function DetailSantri() {
  const { santriId } = useLocalSearchParams();
  const [santri, setSantri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pairingStatus, setPairingStatus] = useState(null);
  const [pairingLoading, setPairingLoading] = useState(false);
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

  const loadPairingStatus = async () => {
    const status = await getPairingStatus();
    setPairingStatus(status);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSantriData();
      loadPairingStatus();
    }, [santriId])
  );

  useEffect(() => {
    const unsubscribe = listenToPairingData((rfidData) => {
      if (
        rfidData &&
        pairingStatus?.isActive &&
        pairingStatus?.santriId === santriId
      ) {
        handleRFIDReceived(rfidData);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [santriId, pairingStatus]);

  useEffect(() => {
    const interval = setInterval(loadPairingStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRFIDReceived = async (rfidCode) => {
    Alert.alert(
      "RFID Terdeteksi",
      `RFID Code: ${rfidCode}\n\nApakah Anda ingin menyimpan RFID ini untuk ${santri?.namaSantri}?`,
      [
        {
          text: "Batal",
          style: "cancel",
          onPress: () => cancelPairing(),
        },
        {
          text: "Simpan",
          onPress: async () => {
            const result = await updateSantriRFID(santriId, rfidCode);
            await cancelPairing();
            if (result.success) {
              Alert.alert("Berhasil", "RFID berhasil dipasangkan!");
              loadSantriData();
            } else {
              Alert.alert("Error", "Gagal menyimpan RFID");
            }
          },
        },
      ]
    );
  };

  const handleStartPairing = async () => {
    setPairingLoading(true);
    const result = await startPairing(santriId);
    if (result.success) {
      Alert.alert(
        "Pairing Dimulai",
        "Silakan tap kartu RFID pada device ESP32. Pairing akan otomatis berhenti dalam 30 detik.",
        [{ text: "OK" }]
      );
      loadPairingStatus();
    } else {
      Alert.alert("Error", result.error);
    }
    setPairingLoading(false);
  };

  const handleCancelPairing = async () => {
    Alert.alert(
      "Batalkan Pairing",
      "Apakah Anda yakin ingin membatalkan pairing RFID?",
      [
        { text: "Tidak", style: "cancel" },
        {
          text: "Ya, Batalkan",
          style: "destructive",
          onPress: async () => {
            const result = await cancelPairing();
            if (result.success) {
              Alert.alert(
                "Pairing Dibatalkan",
                "Pairing RFID telah dibatalkan"
              );
              loadPairingStatus();
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
      `Apakah Anda yakin ingin menghapus data ${santri?.namaSantri}?\n\nTindakan ini tidak dapat dibatalkan dan akan menghapus:\n• Data santri\n• Akun wali santri\n• Semua data terkait`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Hapus",
          style: "destructive",
          onPress: async () => {
            const result = await deleteSantri(santriId);
            if (result.success) {
              Alert.alert("Berhasil", "Data santri berhasil dihapus", [
                {
                  text: "OK",
                  onPress: () => {
                    router.back();
                  },
                },
              ]);
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
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

  const isPairingActive =
    pairingStatus?.isActive && pairingStatus?.santriId === santriId;
  const canStartPairing = !santri.rfidSantri && !pairingStatus?.isActive;

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            />
            <Button
              title="🗑️ Hapus Santri"
              onPress={handleDeleteSantri}
              variant="outline"
              style={styles.deleteButton}
            />
          </View>
        </View>

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

            {isPairingActive && (
              <View style={styles.pairingActive}>
                <Text style={styles.pairingText}>🔄 Menunggu RFID...</Text>
                <Text style={styles.pairingDesc}>
                  Tap kartu RFID pada device ESP32
                </Text>
              </View>
            )}

            <View style={styles.rfidActions}>
              {canStartPairing && (
                <Button
                  title={
                    pairingLoading ? "Memulai Pairing..." : "Mulai Pairing RFID"
                  }
                  onPress={handleStartPairing}
                  disabled={pairingLoading}
                  style={styles.pairingButton}
                />
              )}

              {isPairingActive && (
                <Button
                  title="Batalkan Pairing"
                  onPress={handleCancelPairing}
                  variant="outline"
                  style={styles.cancelButton}
                />
              )}

              {santri.rfidSantri && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    ℹ️ RFID sudah terpasang. Hubungi admin jika perlu mengganti
                    RFID.
                  </Text>
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
});
