"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMouseEvent } from "maplibre-gl";
import { IGN_WMTS_URL, CARTO_TILE_URL, calculatePathDistance, formatDistance } from "@randos/core";
import { useHikeStore } from "../hooks/useHikeStore";

export default function HikeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const ignFailedRef = useRef(false);

  const { hikes, activeHike, createHike, updateHike, deleteHike, setActiveHike } = useHikeStore();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {
          ign: {
            type: "raster",
            tiles: [IGN_WMTS_URL],
            tileSize: 256,
            attribution: "© IGN Géoportail",
          },
        },
        layers: [{ id: "ign-layer", type: "raster", source: "ign" }],
      },
      center: [2.3522, 46.8566],
      zoom: 6,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("error", (e: { sourceId?: string }) => {
      if (!ignFailedRef.current && e.sourceId === "ign") {
        ignFailedRef.current = true;
        try {
          map.removeLayer("ign-layer");
          map.removeSource("ign");
        } catch {}
        map.addSource("carto", {
          type: "raster",
          tiles: [CARTO_TILE_URL],
          tileSize: 256,
          attribution: "© CARTO",
        });
        map.addLayer({ id: "carto-layer", type: "raster", source: "carto" });
      }
    });

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#2D6A4F", "line-width": 3 },
      });
    });

    map.on("click", (e: MapMouseEvent) => {
      const { lat, lng } = e.lngLat;
      const activeId = (map as maplibregl.Map & { _activeHikeId?: string })._activeHikeId;
      if (!activeId) return;

      const marker = new maplibregl.Marker({ color: "#3B82F6" })
        .setLngLat([lng, lat])
        .addTo(map);
      markersRef.current.push(marker);

      const currentWaypoints = (map as maplibregl.Map & { _waypoints?: Array<{ lat: number; lng: number }> })._waypoints ?? [];
      const newWaypoints = [...currentWaypoints, { lat, lng }];
      (map as maplibregl.Map & { _waypoints?: Array<{ lat: number; lng: number }> })._waypoints = newWaypoints;

      updateHike(activeId, { waypoints: newWaypoints });

      if (newWaypoints.length >= 2) {
        const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
        source?.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: newWaypoints.map((wp) => [wp.lng, wp.lat]),
          },
          properties: {},
        });
      }
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map as maplibregl.Map & { _activeHikeId?: string })._activeHikeId = activeHike?.id ?? undefined;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const waypoints = activeHike?.waypoints ?? [];
    (map as maplibregl.Map & { _waypoints?: Array<{ lat: number; lng: number }> })._waypoints = waypoints;

    waypoints.forEach((wp) => {
      const marker = new maplibregl.Marker({ color: "#3B82F6" })
        .setLngLat([wp.lng, wp.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (map.isStyleLoaded()) {
      const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        if (waypoints.length >= 2) {
          source.setData({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: waypoints.map((wp) => [wp.lng, wp.lat]),
            },
            properties: {},
          });
        } else {
          source.setData({ type: "FeatureCollection", features: [] });
        }
      }
    }
  }, [activeHike]);

  const distance = activeHike
    ? calculatePathDistance(activeHike.waypoints.map((wp) => ({ lat: wp.lat, lon: wp.lng })))
    : 0;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>

      <aside
        style={{
          width: 280,
          backgroundColor: "#fff",
          borderLeft: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => createHike(`Rando ${hikes.length + 1}`)}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: "#2D6A4F",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Nouvelle rando
          </button>
          <button
            onClick={() => {
              if (activeHike) updateHike(activeHike.id, {});
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: "#1F2937",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Sauvegarder
          </button>
        </div>

        {hikes.length === 0 && (
          <div style={{ padding: "1rem", color: "#6B7280", fontSize: "0.875rem" }}>
            Créez une nouvelle rando pour commencer.
          </div>
        )}

        {activeHike && (
          <div style={{ flex: 1, overflow: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "0.25rem" }}>
                Nom de la rando
              </label>
              <input
                value={activeHike.name}
                onChange={(e) => updateHike(activeHike.id, { name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: "8px",
                padding: "0.75rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Distance</div>
                <div style={{ fontWeight: 700, color: "#2D6A4F" }}>{formatDistance(distance)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>D+</div>
                <div style={{ fontWeight: 700, color: "#2D6A4F" }}>0 m</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Points</div>
                <div style={{ fontWeight: 700, color: "#2D6A4F" }}>{activeHike.waypoints.length}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
                Waypoints
              </div>
              {activeHike.waypoints.length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>Cliquez sur la carte pour ajouter des points.</p>
              )}
              {activeHike.waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.4rem 0",
                    borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: "#3B82F6",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "#374151" }}>
                    {wp.name ?? `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}
                  </span>
                  <button
                    onClick={() => {
                      const newWaypoints = activeHike.waypoints.filter((_, i) => i !== idx);
                      updateHike(activeHike.id, { waypoints: newWaypoints });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {hikes.length > 1 && (
          <div style={{ padding: "1rem", borderTop: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
              Mes randos
            </div>
            {hikes.map((hike) => (
              <div
                key={hike.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0",
                }}
              >
                <button
                  onClick={() => setActiveHike(hike.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: hike.id === activeHike?.id ? 700 : 400,
                    color: hike.id === activeHike?.id ? "#2D6A4F" : "#374151",
                  }}
                >
                  {hike.name}
                </button>
                <button
                  onClick={() => deleteHike(hike.id)}
                  style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
