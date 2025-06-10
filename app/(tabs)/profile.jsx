import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import Button from "../../components/ui/Button";
import { signOutUser } from "../../services/authService";
import { getColors } from "../../constants/Colors";

function Profile() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useSettings();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const colors = getColors(theme);

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

  const handleEditProfile = () => {
    router.push("/(tabs)/edit-profile");
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.nameText}>
              {userProfile?.namaWali || "Nama Wali"}
            </Text>
            <Text style={styles.roleText}>Wali Santri</Text>
          </View>

          {userProfile && (
            <View style={styles.profileContainer}>
              <View style={styles.profileCard}>
                <Text style={styles.cardTitle}>Informasi Wali Santri</Text>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Nama Wali:</Text>
                  <Text style={styles.value}>{userProfile.namaWali}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>No HP:</Text>
                  <Text style={styles.value}>{userProfile.noHpWali}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{userProfile.email}</Text>
                </View>
              </View>

              <View style={styles.profileCard}>
                <Text style={styles.cardTitle}>Informasi Santri</Text>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Nama Santri:</Text>
                  <Text style={styles.value}>{userProfile.namaSantri}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Status RFID:</Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color: userProfile.rfidSantri
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  >
                    {userProfile.rfidSantri ? "Terpasang" : "Belum Terpasang"}
                  </Text>
                </View>

                {userProfile.rfidSantri && (
                  <View style={styles.profileRow}>
                    <Text style={styles.label}>Kode RFID:</Text>
                    <Text style={[styles.value, styles.rfidCode]}>
                      {userProfile.rfidSantri}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.profileCard}>
                <Text style={styles.cardTitle}>Informasi Akun</Text>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>User ID:</Text>
                  <Text style={[styles.value, styles.userId]}>
                    {userProfile.id}
                  </Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Role:</Text>
                  <Text style={styles.value}>{userProfile.role}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <Button
              title="Edit Profil"
              onPress={handleEditProfile}
              style={styles.editButton}
            />

            <Button
              title={loggingOut ? "Sedang Keluar..." : "Keluar"}
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
              disabled={loggingOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingTop: 40,
    },
    profileSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      color: colors.white,
    },
    nameText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.gray900,
      marginBottom: 4,
      textAlign: "center",
    },
    roleText: {
      fontSize: 14,
      color: colors.gray600,
    },
    profileContainer: {
      marginBottom: 32,
    },
    profileCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
      textAlign: "center",
    },
    profileRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.gray600,
      flex: 1,
    },
    value: {
      fontSize: 14,
      color: colors.gray900,
      flex: 2,
      textAlign: "right",
    },
    rfidCode: {
      fontFamily: "monospace",
      fontSize: 12,
    },
    userId: {
      fontFamily: "monospace",
      fontSize: 12,
    },
    actionsContainer: {
      gap: 12,
    },
    editButton: {
      marginBottom: 8,
    },
    logoutButton: {
      marginBottom: 8,
      borderColor: colors.error,
    },
  });

export default Profile;
