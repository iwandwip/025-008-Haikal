import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { usePathname } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useTranslation } from "../../hooks/useTranslation";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { getUserData } from "../../services/dataService";
import { getColors } from "../../constants/Colors";

const screenWidth = Dimensions.get("window").width;

function GraphicsScreen() {
  const { theme } = useSettings();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const colors = getColors(theme);
  const pathname = usePathname();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState("line");

  const loadData = async (isRefresh = false) => {
    if (!currentUser?.uid) {
      setData([]);
      if (!isRefresh) setLoading(false);
      return;
    }

    if (!isRefresh) setLoading(true);
    const result = await getUserData(currentUser.uid, "asc");

    if (result.success) {
      setData(result.data);
    } else {
      console.warn("Failed to load data:", result.error);
      setData([]);
    }

    if (!isRefresh) setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadData();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (pathname === "/graphics" && currentUser?.uid) {
      loadData(true);
    }
  }, [pathname, currentUser]);

  const getChartData = () => {
    if (!data || data.length === 0) return null;

    const labels = data.slice(-10).map((item, index) => {
      const date = new Date(item.datetime);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const value1Data = data.slice(-10).map((item) => Number(item.value1));
    const value2Data = data.slice(-10).map((item) => Number(item.value2));

    return {
      labels,
      datasets: [
        {
          data: value1Data,
          color: (opacity = 1) => colors.primary,
          strokeWidth: 2,
        },
        {
          data: value2Data,
          color: (opacity = 1) => colors.secondary,
          strokeWidth: 2,
        },
      ],
      legend: ["Value 1", "Value 2"],
    };
  };

  const getBarChartData = () => {
    if (!data || data.length === 0) return null;

    const recentData = data.slice(-7);
    const labels = recentData.map((item, index) => {
      const date = new Date(item.datetime);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const chartData = recentData.map((item) => Number(item.value1));

    return {
      labels,
      datasets: [
        {
          data: chartData,
          color: (opacity = 1) => colors.primary,
        },
      ],
    };
  };

  const getPieChartData = () => {
    if (!data || data.length === 0) return [];

    const statusCounts = {};
    data.forEach((item) => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });

    const pieColors = [
      colors.primary,
      colors.secondary,
      colors.success,
      colors.warning,
      colors.error,
    ];

    return Object.entries(statusCounts).map(([status, count], index) => ({
      name: status,
      population: count,
      color: pieColors[index % pieColors.length],
      legendFontColor: colors.gray700,
      legendFontSize: 12,
    }));
  };

  const getStatistics = () => {
    if (!data || data.length === 0) return null;

    const value1Array = data.map((item) => Number(item.value1));
    const value2Array = data.map((item) => Number(item.value2));

    return {
      totalRecords: data.length,
      avgValue1: (
        value1Array.reduce((a, b) => a + b, 0) / value1Array.length
      ).toFixed(2),
      avgValue2: (
        value2Array.reduce((a, b) => a + b, 0) / value2Array.length
      ).toFixed(2),
      maxValue1: Math.max(...value1Array).toFixed(2),
      maxValue2: Math.max(...value2Array).toFixed(2),
      minValue1: Math.min(...value1Array).toFixed(2),
      minValue2: Math.min(...value2Array).toFixed(2),
    };
  };

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(245, 0, 87, ${opacity})`,
    labelColor: (opacity = 1) => colors.gray700,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner text={t("common.loading")} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("graphics.title")}</Text>
          <Text style={styles.subtitle}>{t("graphics.subtitle")}</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("graphics.noData")}</Text>
          <Text style={styles.emptySubtext}>{t("graphics.noDataDesc")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lineData = getChartData();
  const barData = getBarChartData();
  const pieData = getPieChartData();
  const stats = getStatistics();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("graphics.title")}</Text>
        <Text style={styles.subtitle}>{t("graphics.subtitle")}</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title={t("common.refreshing")}
          />
        }
      >
        <View style={styles.chartTypeContainer}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "line" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("line")}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === "line" && styles.chartTypeTextActive,
              ]}
            >
              {t("graphics.lineChart")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "bar" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("bar")}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === "bar" && styles.chartTypeTextActive,
              ]}
            >
              {t("graphics.barChart")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "pie" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("pie")}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === "pie" && styles.chartTypeTextActive,
              ]}
            >
              {t("graphics.pieChart")}
            </Text>
          </TouchableOpacity>
        </View>

        {chartType === "line" && lineData && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t("graphics.trendsTitle")}</Text>
            <LineChart
              data={lineData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {chartType === "bar" && barData && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t("graphics.trendsTitle")}</Text>
            <BarChart
              data={barData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        )}

        {chartType === "pie" && pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{t("graphics.statusTitle")}</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>{t("graphics.summaryTitle")}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>
                  {t("graphics.totalRecords")}
                </Text>
                <Text style={styles.statValue}>{stats.totalRecords}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>
                  {t("graphics.averageValue1")}
                </Text>
                <Text style={styles.statValue}>{stats.avgValue1}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>
                  {t("graphics.averageValue2")}
                </Text>
                <Text style={styles.statValue}>{stats.avgValue2}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("graphics.maxValue1")}</Text>
                <Text style={styles.statValue}>{stats.maxValue1}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("graphics.maxValue2")}</Text>
                <Text style={styles.statValue}>{stats.maxValue2}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("graphics.minValue1")}</Text>
                <Text style={styles.statValue}>{stats.minValue1}</Text>
              </View>
            </View>
          </View>
        )}
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200,
      backgroundColor: colors.white,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.gray900,
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.gray600,
      textAlign: "center",
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.gray700,
      marginBottom: 8,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.gray500,
      textAlign: "center",
      lineHeight: 20,
    },
    chartTypeContainer: {
      flexDirection: "row",
      marginBottom: 24,
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    chartTypeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    chartTypeText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.gray600,
    },
    chartTypeTextActive: {
      color: colors.white,
      fontWeight: "600",
    },
    chartContainer: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
      textAlign: "center",
    },
    chart: {
      borderRadius: 16,
    },
    statsContainer: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.shadow.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.gray900,
      marginBottom: 16,
      textAlign: "center",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    statItem: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    statLabel: {
      fontSize: 12,
      color: colors.gray600,
      marginBottom: 4,
      textAlign: "center",
    },
    statValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primary,
    },
  });

export default GraphicsScreen;
