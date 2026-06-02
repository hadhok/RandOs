"use client";

import { useState } from "react";
import type { RiskAssessment, RiskLevel } from "@randos/core";

const LEVEL_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  faible: { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
  modere: { bg: "#FEFCE8", text: "#A16207", border: "#FDE047" },
  eleve: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" },
  extreme: { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  faible: "Risque faible",
  modere: "Risque modéré",
  eleve: "Risque élevé",
  extreme: "Risque extrême",
};

const SEVERITY_ICONS: Record<string, string> = {
  ok: "✅",
  warning: "⚠️",
  danger: "🔴",
};

type Props = { assessment: RiskAssessment };

export default function RiskBadge({ assessment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colors = LEVEL_COLORS[assessment.level];

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.75rem",
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: "20px",
          cursor: "pointer",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, color: colors.text, fontSize: "0.8rem" }}>
          {LEVEL_LABELS[assessment.level]}
        </span>
        <span style={{ fontSize: "0.7rem", color: colors.text }}>
          Score: {assessment.score}/100 {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "0.35rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {assessment.factors.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.4rem 0.6rem",
                borderBottom: i < assessment.factors.length - 1 ? "1px solid #F3F4F6" : "none",
                backgroundColor: "#fff",
              }}
            >
              <span style={{ fontSize: "0.75rem" }}>{SEVERITY_ICONS[f.severity]}</span>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>{f.label}</div>
                <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{f.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
