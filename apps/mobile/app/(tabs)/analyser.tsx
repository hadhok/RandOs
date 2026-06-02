import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyserScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analyser</Text>
        <Text style={styles.subtitle}>
          Consultez vos statistiques : historique de randonnées, profil
          altimétrique et évolution de vos performances.
        </Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Graphiques à venir
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Randonnées récentes</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Vos randonnées terminées apparaîtront ici.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
