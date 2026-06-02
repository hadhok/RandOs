"use client";

import { useState, useEffect } from "react";
import type { BoundingBox, POI, POIType } from "@randos/core";

type UsePOIResult = { pois: POI[]; loading: boolean };

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function mapElementToPOI(el: OverpassElement): POI | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  const tags = el.tags ?? {};
  let type: POIType | null = null;

  if (tags['amenity'] === 'drinking_water') type = 'water';
  else if (tags['tourism'] === 'alpine_hut') type = 'refuge';
  else if (tags['natural'] === 'peak') type = 'summit';
  else if (tags['tourism'] === 'viewpoint') type = 'viewpoint';

  if (!type) return null;

  const name = tags['name'] ?? type;
  const elevation = tags['ele'] ? parseFloat(tags['ele']) : undefined;

  return {
    id: `${el.type}/${el.id}`,
    lat,
    lng: lon,
    name,
    type,
    elevation: isNaN(elevation ?? NaN) ? undefined : elevation,
  };
}

export function usePOI(bbox: BoundingBox | null): UsePOIResult {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bbox) {
      setPois([]);
      return;
    }

    let cancelled = false;

    async function fetchPOIs() {
      if (!bbox) return;
      setLoading(true);
      const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
      const query = `[out:json][timeout:25];(node[amenity=drinking_water](${b});node[tourism=alpine_hut](${b});node[natural=peak](${b});node[tourism=viewpoint](${b}););out body;`;

      try {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { elements: OverpassElement[] };
        if (cancelled) return;
        const mapped = json.elements.map(mapElementToPOI).filter((p): p is POI => p !== null);
        setPois(mapped);
      } catch {
        if (!cancelled) setPois([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPOIs();
    return () => { cancelled = true; };
  }, [bbox?.north, bbox?.south, bbox?.east, bbox?.west]);

  return { pois, loading };
}
