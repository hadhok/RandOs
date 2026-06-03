import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  generateChecklist,
  weatherCodeToIcon,
  weatherCodeToDescription,
  EMERGENCY_CONTACTS,
} from "@randos/core";
import type { ChecklistContext, WeatherIcon } from "@randos/core";
import { useHikeStore } from "../../hooks/useHikeStore";

type Tab = "meteo" | "checklist" | "sos";

const WEATHER_EMOJI: Record<WeatherIcon, string> = {
  sun: "☀️",
  cloud: "☁️",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
};

interface WeatherDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
  windSpeed: number;
  precipitation: number;
}

export default function PlusScreen() {
  const [tab, setTab] = useState<Tab>("meteo");

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <View style={styles.segmented}>
        {(
          [
            ["meteo", "🌤️", "Météo"],
            ["checklist", "✅", "Check-list"],
            ["sos", "🆘", "SOS"],
          ] as [Tab, string, string][]
        ).map(([t, icon, label]) => (
          <TouchableOpacity
            key={t}
            style={[styles.seg, tab === t && styles.segActive]}
            onPress={() => setTab(t)}
          >
            <Text style={styles.segIcon}>{icon}</Text>
            <Text style={[styles.segLabel, tab === t && styles.segLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "meteo" && <MeteoTab />}
      {tab === "checklist" && <ChecklistTab />}
      {tab === "sos" && <SOSTab />}
    </SafeAreaView>
  );
}

/* ─── MÉTÉO ─── */

function MeteoTab() {
  const { activeHike } = useHikeStore();
  const [days, setDays] = useState<WeatherDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  async function fetchWeather(lat: number, lon: number, label: string) {
    setLoading(true);
    setError(null);
    setLocationLabel(label);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum` +
        `&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        daily: {
          time: string[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          weathercode: number[];
          windspeed_10m_max: number[];
          precipitation_sum: number[];
        };
      };
      setDays(
        json.daily.time.map((date, i) => ({
          date,
          maxTemp: json.daily.temperature_2m_max[i]!,
          minTemp: json.daily.temperature_2m_min[i]!,
          code: json.daily.weathercode[i]!,
          windSpeed: json.daily.windspeed_10m_max[i]!,
          precipitation: json.daily.precipitation_sum[i]!,
        })),
      );
    } catch {
      setError("Impossible de récupérer la météo. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function fromHikeStart() {
    if (!activeHike || activeHike.waypoints.length === 0) {
      setError("Aucune rando active avec des waypoints.");
      return;
    }
    const wp = activeHike.waypoints[0]!;
    await fetchWeather(wp.lat, wp.lng, `Départ — ${activeHike.name}`);
  }

  async function fromCurrentPosition() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Permission GPS refusée.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    await fetchWeather(
      loc.coords.latitude,
      loc.coords.longitude,
      "Position actuelle",
    );
  }

  return (
    <ScrollView style={styles.tab} contentContainerStyle={styles.tabPad}>
      <View style={styles.meteoButtons}>
        <TouchableOpacity
          style={styles.meteoBtn}
          onPress={fromHikeStart}
          disabled={loading}
        >
          <Ionicons name="footsteps-outline" size={16} color="#2D6A4F" />
          <Text style={styles.meteoBtnText}>Départ de la rando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.meteoBtn}
          onPress={fromCurrentPosition}
          disabled={loading}
        >
          <Ionicons name="location-outline" size={16} color="#2D6A4F" />
          <Text style={styles.meteoBtnText}>Ma position</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color="#2D6A4F" />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {locationLabel && !loading && (
        <Text style={styles.locationLabel}>📍 {locationLabel}</Text>
      )}

      {days?.map((day) => {
        const icon = weatherCodeToIcon(day.code);
        const desc = weatherCodeToDescription(day.code);
        const emoji = WEATHER_EMOJI[icon];
        const dateStr = new Date(day.date + "T12:00:00").toLocaleDateString(
          "fr-FR",
          { weekday: "short", day: "numeric", month: "short" },
        );
        return (
          <View key={day.date} style={styles.weatherCard}>
            <Text style={styles.weatherEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherDate}>{dateStr}</Text>
              <Text style={styles.weatherDesc}>{desc}</Text>
              <Text style={styles.weatherSub}>
                💨 {Math.round(day.windSpeed)} km/h · 🌧️{" "}
                {day.precipitation.toFixed(1)} mm
              </Text>
            </View>
            <View style={styles.weatherTemps}>
              <Text style={styles.tempMax}>{Math.round(day.maxTemp)}°</Text>
              <Text style={styles.tempMin}>{Math.round(day.minTemp)}°</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ─── CHECKLIST ─── */

function ChecklistTab() {
  const { activeHike } = useHikeStore();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [nights, setNights] = useState(0);
  const [season, setSeason] = useState<ChecklistContext["season"]>("ete");

  const ctx: ChecklistContext = {
    durationDays: nights + 1,
    hasBivouac: nights > 0,
    season,
    maxAltitude: 2000,
  };
  const items = generateChecklist(ctx);
  const categories = [...new Set(items.map((i) => i.category))];

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetAll() {
    setChecked(new Set());
  }

  return (
    <ScrollView style={styles.tab} contentContainerStyle={styles.tabPad}>
      <View style={styles.checklistHeader}>
        <View>
          <Text style={styles.checklistTitle}>
            {activeHike ? activeHike.name : "Checklist"}
          </Text>
          <Text style={styles.checklistSub}>
            {checked.size}/{items.length} élément{checked.size > 1 ? "s" : ""}{" "}
            cochés
          </Text>
        </View>
        <TouchableOpacity onPress={resetAll}>
          <Ionicons name="refresh-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Nights control */}
      <View style={styles.nightsRow}>
        <Text style={styles.nightsLabel}>Nuits :</Text>
        <TouchableOpacity
          style={styles.nightBtn}
          onPress={() => setNights((n) => Math.max(0, n - 1))}
        >
          <Text style={styles.nightBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.nightsValue}>{nights}</Text>
        <TouchableOpacity
          style={styles.nightBtn}
          onPress={() => setNights((n) => n + 1)}
        >
          <Text style={styles.nightBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Season selector */}
      <View style={styles.seasonRow}>
        {(
          [
            ["ete", "Été"],
            ["mi-saison", "Mi-saison"],
            ["hiver", "Hiver"],
          ] as [ChecklistContext["season"], string][]
        ).map(([s, label]) => (
          <TouchableOpacity
            key={s}
            style={[styles.seasonBtn, season === s && styles.seasonBtnActive]}
            onPress={() => setSeason(s)}
          >
            <Text
              style={[
                styles.seasonBtnText,
                season === s && styles.seasonBtnTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items by category */}
      {categories.map((cat) => (
        <View key={cat} style={styles.catSection}>
          <Text style={styles.catLabel}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Text>
          {items
            .filter((i) => i.category === cat)
            .map((item) => {
              const done = checked.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkRow}
                  onPress={() => toggle(item.id)}
                >
                  <View style={[styles.checkBox, done && styles.checkBoxDone]}>
                    {done && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[styles.checkLabel, done && styles.checkLabelDone]}
                  >
                    {item.name}
                  </Text>
                  {item.essential && !done && (
                    <View style={styles.essentialDot} />
                  )}
                  {item.weightGrams && (
                    <Text style={styles.checkWeight}>
                      {item.weightGrams >= 1000
                        ? `${(item.weightGrams / 1000).toFixed(1)} kg`
                        : `${item.weightGrams} g`}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
      ))}
    </ScrollView>
  );
}

/* ─── SOS ─── */

function SOSTab() {
  return (
    <ScrollView style={styles.tab} contentContainerStyle={styles.tabPad}>
      <View style={styles.sosWarningBox}>
        <Ionicons name="warning-outline" size={20} color="#DC2626" />
        <Text style={styles.sosWarningText}>
          En cas d'urgence en montagne, composez le numéro approprié. Ayez
          toujours vos coordonnées GPS à portée.
        </Text>
      </View>

      {EMERGENCY_CONTACTS.map((c) => (
        <TouchableOpacity
          key={c.number}
          style={styles.sosCard}
          onPress={() => Linking.openURL(`tel:${c.number}`)}
        >
          <View style={styles.sosNumBadge}>
            <Text style={styles.sosNumText}>{c.number}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosName}>{c.name}</Text>
            <Text style={styles.sosDesc}>{c.description}</Text>
          </View>
          <Ionicons name="call" size={20} color="#DC2626" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ─── STYLES ─── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },

  segmented: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  seg: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 5,
    paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  segActive: { borderBottomColor: "#2D6A4F" },
  segIcon: { fontSize: 15 },
  segLabel: { fontSize: 13, fontWeight: "500", color: "#6B7280" },
  segLabelActive: { color: "#2D6A4F", fontWeight: "700" },

  tab: { flex: 1 },
  tabPad: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { alignItems: "center", paddingVertical: 24 },

  /* Météo */
  meteoButtons: { flexDirection: "row", gap: 10 },
  meteoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
    paddingVertical: 10, borderRadius: 10,
  },
  meteoBtnText: { fontSize: 13, fontWeight: "600", color: "#2D6A4F" },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },
  locationLabel: { fontSize: 13, color: "#6B7280", fontStyle: "italic" },
  weatherCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  weatherEmoji: { fontSize: 28 },
  weatherDate: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  weatherDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  weatherSub: { fontSize: 11, color: "#9CA3AF", marginTop: 3 },
  weatherTemps: { alignItems: "flex-end", gap: 2 },
  tempMax: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
  tempMin: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },

  /* Checklist */
  checklistHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 4,
  },
  checklistTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  checklistSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  nightsRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  nightsLabel: { fontSize: 14, color: "#374151", fontWeight: "600", flex: 1 },
  nightBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  nightBtnText: { fontSize: 18, color: "#374151", fontWeight: "700" },
  nightsValue: { fontSize: 16, fontWeight: "700", color: "#1F2937", minWidth: 24, textAlign: "center" },
  seasonRow: { flexDirection: "row", gap: 8 },
  seasonBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#E5E7EB",
    backgroundColor: "#fff", alignItems: "center",
  },
  seasonBtnActive: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  seasonBtnText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  seasonBtnTextActive: { color: "#fff" },
  catSection: { marginBottom: 4 },
  catLabel: {
    fontSize: 11, fontWeight: "700", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 6, marginTop: 8,
  },
  checkRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 9, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  checkBox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 2, borderColor: "#D1D5DB",
    alignItems: "center", justifyContent: "center",
  },
  checkBoxDone: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  checkLabel: { flex: 1, fontSize: 14, color: "#374151" },
  checkLabelDone: { color: "#9CA3AF", textDecorationLine: "line-through" },
  essentialDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444",
  },
  checkWeight: { fontSize: 11, color: "#9CA3AF" },

  /* SOS */
  sosWarningBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#FEF2F2", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#FECACA",
  },
  sosWarningText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  sosCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 1,
  },
  sosNumBadge: {
    minWidth: 48, height: 48, borderRadius: 24,
    backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 8,
  },
  sosNumText: { fontSize: 15, fontWeight: "800", color: "#DC2626" },
  sosName: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  sosDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
