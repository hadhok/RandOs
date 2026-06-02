"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { computeTrackStats, exportToGPX, CARTO_TILE_URL } from "@randos/core";
import type { ActiveTrack } from "@randos/core";

const HISTORY_KEY = "randos_tracks";

function loadTrack(id: string): ActiveTrack | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const tracks = raw ? (JSON.parse(raw) as ActiveTrack[]) : [];
    return tracks.find((t) => t.id === id) ?? null;
  } catch {
    return null;
  }
}

export default function TrackSummary({ id }: { id: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [track, setTrack] = useState<ActiveTrack | null>(null);

  useEffect(() => {
    setTrack(loadTrack(id));
  }, [id]);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || !track) return;

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
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (track.points.length >= 2) {
        map.addSource("track", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: track.points.map((p) => [p.lng, p.lat]),
            },
            properties: {},
          },
        });
        map.addLayer({
          id: "track-line",
          type: "line",
          source: "track",
          paint: { "line-color": "#3B82F6", "line-width": 3 },
        });

        // Fit bounds
        const lngs = track.points.map((p) => p.lng);
        const lats = track.points.map((p) => p.lat);
        const bounds: [number, number, number, number] = [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats),
        ];
        map.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => map.remove();
  }, [track]);

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

  if (!track) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF" }}>
        Track introuvable.
        <br />
        <Link href="/bilan" style={{ color: "#2D6A4F" }}>
          Retour aux bilans
        </Link>
      </div>
    );
  }

  const stats = computeTrackStats(track);
  const date = new Date(track.startTime).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Compute elevation loss
  let elevLoss = 0;
  let maxAlt = -Infinity;
  for (let i = 1; i < track.points.length; i++) {
    const prev = track.points[i - 1]!;
    const curr = track.points[i]!;
    if (curr.altitudeM !== undefined && prev.altitudeM !== undefined) {
      const diff = prev.altitudeM - curr.altitudeM;
      if (diff > 0) elevLoss += diff;
      if (curr.altitudeM > maxAlt) maxAlt = curr.altitudeM;
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Bilan de sortie</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.875rem" }}>{date}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={downloadGPX}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#8B5CF6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Exporter GPX
          </button>
          <Link
            href="/bilan"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#F3F4F6",
              color: "#374151",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Retour aux bilans
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Distance", value: `${stats.distanceKm.toFixed(2)} km` },
          {
            label: "Durée",
            value: (() => {
              const h = Math.floor(stats.durationMinutes / 60);
              const m = Math.floor(stats.durationMinutes % 60);
              return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;
            })(),
          },
          { label: "Vitesse moy.", value: `${stats.avgSpeedKmh.toFixed(1)} km/h` },
          { label: "D+", value: `${Math.round(stats.elevationGainM)} m` },
          { label: "D-", value: `${Math.round(elevLoss)} m` },
          { label: "Alt. max", value: maxAlt === -Infinity ? "N/A" : `${Math.round(maxAlt)} m` },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: "8px",
              padding: "0.75rem",
              border: "1px solid #D1FAE5",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{s.label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2D6A4F" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        style={{ height: 350, borderRadius: "10px", overflow: "hidden", border: "1px solid #E5E7EB", marginBottom: "1.5rem" }}
      />

      {/* Notes */}
      {track.notes.length > 0 && (
        <div>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Notes ({track.notes.length})
          </h3>
          {track.notes.map((note) => (
            <div
              key={note.id}
              style={{
                padding: "0.6rem 0.75rem",
                backgroundColor: note.type === "warning" ? "#FFF7ED" : "#F9FAFB",
                border: `1px solid ${note.type === "warning" ? "#FED7AA" : "#E5E7EB"}`,
                borderRadius: "6px",
                marginBottom: "0.35rem",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ marginRight: "0.5rem" }}>
                {note.type === "info" ? "ℹ️" : note.type === "warning" ? "⚠️" : "📷"}
              </span>
              {note.note}
              <span style={{ marginLeft: "0.75rem", fontSize: "0.7rem", color: "#9CA3AF" }}>
                {new Date(note.timestamp).toLocaleTimeString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
