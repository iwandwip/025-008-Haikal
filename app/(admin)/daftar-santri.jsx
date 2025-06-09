import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getAllSantri } from "../../services/userService";

export default function DaftarSantri() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadSantri = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    const result = await getAllSantri();
    if (result.success) {
      setSantriList(result.data);
    } else {
      console.error("Error loading santri:", result.error);
    }
    
    if (!isRefresh) setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSantri(true);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSantri();
    }, [])
  );

  useEffect(() => {
    loadSantri();
  }, []);

  const handleSantriPress = (santri) => {
    router.push({
      pathname: "/(admin)/detail-santri",
      params: { santriId: santri.id }
    });
  };

  const renderSantriItem = ({ item }) => (
    <TouchableOpacity
      style={styles.santriCard}
      onPress={() => handleSantriPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.santriInfo}>
        <Text style={styles.namaSantri}>{item.namaSantri}</Text>
        <Text style={styles.namaWali}>Wali: {item.namaWali}</Text>
        <Text style={styles.noHp}>HP: {item.noHpWali}</Text>
      </View>
      
      <View style={styles.rfidSection}>
        {item.rfidSantri ? (
          <View style={styles.rfidActive}>
            <Text style={styles.rfidLabel}>RFID</Text>
            <Text style={styles.rfidValue}>✓ Terpasang</Text>
          </View>
        ) : (
          <View style={styles.rfidInactive}>
            <Text style={styles.rfidLabel}>RFID</Text>
            <Text style={styles.rfidValue}>⚠ Belum</Text>
          </View>
        )}
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Daftar Santri</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner text="Memuat data santri..." />
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
        <Text style={styles.headerTitle}>Daftar Santri</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsSection}>
          <Text style={styles.statsText}>
            Total Santri: {santriList.length}
          </Text>
          <Text style={styles.statsSubtext}>
            RFID Terpasang: {santriList.filter(s => s.rfidSantri).length} | 
            Belum: {santriList.filter(s => !s.rfidSantri).length}
          </Text>
        </View>

        {santriList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada santri terdaftar</Text>
            <Text style={styles.emptySubtext}>
              Tambah santri baru melalui menu Tambah Data Santri
            </Text>
          </View>
        ) : (
          <FlatList
            data={santriList}
            renderItem={renderSantriItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3b82f6"]}
                tintColor="#3b82f6"
              />
            }
          />
        )}
      </View>
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