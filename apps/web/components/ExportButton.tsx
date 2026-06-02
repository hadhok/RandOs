"use client";

import { useRef, useState } from "react";
import { generateShareableLink, generateTextSummary, exportToGPX } from "@randos/core";
import type { Hike } from "../hooks/useHikeStore";

interface ExportButtonProps {
  hike: Hike;
  elevationGainM?: number;
  distanceKm?: number;
}

export default function ExportButton({ hike, elevationGainM = 0, distanceKm = 0 }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function copyTextSummary() {
    const text = generateTextSummary({
      name: hike.name,
      waypoints: hike.waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
      distanceKm,
      elevationGainM,
    });
    await navigator.clipboard.writeText(text);
    showToast("Résumé copié !");
    setOpen(false);
  }

  function downloadGPX() {
    if (hike.waypoints.length === 0) return;
    const activeTrack = {
      id: hike.id,
      startTime: new Date(hike.createdAt).getTime(),
      points: hike.waypoints.map((w) => ({
        lat: w.lat,
        lng: w.lng,
        timestamp: new Date(hike.createdAt).getTime(),
      })),
      notes: [],
    };
    const gpx = exportToGPX(activeTrack, hike.name);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${hike.name}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  async function copyShareLink() {
    const link = generateShareableLink(hike.id, window.location.origin);
    await navigator.clipboard.writeText(link);
    showToast("Lien copié !");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "0.5rem",
          backgroundColor: "#F3F4F6",
          color: "#374151",
          border: "1px solid #E5E7EB",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.8rem",
        }}
      >
        Exporter / Partager
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {[
            { label: "Copier le résumé", action: copyTextSummary },
            { label: "Exporter GPX", action: downloadGPX, disabled: hike.waypoints.length === 0 },
            { label: "Lien de partage", action: copyShareLink },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.disabled}
              style={{
                display: "block",
                width: "100%",
                padding: "0.6rem 0.75rem",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: item.disabled ? "default" : "pointer",
                fontSize: "0.8rem",
                color: item.disabled ? "#9CA3AF" : "#374151",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1F2937",
            color: "#fff",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
