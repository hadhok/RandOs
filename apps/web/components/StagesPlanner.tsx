"use client";

import { useState } from "react";
import { computeStages } from "@randos/core";
import type { HikerLevel } from "@randos/core";
import { useHikeStore } from "../hooks/useHikeStore";

const LEVELS: { value: HikerLevel; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "intermediaire", label: "Intermédiaire" },
  { value: "expert", label: "Expert" },
];

function stageColor(hours: number): string {
  if (hours <= 5) return "#22C55E";
  if (hours <= 7) return "#F59E0B";
  return "#EF4444";
}

export default function StagesPlanner() {
  const { activeHike } = useHikeStore();
  const [level, setLevel] = useState<HikerLevel>("intermediaire");

  if (!activeHike || activeHike.waypoints.length < 2) {
    return (
      <div style={{ padding: "1rem", color: "#6B7280", fontSize: "0.875rem" }}>
        Ajoutez des points sur la carte pour planifier vos étapes
      </div>
    );
  }

  const elevationGainPerSegment = new Array<number>(activeHike.waypoints.length - 1).fill(0);
  const stages = computeStages(activeHike.waypoints, elevationGainPerSegment, level);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLevel(l.value)}
            style={{
              flex: 1,
              padding: "0.4rem 0.5rem",
              border: "1px solid",
              borderColor: level === l.value ? "#2D6A4F" : "#E5E7EB",
              borderRadius: "6px",
              backgroundColor: level === l.value ? "#2D6A4F" : "#fff",
              color: level === l.value ? "#fff" : "#374151",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: level === l.value ? 700 : 400,
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {stages.map((stage) => {
          const color = stageColor(stage.estimatedDurationH);
          return (
            <div
              key={stage.day}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    flexShrink: 0,
                  }}
                >
                  J{stage.day}
                </div>
                {stage.day < stages.length && (
                  <div style={{ width: 2, flex: 1, minHeight: 16, backgroundColor: "#E5E7EB" }} />
                )}
              </div>
              <div style={{ paddingTop: "0.35rem", fontSize: "0.8rem" }}>
                <div style={{ fontWeight: 600, color: "#1F2937" }}>
                  WP#{stage.startIndex + 1} → WP#{stage.endIndex + 1}
                </div>
                <div style={{ color: "#6B7280" }}>
                  {stage.distanceKm.toFixed(1)}km · ~{stage.estimatedDurationH.toFixed(1)}h · D+{Math.round(stage.elevationGainM)}m
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
