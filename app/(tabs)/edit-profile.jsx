import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "../../contexts/AuthContext";
import Input from "../../components/ui/Input";
import DatePicker from "../../components/ui/DatePicker";
import Button from "../../components/ui/Button";
import { updateUserProfile } from "../../services/userService";
import { Colors } from "../../constants/Colors";

export default function EditProfile() {
  const { userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    birthdate: userProfile?.birthdate || "",
    gender: userProfile?.gender || "",
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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "Birth date is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
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
          "Profile Updated",
          "Your profile has been updated successfully!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert("Update Failed", result.error);
      }
    } catch (error) {
      Alert.alert("Update Failed", "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const getDateLimits = () => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 3);

    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);

    return { maxDate, minDate };
  };

  const { maxDate, minDate } = getDateLimits();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          bounces={false}
        >
          <View style={styles.formContainer}>
            <Input
              label="Name"
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              autoCapitalize="words"
              error={errors.name}
            />

            <DatePicker
              label="Birth Date"
              placeholder="Select birth date"
              value={formData.birthdate}
              onChange={(value) => updateFormData("birthdate", value)}
              maximumDate={maxDate}
              minimumDate={minDate}
              error={errors.birthdate}
            />

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Gender</Text>
              <View style={styles.genderButtons}>
                <Button
                  title="Male"
                  onPress={() => updateFormData("gender", "male")}
                  variant={formData.gender === "male" ? "primary" : "outline"}
                  style={styles.genderButton}
                />
                <Button
                  title="Female"
                  onPress={() => updateFormData("gender", "female")}
                  variant={formData.gender === "female" ? "primary" : "outline"}
                  style={styles.genderButton}
                />
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
              disabled={loading}
            />

            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              style={styles.saveButton}
              disabled={loading}
            />
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.gray900,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formContainer: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray700,
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  cancelButton: {
    marginBottom: 8,
  },
  saveButton: {
    marginBottom: 8,
  },
});
