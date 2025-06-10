import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useSettings } from "../../contexts/SettingsContext";
import { getColors } from "../../constants/Colors";

export default function TabsLayout() {
  const { theme } = useSettings();
  const colors = getColors(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Status Pembayaran",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>💰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
