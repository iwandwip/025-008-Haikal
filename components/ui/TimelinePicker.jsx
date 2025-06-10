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
  minDate = null,
  maxDate = null,
  placeholder = "Pilih waktu",
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

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isSameHour = (date1, date2) => {
    return isSameDay(date1, date2) && date1.getHours() === date2.getHours();
  };

  const getValidRange = (level) => {
    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;
    const current = new Date(selectedDate);

    switch (level) {
      case "year":
        let minYear = current.getFullYear() - 5;
        let maxYear = current.getFullYear() + 5;

        if (min) minYear = Math.max(minYear, min.getFullYear());
        if (max) maxYear = Math.min(maxYear, max.getFullYear());

        return { min: minYear, max: maxYear };

      case "month":
        let minMonth = 0;
        let maxMonth = 11;

        if (min && min.getFullYear() === current.getFullYear()) {
          minMonth = min.getMonth();
        }
        if (max && max.getFullYear() === current.getFullYear()) {
          maxMonth = max.getMonth();
        }

        return { min: minMonth, max: maxMonth };

      case "day":
        const daysInMonth = getDaysInMonth(
          current.getFullYear(),
          current.getMonth()
        );
        let minDay = 1;
        let maxDay = daysInMonth;

        if (
          min &&
          min.getFullYear() === current.getFullYear() &&
          min.getMonth() === current.getMonth()
        ) {
          minDay = min.getDate();
        }
        if (
          max &&
          max.getFullYear() === current.getFullYear() &&
          max.getMonth() === current.getMonth()
        ) {
          maxDay = max.getDate();
        }

        return { min: minDay, max: maxDay };

      case "hour":
        let minHour = 0;
        let maxHour = 23;

        if (min && isSameDay(min, current)) {
          minHour = min.getHours();
        }
        if (max && isSameDay(max, current)) {
          maxHour = max.getHours();
        }

        return { min: minHour, max: maxHour };

      case "minute":
        let minMinute = 0;
        let maxMinute = 59;

        if (min && isSameHour(min, current)) {
          minMinute = min.getMinutes();
        }
        if (max && isSameHour(max, current)) {
          maxMinute = max.getMinutes();
        }

        return { min: minMinute, max: maxMinute };

      case "week":
        const weeksInMonth = getWeeksInMonth(
          current.getFullYear(),
          current.getMonth()
        );
        return { min: 1, max: weeksInMonth };

      default:
        return { min: 0, max: 100 };
    }
  };

  const generateOptions = (level) => {
    const range = getValidRange(level);
    const options = [];

    for (let i = range.min; i <= range.max; i++) {
      let label = i.toString();

      switch (level) {
        case "month":
          label = getMonthName(i);
          break;
        case "week":
          label = `Minggu ${i}`;
          break;
        case "hour":
          label = `${i.toString().padStart(2, "0")}:00`;
          break;
        case "minute":
          label = i.toString().padStart(2, "0");
          break;
      }

      options.push({ value: i, label });
    }

    return options;
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
    let updated = false;

    switch (level) {
      case "year":
        newDate.setFullYear(value);
        updated = true;
        break;
      case "month":
        newDate.setMonth(value);
        const maxDayInNewMonth = getDaysInMonth(newDate.getFullYear(), value);
        if (newDate.getDate() > maxDayInNewMonth) {
          newDate.setDate(maxDayInNewMonth);
        }
        updated = true;
        break;
      case "week":
        const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        const firstDayOfWeek = firstDay.getDay();
        let targetDate = (value - 1) * 7 + (7 - firstDayOfWeek) + 1;
        if (targetDate < 1) targetDate = 1;
        const maxDayInMonth = getDaysInMonth(
          newDate.getFullYear(),
          newDate.getMonth()
        );
        if (targetDate > maxDayInMonth) targetDate = maxDayInMonth;
        newDate.setDate(targetDate);
        updated = true;
        break;
      case "day":
        newDate.setDate(value);
        updated = true;
        break;
      case "hour":
        newDate.setHours(value);
        updated = true;
        break;
      case "minute":
        newDate.setMinutes(value);
        updated = true;
        break;
    }

    if (updated) {
      const min = minDate ? new Date(minDate) : null;
      const max = maxDate ? new Date(maxDate) : null;

      let isValid = true;
      if (min && newDate < min) isValid = false;
      if (max && newDate > max) isValid = false;

      if (isValid) {
        setSelectedDate(newDate);
      }
    }
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

    if (options.length === 0) return null;

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

  const formatRangeText = () => {
    if (!minDate && !maxDate) return null;

    const min = minDate ? new Date(minDate) : null;
    const max = maxDate ? new Date(maxDate) : null;

    if (min && max) {
      return `Range: ${config.formatDisplay(min)} - ${config.formatDisplay(
        max
      )}`;
    } else if (min) {
      return `Minimal: ${config.formatDisplay(min)}`;
    } else if (max) {
      return `Maksimal: ${config.formatDisplay(max)}`;
    }

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputContainerError]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.displayText, !value && styles.placeholderText]}>
          {value ? config.formatDisplay(selectedDate) : placeholder}
        </Text>
        <Text style={styles.pickerIcon}>🕐</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {formatRangeText() && (
        <View style={styles.rangeInfo}>
          <Text style={styles.rangeText}>{formatRangeText()}</Text>
        </View>
      )}

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
  placeholderText: {
    color: Colors.gray400,
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
  rangeInfo: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  rangeText: {
    fontSize: 12,
    color: Colors.gray500,
    fontStyle: "italic",
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
    paddingHorizontal: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    alignItems: "center",
    backgroundColor: Colors.gray50,
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
