"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeTrackStats } from "@randos/core";
import type { ActiveTrack } from "@randos/core";

const HISTORY_KEY = "randos_tracks";

function loadHistory(): ActiveTrack[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ActiveTrack[]) : [];
  } catch {
    return [];
  }
}

export default function BilanPage() {
  const [tracks, setTracks] = useState<ActiveTrack[]>([]);

  useEffect(() => {
    setTracks(loadHistory());
  }, []);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#2D6A4F" }}>
          Bilans de sorties
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.875rem" }}>
          Historique de vos randonnées enregistrées
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem" }}>
        {tracks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
            <p>Aucune sortie enregistrée.</p>
            <Link
              href="/enroute"
              style={{
                padding: "0.6rem 1.25rem",
                backgroundColor: "#2D6A4F",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Commencer une rando
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {tracks.map((track) => {
              const stats = computeTrackStats(track);
              const date = new Date(track.startTime).toLocaleDateString("fr-FR", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const h = Math.floor(stats.durationMinutes / 60);
              const m = Math.floor(stats.durationMinutes % 60);
              const duration = h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m}min`;

              return (
                <div
                  key={track.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{date}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6B7280", display: "flex", gap: "1rem" }}>
                      <span>{stats.distanceKm.toFixed(2)} km</span>
                      <span>{duration}</span>
                      <span>D+ {Math.round(stats.elevationGainM)} m</span>
                    </div>
                  </div>
                  <Link
                    href={`/bilan/${track.id}`}
                    style={{
                      padding: "0.4rem 0.9rem",
                      backgroundColor: "#F0FDF4",
                      color: "#2D6A4F",
                      border: "1px solid #D1FAE5",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    Voir le bilan
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
