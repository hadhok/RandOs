"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { POI_ICONS } from "@randos/core";
import type { BoundingBox } from "@randos/core";
import { usePOI } from "../hooks/usePOI";

type Props = {
  map: maplibregl.Map | null;
  bbox: BoundingBox | null;
};

export default function POILayer({ map, bbox }: Props) {
  const { pois } = usePOI(bbox);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const poi of pois) {
      const el = document.createElement("div");
      el.style.fontSize = "1.25rem";
      el.style.cursor = "pointer";
      el.style.lineHeight = "1";
      el.textContent = POI_ICONS[poi.type];

      const popupContent = [
        `<strong>${poi.name}</strong>`,
        `Type: ${poi.type}`,
        poi.elevation !== undefined ? `Altitude: ${Math.round(poi.elevation)}m` : null,
      ]
        .filter(Boolean)
        .join("<br/>");

      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lng, poi.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, pois]);

  return null;
}
