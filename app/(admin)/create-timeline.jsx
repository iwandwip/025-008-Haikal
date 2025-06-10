import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import DatePicker from "../../components/ui/DatePicker";
import {
  createTimelineTemplate,
  createActiveTimeline,
  generatePaymentsForTimeline,
  getTimelineTemplates,
} from "../../services/timelineService";

export default function CreateTimeline() {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "yearly",
    duration: 12,
    baseAmount: 480000,
    totalAmount: 480000,
    startDate: new Date().toISOString().split("T")[0],
    holidays: [],
    saveAsTemplate: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const result = await getTimelineTemplates();
    if (result.success) {
      setTemplates(result.templates);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "type" || field === "duration" || field === "baseAmount") {
        newData.totalAmount = calculateTotalAmount(newData);
      }

      return newData;
    });
  };

  const calculateTotalAmount = (data) => {
    switch (data.type) {
      case "yearly":
        return data.baseAmount * (data.duration / 12);
      case "monthly":
        return data.baseAmount * (data.duration / 30);
      case "weekly":
        return data.baseAmount * (data.duration / 4);
      default:
        return data.baseAmount;
    }
  };

  const calculateAmountPerPeriod = () => {
    const activePeriods = formData.duration - formData.holidays.length;
    return activePeriods > 0
      ? Math.ceil(formData.totalAmount / activePeriods)
      : 0;
  };

  const getTypeOptions = () => [
    { value: "yearly", label: "Tahunan (Bulan)", duration: 12 },
    { value: "monthly", label: "Bulanan (Hari)", duration: 30 },
    { value: "weekly", label: "Mingguan", duration: 4 },
  ];

  const handleTypeChange = (type) => {
    const option = getTypeOptions().find((opt) => opt.value === type);
    updateFormData("type", type);
    updateFormData("duration", option.duration);
    updateFormData("holidays", []);
  };

  const handleUseTemplate = (template) => {
    setFormData({
      ...formData,
      name: template.name,
      type: template.type,
      duration: template.duration,
      baseAmount: template.baseAmount,
      totalAmount: template.baseAmount,
      holidays: template.holidays || [],
    });
  };

  const toggleHoliday = (periodNumber) => {
    const newHolidays = formData.holidays.includes(periodNumber)
      ? formData.holidays.filter((h) => h !== periodNumber)
      : [...formData.holidays, periodNumber];

    updateFormData("holidays", newHolidays);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        Alert.alert("Error", "Nama timeline wajib diisi");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCreate = async () => {
    setLoading(true);

    try {
      if (formData.saveAsTemplate) {
        const templateResult = await createTimelineTemplate({
          name: formData.name,
          type: formData.type,
          duration: formData.duration,
          baseAmount: formData.baseAmount,
          holidays: formData.holidays,
        });

        if (!templateResult.success) {
          throw new Error(templateResult.error);
        }
      }

      const timelineId = `timeline_${Date.now()}`;
      const timelineData = {
        ...formData,
        id: timelineId,
        amountPerPeriod: calculateAmountPerPeriod(),
      };

      const timelineResult = await createActiveTimeline(timelineData);
      if (!timelineResult.success) {
        throw new Error(timelineResult.error);
      }

      const paymentsResult = await generatePaymentsForTimeline(timelineId);
      if (!paymentsResult.success) {
        throw new Error(paymentsResult.error);
      }

      Alert.alert(
        "Berhasil",
        "Timeline berhasil dibuat dan pembayaran sudah digenerate untuk semua santri!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(admin)/timeline-manager"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }

    setLoading(false);
  };

  const renderPeriodSelector = () => {
    const periods = [];
    for (let i = 1; i <= formData.duration; i++) {
      periods.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.periodButton,
            formData.holidays.includes(i) && styles.periodButtonHoliday,
          ]}
          onPress={() => toggleHoliday(i)}
        >
          <Text
            style={[
              styles.periodButtonText,
              formData.holidays.includes(i) && styles.periodButtonTextHoliday,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return periods;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
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
          <Text style={styles.headerTitle}>Buat Timeline Baru</Text>
        </View>

        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Informasi Dasar</Text>

              {templates.length > 0 && (
                <View style={styles.templatesSection}>
                  <Text style={styles.templatesTitle}>Gunakan Template:</Text>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateCard}
                      onPress={() => handleUseTemplate(template)}
                    >
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDetails}>
                        {template.type} - {template.duration} periode
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Input
                label="Nama Timeline"
                placeholder="Contoh: TPQ Reguler 2024"
                value={formData.name}
                onChangeText={(value) => updateFormData("name", value)}
              />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tipe Timeline</Text>
                {getTypeOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.typeButton,
                      formData.type === option.value && styles.typeButtonActive,
                    ]}
                    onPress={() => handleTypeChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === option.value &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Durasi (Periode)"
                placeholder="12"
                value={formData.duration.toString()}
                onChangeText={(value) =>
                  updateFormData("duration", parseInt(value) || 0)
                }
                keyboardType="numeric"
              />

              <Input
                label="Base Amount"
                placeholder="480000"
                value={formData.baseAmount.toString()}
                onChangeText={(value) =>
                  updateFormData("baseAmount", parseInt(value) || 0)
                }
                keyboardType="numeric"
              />

              <View style={styles.calculationInfo}>
                <Text style={styles.calculationText}>
                  Total Amount: {formatCurrency(formData.totalAmount)}
                </Text>
              </View>

              <DatePicker
                label="Tanggal Mulai"
                value={formData.startDate}
                onChange={(value) => updateFormData("startDate", value)}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Atur Periode Libur</Text>

              <Text style={styles.periodInstructions}>
                Tap pada nomor periode untuk menandai sebagai libur:
              </Text>

              <View style={styles.periodsGrid}>{renderPeriodSelector()}</View>

              <View style={styles.holidaySummary}>
                <Text style={styles.holidayText}>
                  Periode Libur: {formData.holidays.length} dari{" "}
                  {formData.duration}
                </Text>
                <Text style={styles.holidayText}>
                  Periode Aktif: {formData.duration - formData.holidays.length}
                </Text>
                <Text style={styles.amountPerPeriod}>
                  Amount per periode aktif:{" "}
                  {formatCurrency(calculateAmountPerPeriod())}
                </Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Konfirmasi & Simpan</Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Ringkasan Timeline</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nama:</Text>
                  <Text style={styles.summaryValue}>{formData.name}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tipe:</Text>
                  <Text style={styles.summaryValue}>
                    {
                      getTypeOptions().find(
                        (opt) => opt.value === formData.type
                      )?.label
                    }
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Durasi:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.duration} periode
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(formData.totalAmount)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Periode Libur:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.holidays.length}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Per Periode:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(calculateAmountPerPeriod())}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.templateToggle}
                onPress={() =>
                  updateFormData("saveAsTemplate", !formData.saveAsTemplate)
                }
              >
                <Text style={styles.templateToggleText}>
                  {formData.saveAsTemplate ? "✅" : "⬜"} Simpan sebagai
                  template
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.navigationButtons}>
            {step > 1 && (
              <Button
                title="Sebelumnya"
                onPress={() => setStep(step - 1)}
                variant="outline"
                style={styles.prevButton}
              />
            )}

            {step < 3 ? (
              <Button
                title="Selanjutnya"
                onPress={handleNext}
                style={styles.nextButton}
              />
            ) : (
              <Button
                title={loading ? "Membuat..." : "Buat Timeline"}
                onPress={handleCreate}
                disabled={loading}
                style={styles.createButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardContainer: {
    flex: 1,
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
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  stepDotActive: {
    backgroundColor: "#3b82f6",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: "#3b82f6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 24,
    textAlign: "center",
  },
  templatesSection: {
    marginBottom: 24,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  templateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 12,
    color: "#64748b",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  typeButtonActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#dbeafe",
  },
  typeButtonText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  typeButtonTextActive: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  calculationInfo: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  calculationText: {
    fontSize: 14,
    color: "#0369a1",
    fontWeight: "500",
  },
  periodInstructions: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  periodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  periodButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonHoliday: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  periodButtonTextHoliday: {
    color: "#92400e",
  },
  holidaySummary: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  holidayText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  amountPerPeriod: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  templateToggle: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  templateToggleText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 24,
  },
  prevButton: {
    flex: 1,
    borderColor: "#64748b",
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#10b981",
  },
});
