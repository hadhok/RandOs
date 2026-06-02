"use client";

import { useEffect, useState } from "react";
import {
  calculateTotalCalories,
  calculateFoodWeightGrams,
  DEFAULT_RATIONS,
} from "@randos/core";
import type { ResupplyPoint } from "@randos/core";

const STORAGE_KEY = "randos_resupply";

const TYPE_LABELS: Record<ResupplyPoint["type"], string> = {
  village: "Village",
  superette: "Supérette",
  source: "Source",
  refuge: "Refuge",
};

const TYPE_ICONS: Record<ResupplyPoint["type"], string> = {
  village: "🏘️",
  superette: "🛒",
  source: "💧",
  refuge: "🏠",
};

interface ResupplyState {
  days: number;
  totalDistanceKm: number;
  points: ResupplyPoint[];
}

function load(): ResupplyState {
  if (typeof window === "undefined")
    return { days: 3, totalDistanceKm: 50, points: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as ResupplyState)
      : { days: 3, totalDistanceKm: 50, points: [] };
  } catch {
    return { days: 3, totalDistanceKm: 50, points: [] };
  }
}

function save(state: ResupplyState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ResupplyPlanner() {
  const [state, setState] = useState<ResupplyState>({ days: 3, totalDistanceKm: 50, points: [] });
  const [showModal, setShowModal] = useState(false);
  const [newPoint, setNewPoint] = useState<{ name: string; distanceKm: string; type: ResupplyPoint["type"]; notes: string }>({
    name: "",
    distanceKm: "",
    type: "village",
    notes: "",
  });

  useEffect(() => {
    setState(load());
  }, []);

  function update(patch: Partial<ResupplyState>) {
    const updated = { ...state, ...patch };
    setState(updated);
    save(updated);
  }

  function addPoint() {
    if (!newPoint.name || !newPoint.distanceKm) return;
    const point: ResupplyPoint = {
      id: crypto.randomUUID(),
      name: newPoint.name,
      distanceKm: parseFloat(newPoint.distanceKm),
      type: newPoint.type,
      notes: newPoint.notes || undefined,
    };
    const sortedPoints = [...state.points, point].sort((a, b) => a.distanceKm - b.distanceKm);
    update({ points: sortedPoints });
    setShowModal(false);
    setNewPoint({ name: "", distanceKm: "", type: "village", notes: "" });
  }

  function removePoint(id: string) {
    update({ points: state.points.filter((p) => p.id !== id) });
  }

  const sortedPoints = [...state.points].sort((a, b) => a.distanceKm - b.distanceKm);

  // Compute segments: from 0 to first point, between points, from last to end
  const checkpoints = [
    { id: "start", name: "Départ", distanceKm: 0, type: "village" as ResupplyPoint["type"] },
    ...sortedPoints,
    { id: "end", name: "Arrivée", distanceKm: state.totalDistanceKm, type: "village" as ResupplyPoint["type"] },
  ];

  const segments = checkpoints.slice(1).map((cp, i) => {
    const prev = checkpoints[i]!;
    const segDistKm = cp.distanceKm - prev.distanceKm;
    const segDays = state.totalDistanceKm > 0 ? (segDistKm / state.totalDistanceKm) * state.days : 0;
    const calories = calculateTotalCalories(segDays, DEFAULT_RATIONS);
    const foodWeightKg = calculateFoodWeightGrams(calories) / 1000;
    return {
      from: prev.name,
      to: cp.name,
      distKm: segDistKm,
      days: segDays,
      foodWeightKg,
    };
  });

  const totalCalories = calculateTotalCalories(state.days, DEFAULT_RATIONS);
  const totalFoodKg = calculateFoodWeightGrams(totalCalories) / 1000;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem" }}>
      {/* Inputs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.25rem" }}>
            Nombre de jours
          </label>
          <input
            type="number"
            value={state.days}
            min={1}
            onChange={(e) => update({ days: Number(e.target.value) })}
            style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", width: 100, fontSize: "0.875rem" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.25rem" }}>
            Distance totale (km)
          </label>
          <input
            type="number"
            value={state.totalDistanceKm}
            min={1}
            onChange={(e) => update({ totalDistanceKm: Number(e.target.value) })}
            style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", width: 120, fontSize: "0.875rem" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2D6A4F",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Ajouter un point
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { label: "Jours", value: state.days },
          { label: "Calories totales", value: `${Math.round(totalCalories)} kcal` },
          { label: "Poids nourriture", value: `${totalFoodKg.toFixed(1)} kg` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              border: "1px solid #D1FAE5",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>{stat.label}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2D6A4F" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", marginBottom: "1rem" }}>
          Timeline de ravitaillement
        </h3>
        <div style={{ position: "relative", height: 80, backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "visible" }}>
          {/* Progress bar */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 4, backgroundColor: "#D1D5DB", transform: "translateY(-50%)" }} />
          {/* Points */}
          {checkpoints.map((cp) => {
            const pct = state.totalDistanceKm > 0 ? (cp.distanceKm / state.totalDistanceKm) * 100 : 0;
            const isEndpoint = cp.id === "start" || cp.id === "end";
            return (
              <div
                key={cp.id}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: isEndpoint ? 14 : 18,
                    height: isEndpoint ? 14 : 18,
                    borderRadius: "50%",
                    backgroundColor: isEndpoint ? "#6B7280" : "#2D6A4F",
                    border: "2px solid #fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                  }}
                >
                  {!isEndpoint && TYPE_ICONS[cp.type as ResupplyPoint["type"]]}
                </div>
                <div style={{ marginTop: 4, fontSize: "0.65rem", color: "#374151", whiteSpace: "nowrap", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cp.name}
                </div>
                <div style={{ fontSize: "0.6rem", color: "#9CA3AF" }}>{cp.distanceKm.toFixed(0)} km</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segments */}
      {segments.length > 0 && (
        <div>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", marginBottom: "0.75rem" }}>
            Segments
          </h3>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                backgroundColor: "#FAFAFA",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                marginBottom: "0.5rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {seg.from} → {seg.to}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  {seg.distKm.toFixed(1)} km — {seg.days.toFixed(1)} jour(s)
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2D6A4F" }}>
                  {seg.foodWeightKg.toFixed(2)} kg
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>nourriture</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resupply points list */}
      {state.points.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", marginBottom: "0.75rem" }}>
            Points de ravitaillement
          </h3>
          {sortedPoints.map((pt) => (
            <div
              key={pt.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.75rem",
                backgroundColor: "#FAFAFA",
                borderRadius: "6px",
                border: "1px solid #E5E7EB",
                marginBottom: "0.35rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>{TYPE_ICONS[pt.type]}</span>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{pt.name}</div>
                  {pt.notes && <div style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>{pt.notes}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{pt.distanceKm} km</span>
                <span
                  style={{
                    padding: "0.15rem 0.5rem",
                    backgroundColor: "#F0FDF4",
                    color: "#2D6A4F",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}
                >
                  {TYPE_LABELS[pt.type]}
                </span>
                <button
                  onClick={() => removePoint(pt.id)}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "1.1rem" }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
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
            <h3 style={{ margin: "0 0 1rem" }}>Nouveau point de ravitaillement</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                placeholder="Nom du point"
                value={newPoint.name}
                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.875rem" }}
              />
              <input
                type="number"
                placeholder="Distance (km)"
                value={newPoint.distanceKm}
                onChange={(e) => setNewPoint({ ...newPoint, distanceKm: e.target.value })}
                style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.875rem" }}
              />
              <select
                value={newPoint.type}
                onChange={(e) => setNewPoint({ ...newPoint, type: e.target.value as ResupplyPoint["type"] })}
                style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.875rem" }}
              >
                {(Object.keys(TYPE_LABELS) as ResupplyPoint["type"][]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <input
                placeholder="Notes (optionnel)"
                value={newPoint.notes}
                onChange={(e) => setNewPoint({ ...newPoint, notes: e.target.value })}
                style={{ padding: "0.5rem", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.875rem" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: "0.5rem 1rem", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", background: "#fff" }}
                >
                  Annuler
                </button>
                <button
                  onClick={addPoint}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#2D6A4F", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
