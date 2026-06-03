import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { calculatePathDistance, formatDistance } from "@randos/core";
import { useHikeStore } from "../../hooks/useHikeStore";
import type { Hike } from "../../hooks/useHikeStore";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AnalyserScreen() {
  const { hikes, activeHike, setActiveHike, deleteHike, loaded } =
    useHikeStore();

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hikes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Ionicons name="trail-sign-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Aucune randonnée</Text>
          <Text style={styles.emptyText}>
            Importez un fichier GPX dans l'onglet Préparer pour commencer.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={hikes}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.count}>
            {hikes.length} rando{hikes.length > 1 ? "s" : ""}
          </Text>
        }
        renderItem={({ item }) => (
          <HikeCard
            hike={item}
            isActive={item.id === activeHike?.id}
            onPress={() => setActiveHike(item.id)}
            onDelete={() =>
              Alert.alert(
                "Supprimer",
                `Supprimer "${item.name}" ?`,
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => deleteHike(item.id),
                  },
                ],
              )
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function HikeCard({
  hike,
  isActive,
  onPress,
  onDelete,
}: {
  hike: Hike;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const dist = calculatePathDistance(
    hike.waypoints.map((w) => ({ lat: w.lat, lon: w.lng })),
  );

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIcon, isActive && styles.cardIconActive]}>
        <Ionicons
          name="footsteps-outline"
          size={22}
          color={isActive ? "#fff" : "#2D6A4F"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.cardName, isActive && styles.cardNameActive]}>
          {hike.name}
        </Text>
        <Text style={[styles.cardMeta, isActive && styles.cardMetaActive]}>
          {formatDate(hike.createdAt)} · {hike.waypoints.length} points
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons
              name="map-outline"
              size={11}
              color={isActive ? "rgba(255,255,255,0.8)" : "#6B7280"}
            />
            <Text style={[styles.cardStatText, isActive && styles.cardStatTextActive]}>
              {formatDistance(dist)}
            </Text>
          </View>
        </View>
      </View>

      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onDelete}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        style={{ marginLeft: 8 }}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={isActive ? "rgba(255,255,255,0.5)" : "#D1D5DB"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  list: { padding: 16, gap: 10 },
  count: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  cardNameActive: { color: "#fff" },
  cardMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  cardMetaActive: { color: "rgba(255,255,255,0.7)" },
  cardStats: { flexDirection: "row", gap: 12, marginTop: 6 },
  cardStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardStatText: { fontSize: 13, fontWeight: "600", color: "#2D6A4F" },
  cardStatTextActive: { color: "rgba(255,255,255,0.9)" },
  activeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
