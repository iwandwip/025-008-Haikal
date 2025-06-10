import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Colors } from "../../constants/Colors";

const TimelinePicker = ({
  label,
  value,
  onChange,
  timelineType,
  error,
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date(value || Date.now())
  );

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const getPickerConfig = () => {
    const configs = {
      yearly: {
        levels: ["year"],
        label: "Tahun",
        formatDisplay: (date) => date.getFullYear().toString(),
      },
      monthly: {
        levels: ["year", "month"],
        label: "Bulan",
        formatDisplay: (date) =>
          `${getMonthName(date.getMonth())} ${date.getFullYear()}`,
      },
      weekly: {
        levels: ["year", "month", "week"],
        label: "Minggu",
        formatDisplay: (date) => {
          const weekNum = getWeekOfMonth(date);
          return `Minggu ${weekNum}, ${getMonthName(
            date.getMonth()
          )} ${date.getFullYear()}`;
        },
      },
      daily: {
        levels: ["year", "month", "day"],
        label: "Hari",
        formatDisplay: (date) =>
          date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
      },
      hourly: {
        levels: ["year", "month", "day", "hour"],
        label: "Jam",
        formatDisplay: (date) =>
          date.toLocaleString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
      minute: {
        levels: ["year", "month", "day", "hour", "minute"],
        label: "Menit",
        formatDisplay: (date) =>
          date.toLocaleString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
    };
    return configs[timelineType] || configs.daily;
  };

  const config = getPickerConfig();

  const getMonthName = (monthIndex) => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[monthIndex];
  };

  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay();
    const adjustedDay = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(adjustedDay / 7);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    return Math.ceil((daysInMonth + firstDayOfWeek) / 7);
  };

  const generateOptions = (level) => {
    const currentDate = selectedDate;

    switch (level) {
      case "year":
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
          years.push({ value: i, label: i.toString() });
        }
        return years;

      case "month":
        const months = [];
        for (let i = 0; i < 12; i++) {
          months.push({ value: i, label: getMonthName(i) });
        }
        return months;

      case "week":
        const weeksCount = getWeeksInMonth(
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        const weeks = [];
        for (let i = 1; i <= weeksCount; i++) {
          weeks.push({ value: i, label: `Minggu ${i}` });
        }
        return weeks;

      case "day":
        const daysCount = getDaysInMonth(
          currentDate.getFullYear(),
          currentDate.getMonth()
        );
        const days = [];
        for (let i = 1; i <= daysCount; i++) {
          days.push({ value: i, label: i.toString() });
        }
        return days;

      case "hour":
        const hours = [];
        for (let i = 0; i < 24; i++) {
          const hourStr = i.toString().padStart(2, "0");
          hours.push({ value: i, label: `${hourStr}:00` });
        }
        return hours;

      case "minute":
        const minutes = [];
        for (let i = 0; i < 60; i++) {
          const minuteStr = i.toString().padStart(2, "0");
          minutes.push({ value: i, label: minuteStr });
        }
        return minutes;

      default:
        return [];
    }
  };

  const getValue = (level) => {
    switch (level) {
      case "year":
        return selectedDate.getFullYear();
      case "month":
        return selectedDate.getMonth();
      case "week":
        return getWeekOfMonth(selectedDate);
      case "day":
        return selectedDate.getDate();
      case "hour":
        return selectedDate.getHours();
      case "minute":
        return selectedDate.getMinutes();
      default:
        return 0;
    }
  };

  const setValue = (level, value) => {
    const newDate = new Date(selectedDate);

    switch (level) {
      case "year":
        newDate.setFullYear(value);
        break;
      case "month":
        newDate.setMonth(value);
        break;
      case "week":
        const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        const firstDayOfWeek = firstDay.getDay();
        const targetDate = (value - 1) * 7 + 1 - firstDayOfWeek + 1;
        newDate.setDate(Math.max(1, targetDate));
        break;
      case "day":
        newDate.setDate(value);
        break;
      case "hour":
        newDate.setHours(value);
        break;
      case "minute":
        newDate.setMinutes(value);
        break;
    }

    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onChange(selectedDate.toISOString());
    setShowPicker(false);
  };

  const handleCancel = () => {
    setSelectedDate(new Date(value || Date.now()));
    setShowPicker(false);
  };

  const renderPickerLevel = (level) => {
    const options = generateOptions(level);
    const currentValue = getValue(level);

    return (
      <View key={level} style={styles.pickerLevel}>
        <Text style={styles.pickerLevelTitle}>
          {level === "year" && "Tahun"}
          {level === "month" && "Bulan"}
          {level === "week" && "Minggu"}
          {level === "day" && "Tanggal"}
          {level === "hour" && "Jam"}
          {level === "minute" && "Menit"}
        </Text>

        <ScrollView
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                currentValue === option.value && styles.optionButtonSelected,
              ]}
              onPress={() => setValue(level, option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  currentValue === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputContainerError]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.displayText}>
          {config.formatDisplay(selectedDate)}
        </Text>
        <Text style={styles.pickerIcon}>🕐</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih {config.label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContent}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.levelsContainer}
              >
                {config.levels.map(renderPickerLevel)}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Konfirmasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray700,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  displayText: {
    fontSize: 16,
    color: Colors.gray900,
    flex: 1,
  },
  pickerIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray600,
  },
  pickerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  levelsContainer: {
    gap: 20,
  },
  pickerLevel: {
    width: 120,
    alignItems: "center",
  },
  pickerLevelTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray700,
    marginBottom: 12,
    textAlign: "center",
  },
  optionsContainer: {
    maxHeight: 200,
    width: "100%",
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.gray100,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray700,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});

export default TimelinePicker;
