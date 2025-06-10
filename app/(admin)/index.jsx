import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { signOutUser } from "../../services/authService";

function AdminHome() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
            Alert.alert("Gagal Logout", "Gagal keluar. Silakan coba lagi.");
          }
          setLoggingOut(false);
        },
      },
    ]);
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
    Alert.alert("Info", "Fitur ini akan segera tersedia");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Dashboard Admin</Text>
          <Text style={styles.subtitle}>TPQ Ibadurrohman</Text>
          {userProfile && (
            <Text style={styles.welcomeText}>
              Selamat datang, {userProfile.nama}
            </Text>
          )}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuCard, styles.primaryCard]}
            onPress={handleTambahSantri}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>👤</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Tambah Data Santri</Text>
              <Text style={styles.menuDesc}>
                Daftarkan santri baru dan buat akun wali santri
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, styles.secondaryCard]}
            onPress={handleDaftarSantri}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>📋</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Daftar Santri</Text>
              <Text style={styles.menuDesc}>
                Lihat dan kelola data santri yang terdaftar
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, styles.tertiaryCard]}
            onPress={handleTimelineManager}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>📅</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Timeline Manager</Text>
              <Text style={styles.menuDesc}>
                Kelola timeline dan pembayaran bisyaroh
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, styles.quaternaryCard]}
            onPress={handleCekPembayaran}
            activeOpacity={0.8}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>💰</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Cek Status Pembayaran</Text>
              <Text style={styles.menuDesc}>
                Lihat status pembayaran bisyaroh semua santri
              </Text>
            </View>
            <View style={styles.menuArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title={loggingOut ? "Sedang Keluar..." : "Keluar"}
            onPress={handleLogout}
            variant="outline"
            disabled={loggingOut}
            style={styles.logoutButton}
          />
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
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
    color: "#3b82f6",
    fontWeight: "500",
  },
  menuSection: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
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
  primaryCard: {
    borderColor: "#3b82f6",
  },
  secondaryCard: {
    borderColor: "#10b981",
  },
  tertiaryCard: {
    borderColor: "#f59e0b",
  },
  quaternaryCard: {
    borderColor: "#8b5cf6",
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f1f5f9",
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
  },
  logoutButton: {
    borderColor: "#ef4444",
  },
});

export default AdminHome;
