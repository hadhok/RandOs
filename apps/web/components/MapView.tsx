"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { IGN_WMTS_URL, CARTO_TILE_URL } from "@randos/core";

const CARTO_TILE_URLS = [
  "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
];

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const ignFailedRef = useRef(false);

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
        layers: [
          {
            id: "ign-layer",
            type: "raster",
            source: "ign",
          },
        ],
      },
      center: [2.3522, 46.8566],
      zoom: 6,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("error", (e: { sourceId?: string }) => {
      if (!ignFailedRef.current && e.sourceId === "ign") {
        ignFailedRef.current = true;
        map.getStyle().layers.forEach((layer) => {
          if (layer.id === "ign-layer") {
            map.removeLayer("ign-layer");
          }
        });
        if (map.getSource("ign")) {
          map.removeSource("ign");
        }
        map.addSource("carto", {
          type: "raster",
          tiles: CARTO_TILE_URLS,
          tileSize: 256,
          attribution: "© CARTO © OpenStreetMap contributors",
        });
        map.addLayer({
          id: "carto-layer",
          type: "raster",
          source: "carto",
        });
      }
    });

    return () => map.remove();
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (data.length > 0 && data[0]) {
        mapRef.current.flyTo({
          center: [parseFloat(data[0].lon), parseFloat(data[0].lat)],
          zoom: 12,
        });
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />
      <form
        onSubmit={handleSearch}
        style={{
          position: "absolute",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          gap: "0.5rem",
          width: "min(400px, 90vw)",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une ville..."
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={searching}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2D6A4F",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {searching ? "..." : "OK"}
        </button>
      </form>
    </div>
  );
}
