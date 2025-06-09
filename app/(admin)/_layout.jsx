import React from "react";
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tambah-santri" />
      <Stack.Screen name="daftar-santri" />
      <Stack.Screen name="detail-santri" />
    </Stack>
  );
}
