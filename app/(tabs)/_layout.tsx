import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Apollo } from "@/constants/apollo-theme";

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Apollo.amber, tabBarInactiveTintColor: Apollo.mutedDark, tabBarStyle: { height: Platform.OS === "web" ? 58 : 84, paddingTop: 7, paddingBottom: Platform.OS === "web" ? 7 : 23, backgroundColor: Apollo.panel, borderTopColor: Apollo.border, borderTopWidth: 1 }, tabBarLabelStyle: { fontSize: 9, letterSpacing: 1, fontWeight: "800" } }}>
    <Tabs.Screen name="index" options={{ title: "CONSOLE", tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="history" options={{ title: "HISTORY", tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="settings" options={{ title: "CONFIG", tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }} />
  </Tabs>;
}
