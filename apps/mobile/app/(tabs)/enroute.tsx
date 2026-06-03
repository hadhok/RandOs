import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { IGN_WMTS_URL, computeTrackStats, exportToGPX } from "@randos/core";
import type { TrackPoint, ActiveTrack } from "@randos/core";

MapLibreGL.setAccessToken(null);

type RecordingState = "idle" | "recording" | "paused";
type Coord = [number, number];

function buildActiveTrack(
  startTime: number,
  points: TrackPoint[],
): ActiveTrack {
  return { id: "current", startTime, points, notes: [] };
}

export default function EnRouteScreen() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const startTimeRef = useRef<number>(0);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const activeTrack =
    points.length > 0 ? buildActiveTrack(startTimeRef.current, points) : null;
  const stats = activeTrack ? computeTrackStats(activeTrack) : null;

  const trackGeoJSON =
    points.length >= 2
      ? {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: points.map((p): Coord => [p.lng, p.lat]),
          },
          properties: {},
        }
      : null;

  const onLocation = useCallback((loc: Location.LocationObject) => {
    const { latitude, longitude, altitude } = loc.coords;
    const point: TrackPoint = {
      lat: latitude,
      lng: longitude,
      timestamp: loc.timestamp,
      altitudeM: altitude ?? undefined,
    };
    setCurrentPos([longitude, latitude]);
    setPoints((prev) => [...prev, point]);
    cameraRef.current?.setCamera({
      centerCoordinate: [longitude, latitude],
      animationDuration: 800,
    });
  }, []);

  async function startRecording() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "L'accès à la localisation est requis pour enregistrer la randonnée.",
      );
      return;
    }
    setPoints([]);
    startTimeRef.current = Date.now();
    setRecordingState("recording");
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      onLocation,
    );
  }

  function pauseRecording() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setRecordingState("paused");
  }

  async function resumeRecording() {
    setRecordingState("recording");
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      onLocation,
    );
  }

  async function stopAndSave() {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setRecordingState("idle");

    if (!activeTrack || points.length < 2) return;

    const finalStats = computeTrackStats(activeTrack);
    const hikeName = `Rando ${new Date().toLocaleDateString("fr-FR")}`;

    Alert.alert(
      "Enregistrement terminé",
      `${finalStats.distanceKm.toFixed(2)} km · ${Math.round(finalStats.durationMinutes)} min · D+ ${Math.round(finalStats.elevationGainM)} m`,
      [
        { text: "Fermer" },
        {
          text: "Exporter GPX",
          onPress: async () => {
            try {
              const gpx = exportToGPX(activeTrack, hikeName);
              const uri = (FileSystem.cacheDirectory ?? "") + "randos_track.gpx";
              await FileSystem.writeAsStringAsync(uri, gpx, {
                encoding: FileSystem.EncodingType.UTF8,
              });
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                  mimeType: "application/gpx+xml",
                  dialogTitle: "Exporter le tracé GPX",
                });
              }
            } catch {
              Alert.alert("Erreur", "Impossible d'exporter le fichier GPX.");
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return (
    <View style={styles.root}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={currentPos ?? [2.3522, 46.8566]}
        />
        <MapLibreGL.RasterSource
          id="tiles"
          tileUrlTemplates={[IGN_WMTS_URL]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id="tileLayer" sourceID="tiles" />
        </MapLibreGL.RasterSource>

        {trackGeoJSON && (
          <MapLibreGL.ShapeSource id="trackSrc" shape={trackGeoJSON}>
            <MapLibreGL.LineLayer
              id="trackLine"
              style={{
                lineColor: "#3B82F6",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {currentPos && (
          <MapLibreGL.PointAnnotation id="userPos" coordinate={currentPos}>
            <View style={styles.posMarker}>
              <View style={styles.posMarkerInner} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <View style={styles.statsRow}>
          <StatBox
            icon="map-outline"
            label="Distance"
            value={stats ? `${stats.distanceKm.toFixed(2)} km` : "0 km"}
          />
          <StatBox
            icon="trending-up-outline"
            label="D+"
            value={stats ? `${Math.round(stats.elevationGainM)} m` : "0 m"}
          />
          <StatBox
            icon="time-outline"
            label="Durée"
            value={
              stats ? `${Math.round(stats.durationMinutes)} min` : "0 min"
            }
          />
          <StatBox
            icon="speedometer-outline"
            label="Vitesse"
            value={stats ? `${stats.avgSpeedKmh.toFixed(1)} km/h` : "—"}
          />
        </View>

        <View style={styles.controls}>
          {recordingState === "idle" && (
            <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.startBtnText}>Démarrer l'enregistrement</Text>
            </TouchableOpacity>
          )}

          {recordingState === "recording" && (
            <>
              <TouchableOpacity style={styles.pauseBtn} onPress={pauseRecording}>
                <Ionicons name="pause" size={22} color="#374151" />
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={stopAndSave}>
                <Ionicons name="stop" size={22} color="#fff" />
                <Text style={styles.stopBtnText}>Terminer</Text>
              </TouchableOpacity>
            </>
          )}

          {recordingState === "paused" && (
            <>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={resumeRecording}
              >
                <Ionicons name="play" size={22} color="#fff" />
                <Text style={styles.startBtnText}>Reprendre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopBtn} onPress={stopAndSave}>
                <Ionicons name="stop" size={22} color="#fff" />
                <Text style={styles.stopBtnText}>Terminer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {recordingState === "recording" && (
          <View style={styles.recordingRow}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>
              Enregistrement en cours · {points.length} points
            </Text>
          </View>
        )}
        {recordingState === "paused" && (
          <View style={styles.recordingRow}>
            <View style={[styles.recDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={styles.recText}>En pause · {points.length} points enregistrés</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={16} color="#2D6A4F" />
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
  posMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  posMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#fff",
  },
  panel: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    gap: 3,
  },
  statBoxValue: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  statBoxLabel: { fontSize: 10, color: "#6B7280" },
  controls: { flexDirection: "row", gap: 10, marginBottom: 10 },
  startBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#2D6A4F", paddingVertical: 12, borderRadius: 10,
  },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  pauseBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#F3F4F6", paddingVertical: 12, borderRadius: 10,
  },
  pauseBtnText: { color: "#374151", fontWeight: "700", fontSize: 15 },
  stopBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: "#EF4444", paddingVertical: 12, borderRadius: 10,
  },
  stopBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  recordingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginBottom: 4,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  recText: { fontSize: 12, color: "#6B7280" },
});
