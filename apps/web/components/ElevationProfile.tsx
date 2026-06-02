"use client";

import { useState } from "react";
import type { ElevationPoint } from "@randos/core";
import type { calculateStats } from "@randos/core";

type Props = {
  points: ElevationPoint[];
  stats: ReturnType<typeof calculateStats>;
};

export default function ElevationProfile({ points, stats }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; elevation: number } | null>(null);

  if (points.length === 0) return null;

  const W = 240;
  const H = 100;
  const paddingLeft = 36;
  const paddingBottom = 20;
  const paddingTop = 8;
  const paddingRight = 8;
  const chartW = W - paddingLeft - paddingRight;
  const chartH = H - paddingBottom - paddingTop;

  const minDist = points[0]!.distance;
  const maxDist = points[points.length - 1]!.distance;
  const distRange = maxDist - minDist || 1;

  const minElev = stats.minElevation;
  const maxElev = stats.maxElevation;
  const elevRange = maxElev - minElev || 1;

  function toX(d: number) {
    return paddingLeft + ((d - minDist) / distRange) * chartW;
  }
  function toY(e: number) {
    return paddingTop + chartH - ((e - minElev) / elevRange) * chartH;
  }

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.distance).toFixed(1)},${toY(p.elevation).toFixed(1)}`).join(" ");
  const fillData = `${pathData} L${toX(maxDist).toFixed(1)},${(paddingTop + chartH).toFixed(1)} L${toX(minDist).toFixed(1)},${(paddingTop + chartH).toFixed(1)} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = svgX - paddingLeft;
    if (relX < 0 || relX > chartW) { setTooltip(null); return; }
    const frac = relX / chartW;
    const targetDist = minDist + frac * distRange;
    let closest = points[0]!;
    let minGap = Infinity;
    for (const p of points) {
      const gap = Math.abs(p.distance - targetDist);
      if (gap < minGap) { minGap = gap; closest = p; }
    }
    setTooltip({ x: toX(closest.distance), y: toY(closest.elevation), elevation: closest.elevation });
  }

  const yTicks = [minElev, (minElev + maxElev) / 2, maxElev];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.25rem" }}>
        Profil altimétrique
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <path d={fillData} fill="rgba(45,106,79,0.2)" />
        <path d={pathData} fill="none" stroke="#2D6A4F" strokeWidth={1.5} />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={paddingLeft} y1={toY(tick)} x2={W - paddingRight} y2={toY(tick)} stroke="#E5E7EB" strokeWidth={0.5} />
            <text x={paddingLeft - 2} y={toY(tick) + 3} textAnchor="end" fontSize={7} fill="#9CA3AF">
              {Math.round(tick)}
            </text>
          </g>
        ))}
        <text x={paddingLeft} y={H - 4} textAnchor="start" fontSize={7} fill="#9CA3AF">
          {minDist.toFixed(1)}km
        </text>
        <text x={W - paddingRight} y={H - 4} textAnchor="end" fontSize={7} fill="#9CA3AF">
          {maxDist.toFixed(1)}km
        </text>
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={paddingTop} x2={tooltip.x} y2={paddingTop + chartH} stroke="#374151" strokeWidth={0.8} strokeDasharray="2,2" />
            <circle cx={tooltip.x} cy={tooltip.y} r={3} fill="#2D6A4F" />
            <rect
              x={tooltip.x + 4}
              y={tooltip.y - 14}
              width={42}
              height={14}
              rx={3}
              fill="#1F2937"
              opacity={0.85}
            />
            <text x={tooltip.x + 7} y={tooltip.y - 3} fontSize={8} fill="#fff">
              {Math.round(tooltip.elevation)}m
            </text>
          </>
        )}
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
        {[
          { label: "D+", value: `${Math.round(stats.elevationGain)}m` },
          { label: "D-", value: `${Math.round(stats.elevationLoss)}m` },
          { label: "Max", value: `${Math.round(stats.maxElevation)}m` },
          { label: "Min", value: `${Math.round(stats.minElevation)}m` },
        ].map((badge) => (
          <div
            key={badge.label}
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: "6px",
              padding: "0.3rem 0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.65rem", color: "#6B7280" }}>{badge.label}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2D6A4F" }}>{badge.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
