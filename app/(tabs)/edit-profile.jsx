import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { updateUserProfile } from "../../services/userService";
import { getColors } from "../../constants/Colors";

export default function EditProfile() {
  const { userProfile, refreshProfile } = useAuth();
  const { theme } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaWali: userProfile?.namaWali || "",
    noHpWali: userProfile?.noHpWali || "",
    namaSantri: userProfile?.namaSantri || "",
  });
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.namaWali.trim()) {
      newErrors.namaWali = "Nama wali wajib diisi";
    }

    if (!formData.noHpWali.trim()) {
      newErrors.noHpWali = "No HP wali wajib diisi";
    }

    if (!formData.namaSantri.trim()) {
      newErrors.namaSantri = "Nama santri wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await updateUserProfile(userProfile.id, formData);

      if (result.success) {
        await refreshProfile();
        Alert.alert(
          "Profil Berhasil Diperbarui",
          "Perubahan profil telah disimpan!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert("Gagal Memperbarui", result.error);
      }
    } catch (error) {
      Alert.alert("Gagal Memperbarui", "Terjadi kesalahan. Silakan coba lagi.");
    }

    setLoading(false);
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profil</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informasi Wali Santri</Text>

              <Input
                label="Nama Wali"
                placeholder="Masukkan nama lengkap wali"
                value={formData.namaWali}
                onChangeText={(value) => updateFormData("namaWali", value)}
                autoCapitalize="words"
                error={errors.namaWali}
              />

              <Input
                label="No HP Wali"
                placeholder="Masukkan nomor HP wali"
                value={formData.noHpWali}
                onChangeText={(value) => updateFormData("noHpWali", value)}
                keyboardType="phone-pad"
                error={errors.noHpWali}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informasi Santri</Text>

              <Input
                label="Nama Santri"
                placeholder="Masukkan nama lengkap santri"
                value={formData.namaSantri}
                onChangeText={(value) => updateFormData("namaSantri", value)}
                autoCapitalize="words"
                error={errors.namaSantri}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ℹ️ RFID santri hanya dapat diatur oleh admin TPQ
                </Text>
              </View>
            </View>

            <View style={styles.buttonSection}>
              <Button
                title="Batal"
                onPress={() => router.back()}
                variant="outline"
                style={styles.cancelButton}
                disabled={loading}
              />

              <Button
                title={loading ? "Menyimpan..." : "Simpan Perubahan"}
                onPress={handleSave}
                disabled={loading}
                style={styles.saveButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
      backgroundColor: colors.white,
    },
    backButton: {
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.gray900,
      textAlign: "center",
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    infoBox: {
      backgroundColor: colors.primary + "20",
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.primary,
      lineHeight: 20,
    },
    buttonSection: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      marginBottom: 32,
    },
    cancelButton: {
      flex: 1,
      borderColor: colors.gray400,
    },
    saveButton: {
      flex: 1,
      backgroundColor: colors.success,
    },
  });
