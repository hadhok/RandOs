"use client";

import { useState, useEffect } from "react";
import { interpolateElevation } from "@randos/core";
import type { ElevationPoint } from "@randos/core";

type Waypoint = { lat: number; lng: number };

type UseElevationResult = {
  data: ElevationPoint[] | null;
  loading: boolean;
  error: string | null;
};

export function useElevation(waypoints: Waypoint[]): UseElevationResult {
  const [data, setData] = useState<ElevationPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (waypoints.length < 2) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function fetchElevation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locations: waypoints.map((wp) => ({ latitude: wp.lat, longitude: wp.lng })),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { results: { latitude: number; longitude: number; elevation: number }[] };
        if (cancelled) return;

        const results = json.results;
        let cumulativeDist = 0;
        const raw: ElevationPoint[] = results.map((r, i) => {
          if (i > 0) {
            const prev = results[i - 1]!;
            const R = 6371;
            const toRad = (d: number) => (d * Math.PI) / 180;
            const dLat = toRad(r.latitude - prev.latitude);
            const dLng = toRad(r.longitude - prev.longitude); // unused but kept for clarity
            void dLng;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(prev.latitude)) *
                Math.cos(toRad(r.latitude)) *
                Math.sin(toRad(r.longitude - prev.longitude) / 2) ** 2;
            cumulativeDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          }
          return { distance: cumulativeDist, elevation: r.elevation };
        });

        setData(interpolateElevation(raw));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchElevation();
    return () => { cancelled = true; };
  }, [JSON.stringify(waypoints)]);

  return { data, loading, error };
}
