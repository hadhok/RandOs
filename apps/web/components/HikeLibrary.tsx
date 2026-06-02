"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculatePathDistance } from "@randos/core";
import { useHikeStore } from "../hooks/useHikeStore";

type SortKey = "date" | "distance";

export default function HikeLibrary() {
  const { hikes, deleteHike } = useHikeStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    let list = hikes.filter((h) =>
      h.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sortKey === "date") {
      list = list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list = list.sort((a, b) => {
        const distA = calculatePathDistance(a.waypoints.map((w) => ({ lat: w.lat, lon: w.lng })));
        const distB = calculatePathDistance(b.waypoints.map((w) => ({ lat: w.lat, lon: w.lng })));
        return distB - distA;
      });
    }
    return list;
  }, [hikes, search, sortKey]);

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          placeholder="Rechercher par nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "0.5rem 0.75rem",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            fontSize: "0.875rem",
          }}
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            padding: "0.5rem",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            fontSize: "0.875rem",
          }}
        >
          <option value="date">Trier par date</option>
          <option value="distance">Trier par distance</option>
        </select>
        <Link
          href="/preparer"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2D6A4F",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          + Nouvelle rando
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🥾</div>
          {hikes.length === 0 ? (
            <>
              <p>Aucune randonnée enregistrée.</p>
              <Link
                href="/preparer"
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "#2D6A4F",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Créer ma première rando
              </Link>
            </>
          ) : (
            <p>Aucune rando ne correspond à votre recherche.</p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtered.map((hike) => {
            const distM = calculatePathDistance(
              hike.waypoints.map((w) => ({ lat: w.lat, lon: w.lng }))
            );
            const distKm = (distM / 1000).toFixed(2);
            const date = new Date(hike.createdAt).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={hike.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  padding: "1rem",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>{hike.name}</h3>
                <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.75rem", display: "flex", gap: "1rem" }}>
                  <span>{date}</span>
                  <span>{distKm} km</span>
                  <span>{hike.waypoints.length} pts</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => router.push(`/preparer?hikeId=${hike.id}`)}
                    style={{
                      flex: 1,
                      padding: "0.4rem",
                      backgroundColor: "#2D6A4F",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    Ouvrir
                  </button>
                  {confirmDeleteId === hike.id ? (
                    <>
                      <button
                        onClick={() => { deleteHike(hike.id); setConfirmDeleteId(null); }}
                        style={{
                          padding: "0.4rem 0.75rem",
                          backgroundColor: "#EF4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{
                          padding: "0.4rem",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          cursor: "pointer",
                          background: "#fff",
                          fontSize: "0.8rem",
                        }}
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(hike.id)}
                      style={{
                        padding: "0.4rem 0.75rem",
                        border: "1px solid #FECACA",
                        backgroundColor: "#FEF2F2",
                        color: "#EF4444",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
