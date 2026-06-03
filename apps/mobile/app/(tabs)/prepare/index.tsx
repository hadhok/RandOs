import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  IGN_WMTS_URL,
  CARTO_TILE_URL,
  parseGPX,
  calculatePathDistance,
  formatDistance,
} from "@randos/core";
import { useHikeStore } from "../../../hooks/useHikeStore";
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";

MapLibreGL.setAccessToken(null);

type Coord = [number, number]; // [lng, lat]

function routeGeoJSON(waypoints: { lat: number; lng: number }[]) {
  if (waypoints.length < 2) return null;
  return {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: waypoints.map((wp): Coord => [wp.lng, wp.lat]),
    },
    properties: {},
  };
}

export default function PrepareScreen() {
  const { hikes, activeHike, createHike, updateHike, deleteHike, setActiveHike } =
    useHikeStore();
  const { isOnline } = useNetworkStatus();
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [showHikeList, setShowHikeList] = useState(false);
  const [importing, setImporting] = useState(false);

  const waypoints = activeHike?.waypoints ?? [];
  const distance = calculatePathDistance(
    waypoints.map((wp) => ({ lat: wp.lat, lon: wp.lng })),
  );
  const route = routeGeoJSON(waypoints);

  const fitToBounds = useCallback(
    (wps: typeof waypoints) => {
      if (wps.length < 2 || !cameraRef.current) return;
      const lngs = wps.map((w) => w.lng);
      const lats = wps.map((w) => w.lat);
      cameraRef.current.fitBounds(
        [Math.max(...lngs), Math.max(...lats)],
        [Math.min(...lngs), Math.min(...lats)],
        [80, 80, 80, 80],
        600,
      );
    },
    [],
  );

  async function importGPX() {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/gpx+xml", "application/xml", "text/xml", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      const xml = await FileSystem.readAsStringAsync(uri);
      const { waypoints: parsed, name, totalDistanceKm } = parseGPX(xml);

      const hikeName =
        name ||
        (result.assets[0].name ?? "Nouvelle rando").replace(/\.gpx$/i, "");
      const hike = createHike(hikeName);
      const wps = parsed.map((wp) => ({ lat: wp.lat, lng: wp.lng }));
      updateHike(hike.id, { waypoints: wps });

      Alert.alert("GPX importé", `${parsed.length} points · ${totalDistanceKm.toFixed(1)} km`);
      setTimeout(() => fitToBounds(wps), 400);
    } catch {
      Alert.alert("Erreur", "Impossible de lire le fichier GPX.");
    } finally {
      setImporting(false);
    }
  }

  const center: Coord =
    waypoints.length > 0
      ? [waypoints[0]!.lng, waypoints[0]!.lat]
      : [2.3522, 46.8566];

  return (
    <View style={styles.root}>
      {/* MAP */}
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={waypoints.length > 0 ? 10 : 6}
          centerCoordinate={center}
          animationDuration={500}
        />
        <MapLibreGL.RasterSource
          id="tiles"
          tileUrlTemplates={[isOnline ? IGN_WMTS_URL : CARTO_TILE_URL]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id="tileLayer" sourceID="tiles" />
        </MapLibreGL.RasterSource>

        {route && (
          <MapLibreGL.ShapeSource id="routeSrc" shape={route}>
            <MapLibreGL.LineLayer
              id="routeLine"
              style={{ lineColor: "#2D6A4F", lineWidth: 3, lineCap: "round", lineJoin: "round" }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {waypoints.length >= 1 && (
          <MapLibreGL.PointAnnotation
            id="startPt"
            coordinate={[waypoints[0]!.lng, waypoints[0]!.lat]}
          >
            <View style={styles.markerGreen} />
          </MapLibreGL.PointAnnotation>
        )}
        {waypoints.length >= 2 && (
          <MapLibreGL.PointAnnotation
            id="endPt"
            coordinate={[waypoints[waypoints.length - 1]!.lng, waypoints[waypoints.length - 1]!.lat]}
          >
            <View style={styles.markerRed} />
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* BADGES */}
      {!isOnline && (
        <View style={styles.offlineBadge}>
          <Ionicons name="cloud-offline-outline" size={13} color="#fff" />
          <Text style={styles.offlineBadgeText}>Hors ligne</Text>
        </View>
      )}

      {/* IMPORT FAB */}
      <TouchableOpacity
        style={[styles.fab, importing && { opacity: 0.6 }]}
        onPress={importGPX}
        disabled={importing}
      >
        {importing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
        )}
      </TouchableOpacity>

      {/* BOTTOM PANEL */}
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <TouchableOpacity style={styles.panelHandle} onPress={() => setPanelExpanded((v) => !v)}>
          <View style={styles.handleBar} />
        </TouchableOpacity>

        {!activeHike ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyText}>Importez un fichier GPX pour commencer</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={importGPX}>
              <Ionicons name="cloud-upload-outline" size={17} color="#fff" />
              <Text style={styles.primaryBtnText}>Importer un GPX</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => { createHike(`Rando ${hikes.length + 1}`); }}
            >
              <Ionicons name="add" size={17} color="#2D6A4F" />
              <Text style={styles.outlineBtnText}>Nouvelle rando vide</Text>
            </TouchableOpacity>
            {hikes.length > 0 && (
              <TouchableOpacity onPress={() => setShowHikeList(true)}>
                <Text style={styles.linkText}>Mes randos ({hikes.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.panelContent}>
            <View style={styles.panelRow}>
              <TextInput
                value={activeHike.name}
                onChangeText={(t) => updateHike(activeHike.id, { name: t })}
                style={styles.hikeName}
                placeholder="Nom de la rando"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowHikeList(true)} style={styles.listBtn}>
                <Ionicons name="list" size={22} color="#2D6A4F" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <StatChip label="Distance" value={formatDistance(distance)} />
              <StatChip label="Points" value={`${waypoints.length}`} />
              {waypoints.length >= 2 && (
                <TouchableOpacity
                  style={styles.fitBtn}
                  onPress={() => fitToBounds(waypoints)}
                >
                  <Ionicons name="scan-outline" size={16} color="#2D6A4F" />
                </TouchableOpacity>
              )}
            </View>

            {panelExpanded && (
              <View style={styles.expandedActions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={importGPX}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Importer un GPX</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() =>
                    Alert.alert("Supprimer", `Supprimer "${activeHike.name}" ?`, [
                      { text: "Annuler", style: "cancel" },
                      { text: "Supprimer", style: "destructive", onPress: () => deleteHike(activeHike.id) },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.dangerBtnText}>Supprimer cette rando</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* HIKE LIST MODAL */}
      <Modal
        visible={showHikeList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHikeList(false)}
      >
        <SafeAreaView style={styles.modalRoot} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mes randonnées</Text>
            <TouchableOpacity onPress={() => setShowHikeList(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { margin: 16 }]}
            onPress={() => {
              createHike(`Rando ${hikes.length + 1}`);
              setShowHikeList(false);
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Nouvelle rando</Text>
          </TouchableOpacity>

          <FlatList
            data={hikes}
            keyExtractor={(h) => h.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 24 }}
            renderItem={({ item }) => {
              const d = calculatePathDistance(
                item.waypoints.map((w) => ({ lat: w.lat, lon: w.lng })),
              );
              const isActive = item.id === activeHike?.id;
              return (
                <TouchableOpacity
                  style={[styles.hikeCard, isActive && styles.hikeCardActive]}
                  onPress={() => {
                    setActiveHike(item.id);
                    setShowHikeList(false);
                    setTimeout(() => fitToBounds(item.waypoints), 400);
                  }}
                >
                  <Ionicons
                    name="footsteps-outline"
                    size={20}
                    color={isActive ? "#fff" : "#2D6A4F"}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hikeCardName, isActive && { color: "#fff" }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.hikeCardSub, isActive && { color: "rgba(255,255,255,0.75)" }]}>
                      {item.waypoints.length} pts · {formatDistance(d)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteHike(item.id)}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={isActive ? "rgba(255,255,255,0.6)" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
  markerGreen: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#2D6A4F", borderWidth: 2, borderColor: "#fff",
  },
  markerRed: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff",
  },
  offlineBadge: {
    position: "absolute", top: 12, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)", flexDirection: "row",
    alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  offlineBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute", bottom: 200, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#2D6A4F", alignItems: "center", justifyContent: "center",
    elevation: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  panelHandle: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" },
  emptyPanel: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 4 },
  panelContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  panelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hikeName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1F2937" },
  listBtn: { padding: 6 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statChip: {
    backgroundColor: "#F0FDF4", borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: "center",
  },
  statChipValue: { fontSize: 14, fontWeight: "700", color: "#2D6A4F" },
  statChipLabel: { fontSize: 10, color: "#6B7280", marginTop: 1 },
  fitBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
  },
  expandedActions: { gap: 8, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#2D6A4F",
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  outlineBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1, borderColor: "#2D6A4F",
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
  },
  outlineBtnText: { color: "#2D6A4F", fontWeight: "600", fontSize: 14 },
  linkText: { textAlign: "center", color: "#2D6A4F", fontSize: 13, fontWeight: "500" },
  dangerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1, borderColor: "#FECACA",
    paddingVertical: 9, borderRadius: 10,
  },
  dangerBtnText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  modalRoot: { flex: 1, backgroundColor: "#F9FAFB" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  hikeCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  hikeCardActive: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  hikeCardName: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  hikeCardSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});
