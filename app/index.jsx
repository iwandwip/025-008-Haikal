import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Colors } from "../constants/Colors";

export default function Index() {
  const { currentUser, loading, authInitialized, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authInitialized && !loading) {
      if (currentUser) {
        if (isAdmin) {
          router.replace("/(admin)");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [currentUser, loading, authInitialized, isAdmin]);

  if (!authInitialized || loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Initializing..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner text="Redirecting..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
