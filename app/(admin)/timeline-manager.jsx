import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  getActiveTimeline,
  getTimelineTemplates,
  resetTimelinePayments,
} from "../../services/timelineService";

export default function TimelineManager() {
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    setLoading(true);

    const [timelineResult, templatesResult] = await Promise.all([
      getActiveTimeline(),
      getTimelineTemplates(),
    ]);

    if (timelineResult.success) {
      setActiveTimeline(timelineResult.timeline);
    }

    if (templatesResult.success) {
      setTemplates(templatesResult.templates);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTimeline = () => {
    router.push("/(admin)/create-timeline");
  };

  const handleManagePayments = () => {
    if (activeTimeline) {
      router.push({
        pathname: "/(admin)/payment-manager",
        params: { timelineId: activeTimeline.id },
      });
    }
  };

  const handleResetPayments = () => {
    if (!activeTimeline) return;

    Alert.alert(
      "Reset Pembayaran",
      `Apakah Anda yakin ingin mereset semua data pembayaran untuk timeline "${activeTimeline.name}"?\n\nTindakan ini akan menghapus semua data pembayaran yang sudah ada.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Reset",
          style: "destructive",
          onPress: async () => {
            setResetting(true);
            const result = await resetTimelinePayments(activeTimeline.id);

            if (result.success) {
              Alert.alert("Berhasil", "Data pembayaran berhasil direset!");
            } else {
              Alert.alert("Error", result.error);
            }
            setResetting(false);
          },
        },
      ]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "yearly":
        return "Tahunan";
      case "monthly":
        return "Bulanan";
      case "weekly":
        return "Mingguan";
      default:
        return "Custom";
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
          <Text style={styles.headerTitle}>Timeline Manager</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Memuat data timeline..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timeline Manager</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.activeTimelineSection}>
          <Text style={styles.sectionTitle}>Timeline Aktif</Text>

          {activeTimeline ? (
            <View style={styles.timelineCard}>
              <Text style={styles.timelineName}>{activeTimeline.name}</Text>
              <Text style={styles.timelineType}>
                {getTypeLabel(activeTimeline.type)} - {activeTimeline.duration}{" "}
                periode
              </Text>
              <Text style={styles.timelineAmount}>
                Total: {formatCurrency(activeTimeline.totalAmount)}
              </Text>
              <Text style={styles.timelineAmountPerPeriod}>
                Per periode: {formatCurrency(activeTimeline.amountPerPeriod)}
              </Text>

              <View style={styles.timelineActions}>
                <Button
                  title="Kelola Pembayaran"
                  onPress={handleManagePayments}
                  style={styles.manageButton}
                />
                <Button
                  title={resetting ? "Mereset..." : "Reset Pembayaran"}
                  onPress={handleResetPayments}
                  variant="outline"
                  style={styles.resetButton}
                  disabled={resetting}
                />
              </View>
            </View>
          ) : (
            <View style={styles.noTimelineCard}>
              <Text style={styles.noTimelineText}>
                Belum ada timeline aktif
              </Text>
              <Text style={styles.noTimelineDesc}>
                Buat timeline baru untuk mulai mengelola pembayaran
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Button
            title="Buat Timeline Baru"
            onPress={handleCreateTimeline}
            style={styles.createButton}
          />
        </View>

        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>Template Tersimpan</Text>

          {templates.length > 0 ? (
            templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateType}>
                  {getTypeLabel(template.type)} - {template.duration} periode
                </Text>
                <Text style={styles.templateAmount}>
                  Base: {formatCurrency(template.baseAmount)}
                </Text>
                {template.holidays && template.holidays.length > 0 && (
                  <Text style={styles.templateHolidays}>
                    Libur: {template.holidays.length} periode
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noTemplatesCard}>
              <Text style={styles.noTemplatesText}>Belum ada template</Text>
              <Text style={styles.noTemplatesDesc}>
                Template akan tersimpan saat Anda membuat timeline
              </Text>
            </View>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  activeTimelineSection: {
    marginBottom: 32,
  },
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  timelineType: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  timelineAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
  },
  timelineAmountPerPeriod: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  timelineActions: {
    flexDirection: "row",
    gap: 12,
  },
  manageButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
  },
  resetButton: {
    flex: 1,
    borderColor: "#ef4444",
  },
  noTimelineCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  noTimelineText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  noTimelineDesc: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: "#10b981",
  },
  templatesSection: {
    marginBottom: 32,
  },
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  templateType: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  templateAmount: {
    fontSize: 14,
    color: "#059669",
    marginBottom: 4,
  },
  templateHolidays: {
    fontSize: 12,
    color: "#f59e0b",
  },
  noTemplatesCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  noTemplatesText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  noTemplatesDesc: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
