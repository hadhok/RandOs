"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { computeTrackStats, exportToGPX, CARTO_TILE_URL } from "@randos/core";
import type { ActiveTrack, TrackPoint, WaypointNote } from "@randos/core";

const SESSION_KEY = "randos_active_track";
const HISTORY_KEY = "randos_tracks";

function loadActiveTrack(): ActiveTrack | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ActiveTrack) : null;
  } catch {
    return null;
  }
}

function saveActiveTrack(track: ActiveTrack) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(track));
}

function loadHistory(): ActiveTrack[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ActiveTrack[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(tracks: ActiveTrack[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(tracks));
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TrackingDashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<TrackPoint | null>(null);

  const [track, setTrack] = useState<ActiveTrack | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<WaypointNote["type"]>("info");
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Load from session on mount
  useEffect(() => {
    const saved = loadActiveTrack();
    if (saved) {
      setTrack(saved);
      setIsTracking(false);
    }
  }, []);

  // Init map
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [CARTO_TILE_URL],
            tileSize: 256,
            attribution: "© CARTO",
          },
        },
        layers: [{ id: "carto-layer", type: "raster", source: "carto" }],
      },
      center: [2.3522, 46.8566],
      zoom: 13,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("track", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "track-line",
        type: "line",
        source: "track",
        paint: { "line-color": "#EF4444", "line-width": 3 },
      });
      setMapReady(true);
    });

    return () => {
      map.remove();
      setMapReady(false);
    };
  }, []);

  // Update map when track changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource("track") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    if (track && track.points.length >= 2) {
      src.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: track.points.map((p) => [p.lng, p.lat]),
        },
        properties: {},
      });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [track, mapReady]);

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map) return;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 14px; height: 14px; background: #3B82F6;
          border-radius: 50%; border: 2px solid #fff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.4);
          animation: pulse 1.5s infinite;
        `;
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
      }
      map.easeTo({ center: [lng, lat] });
    },
    []
  );

  function startTracking() {
    const newTrack: ActiveTrack = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      points: [],
      notes: [],
    };
    setTrack(newTrack);
    saveActiveTrack(newTrack);
    setIsTracking(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, altitude } = pos.coords;
        const now = Date.now();
        const lastPt = lastPointRef.current;

        if (lastPt) {
          const dist = haversineMeters(lastPt.lat, lastPt.lng, lat, lng);
          if (dist < 5 && now - lastPt.timestamp < 5000) return;
        }

        const newPoint: TrackPoint = {
          lat,
          lng,
          timestamp: now,
          altitudeM: altitude ?? undefined,
        };

        lastPointRef.current = newPoint;
        setCurrentPos({ lat, lng });
        updateMarker(lat, lng);

        setTrack((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, points: [...prev.points, newPoint] };
          saveActiveTrack(updated);
          return updated;
        });
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    watchIdRef.current = id;
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    if (track && track.points.length > 0) {
      const history = loadHistory();
      saveHistory([track, ...history].slice(0, 100));
    }
  }

  function addNote() {
    if (!noteText || !currentPos) return;
    const note: WaypointNote = {
      id: crypto.randomUUID(),
      lat: currentPos.lat,
      lng: currentPos.lng,
      timestamp: Date.now(),
      note: noteText,
      type: noteType,
    };
    setTrack((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, notes: [...prev.notes, note] };
      saveActiveTrack(updated);
      return updated;
    });
    setNoteText("");
    setShowNoteModal(false);
  }

  function downloadGPX() {
    if (!track) return;
    const name = `Track-${new Date(track.startTime).toLocaleDateString("fr-FR")}`;
    const gpx = exportToGPX(track, name);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = track ? computeTrackStats(track) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />

        {/* Controls overlay */}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: "0.5rem", zIndex: 10 }}>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            style={{
              padding: "0.6rem 1.25rem",
              backgroundColor: isTracking ? "#EF4444" : "#22C55E",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.875rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {isTracking ? "⏹ STOP" : "▶ START"}
          </button>
          {track && !isTracking && (
            <button
              onClick={() => {
                setTrack(null);
                sessionStorage.removeItem(SESSION_KEY);
              }}
              style={{
                padding: "0.6rem 1rem",
                backgroundColor: "#6B7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              Nouveau
            </button>
          )}
          {isTracking && (
            <button
              onClick={() => setShowNoteModal(true)}
              style={{
                padding: "0.6rem 1rem",
                backgroundColor: "#3B82F6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              + Note
            </button>
          )}
          {track && track.points.length > 0 && (
            <button
              onClick={downloadGPX}
              style={{
                padding: "0.6rem 1rem",
                backgroundColor: "#8B5CF6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              GPX
            </button>
          )}
        </div>
      </div>

      {/* Dashboard tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          backgroundColor: "#1F2937",
          padding: "1rem",
          gap: "0.75rem",
        }}
      >
        {[
          { label: "Vitesse", value: stats ? `${stats.avgSpeedKmh.toFixed(1)}` : "0.0", unit: "km/h" },
          { label: "D+", value: stats ? `${Math.round(stats.elevationGainM)}` : "0", unit: "m" },
          { label: "Distance", value: stats ? `${stats.distanceKm.toFixed(2)}` : "0.00", unit: "km" },
          {
            label: "Durée",
            value: stats
              ? (() => {
                  const h = Math.floor(stats.durationMinutes / 60);
                  const m = Math.floor(stats.durationMinutes % 60);
                  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
                })()
              : "0min",
            unit: "",
          },
        ].map((tile) => (
          <div
            key={tile.label}
            style={{
              backgroundColor: "#374151",
              borderRadius: "8px",
              padding: "0.75rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.65rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {tile.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F9FAFB", lineHeight: 1.2 }}>
              {tile.value}
            </div>
            {tile.unit && <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{tile.unit}</div>}
          </div>
        ))}
      </div>

      {/* Note modal */}
      {showNoteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "1.5rem",
              width: 360,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem" }}>Ajouter une note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Votre note..."
              rows={3}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                fontSize: "0.875rem",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as WaypointNote["type"])}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                padding: "0.5rem",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                fontSize: "0.875rem",
              }}
            >
              <option value="info">Info</option>
              <option value="warning">Avertissement</option>
              <option value="photo">Photo</option>
            </select>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{ padding: "0.5rem 1rem", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", background: "#fff" }}
              >
                Annuler
              </button>
              <button
                onClick={addNote}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#2D6A4F", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
