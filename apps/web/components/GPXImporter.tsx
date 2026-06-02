"use client";

import { useRef, useState } from "react";
import { parseGPX } from "@randos/core";
import { useHikeStore } from "../hooks/useHikeStore";

export default function GPXImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { createHike, updateHike } = useHikeStore();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      try {
        const { waypoints, name, totalDistanceKm } = parseGPX(xml);
        const hike = createHike(name || file.name.replace(".gpx", ""));
        updateHike(hike.id, {
          waypoints: waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng })),
        });
        setFeedback(`${waypoints.length} waypoints importés — ${totalDistanceKm.toFixed(2)} km`);
      } catch (err) {
        setFeedback("Erreur lors du parsing GPX.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => { setFeedback(null); inputRef.current?.click(); }}
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
        Importer GPX
      </button>
      {feedback && (
        <p style={{ fontSize: "0.75rem", color: "#2D6A4F", marginTop: "0.4rem", marginBottom: 0 }}>
          {feedback}
        </p>
      )}
    </div>
  );
}
