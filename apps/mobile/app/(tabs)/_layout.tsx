import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ACTIVE_COLOR = "#2D6A4F";
const INACTIVE_COLOR = "#9CA3AF";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
        headerStyle: { backgroundColor: "#2D6A4F" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="prepare"
        options={{
          title: "Préparer",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="enroute"
        options={{
          title: "En route",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyser"
        options={{
          title: "Bilans",
          headerTitle: "Mes randonnées",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: "Plus",
          headerTitle: "Outils",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
