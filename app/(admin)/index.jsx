import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useTranslation } from "../../hooks/useTranslation";
import Button from "../../components/ui/Button";
import { signOutUser } from "../../services/authService";
import { getColors } from "../../constants/Colors";

function AdminHome() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useSettings();
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigationRef = useRef(false);
  const colors = getColors(theme);

  const handleLogout = async () => {
    if (loggingOut || navigationRef.current) return;

    setLoggingOut(true);
    const result = await signOutUser();

    if (result.success) {
      navigationRef.current = true;
      router.replace("/(auth)/login");
    } else {
      Alert.alert("Logout Failed", "Failed to logout. Please try again.");
    }

    setLoggingOut(false);
  };

  const adminFeatures = [
    {
      title: t("home.userManagement"),
      description: t("home.userManagementDesc"),
      icon: "👥",
      onPress: () => Alert.alert("Feature", "User Management - Coming Soon!"),
    },
    {
      title: t("home.systemAnalytics"),
      description: t("home.systemAnalyticsDesc"),
      icon: "📊",
      onPress: () => Alert.alert("Feature", "System Analytics - Coming Soon!"),
    },
    {
      title: t("home.systemConfiguration"),
      description: t("home.systemConfigurationDesc"),
      icon: "⚙️",
      onPress: () => Alert.alert("Feature", "System Config - Coming Soon!"),
    },
  ];

  const getWelcomeMessage = () => {
    if (userProfile?.name) {
      return `${t("home.welcomeAdmin")} ${userProfile.name}!`;
    }
    return t("home.welcomeAdmin");
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{getWelcomeMessage()}</Text>

          {userProfile ? (
            <View style={styles.profileContainer}>
              <View style={styles.profileCard}>
                <Text style={styles.cardTitle}>{t("home.adminProfile")}</Text>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>{t("common.name")}:</Text>
                  <Text style={styles.value}>{userProfile.name}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>{t("home.role")}:</Text>
                  <Text style={styles.value}>{t("home.administrator")}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>{t("home.accessLevel")}:</Text>
                  <Text style={styles.value}>{t("home.fullAccess")}</Text>
                </View>
              </View>

              <View style={styles.accountCard}>
                <Text style={styles.cardTitle}>
                  {t("home.accountInformation")}
                </Text>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>{t("common.email")}:</Text>
                  <Text style={styles.value}>{currentUser?.email}</Text>
                </View>

                <View style={styles.profileRow}>
                  <Text style={styles.label}>Admin ID:</Text>
                  <Text style={styles.value}>{userProfile.id}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t("common.loading")}</Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>{t("home.systemOverview")}</Text>

            {adminFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={feature.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.featureIcon}>
                  <Text style={styles.iconText}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                <View style={styles.featureArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionsContainer}>
            <Button
              title={loggingOut ? "Logging out..." : t("common.logout")}
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
      paddingTop: 60,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.gray900,
      marginBottom: 24,
      textAlign: "center",
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
    accountCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 20,
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
    loadingContainer: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 32,
      alignItems: "center",
      marginBottom: 32,
    },
    loadingText: {
      fontSize: 16,
      color: colors.gray500,
    },
    featuresContainer: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
    },
    featureCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    iconText: {
      fontSize: 20,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: colors.gray600,
      lineHeight: 20,
    },
    featureArrow: {
      marginLeft: 12,
    },
    arrowText: {
      fontSize: 18,
      color: colors.gray400,
    },
    actionsContainer: {
      gap: 12,
    },
    logoutButton: {
      marginBottom: 8,
    },
  });

export default AdminHome;
