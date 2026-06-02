import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { IGN_WMTS_URL } from "@randos/core";
import { useNetworkStatus } from "../../../hooks/useNetworkStatus";

MapLibreGL.setAccessToken(null);

export default function PrepareScreen() {
  const { isOnline } = useNetworkStatus();

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={styles.map} logoEnabled={false}>
        <MapLibreGL.Camera zoomLevel={10} centerCoordinate={[2.3522, 46.8566]} />
        <MapLibreGL.RasterSource
          id="ignSource"
          tileUrlTemplates={[IGN_WMTS_URL]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer id="ignLayer" sourceID="ignSource" />
        </MapLibreGL.RasterSource>
      </MapLibreGL.MapView>

      {!isOnline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>Offline</Text>
        </View>
      )}

      <TouchableOpacity style={styles.fab} disabled>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  offlineBadge: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
  },
});
