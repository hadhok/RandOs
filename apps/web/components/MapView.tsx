"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { IGN_WMTS_URL } from "@randos/core";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
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

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
