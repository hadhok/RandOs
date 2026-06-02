"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generateChecklist,
  type ChecklistContext,
  type ChecklistItem,
  type ChecklistCategory,
} from "@randos/core";

const STORAGE_KEY = "randos_checklist_checked";

const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  navigation: "Navigation",
  vetements: "Vêtements",
  bivouac: "Bivouac",
  securite: "Sécurité",
  nourriture: "Nourriture",
  trousse: "Trousse de secours",
};

const ALTITUDE_OPTIONS: { label: string; value: number }[] = [
  { label: "< 1000 m", value: 999 },
  { label: "1000 – 2000 m", value: 2000 },
  { label: "2000 – 3000 m", value: 3000 },
  { label: "> 3000 m", value: 4000 },
];

function loadChecked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(checked: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
}

export default function ChecklistView() {
  const [ctx, setCtx] = useState<ChecklistContext>({
    durationDays: 1,
    hasBivouac: false,
    season: "ete",
    maxAltitude: 999,
  });

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    setCheckedIds(loadChecked());
  }, []);

  useEffect(() => {
    setItems(generateChecklist(ctx));
  }, [ctx]);

  const toggleItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  }, []);

  function handleReset() {
    setCheckedIds(new Set());
    saveChecked(new Set());
  }

  const totalWeight = items.reduce((acc, item) => acc + (item.weightGrams ?? 0), 0);
  const checkedCount = items.filter((i) => checkedIds.has(i.id)).length;

  const categories = [...new Set(items.map((i) => i.category))] as ChecklistCategory[];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2D6A4F", marginBottom: "1.5rem" }}>
        Check-list équipement
      </h1>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "1.25rem",
          border: "1px solid #E5E7EB",
          marginBottom: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "0.5rem" }}>
            Durée : {ctx.durationDays} jour{ctx.durationDays > 1 ? "s" : ""}
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={ctx.durationDays}
            onChange={(e) => setCtx((c) => ({ ...c, durationDays: parseInt(e.target.value) }))}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "0.5rem" }}>
            Saison
          </label>
          <select
            value={ctx.season}
            onChange={(e) => setCtx((c) => ({ ...c, season: e.target.value as ChecklistContext["season"] }))}
            style={{ width: "100%", padding: "0.4rem", border: "1px solid #E5E7EB", borderRadius: "6px" }}
          >
            <option value="ete">Été</option>
            <option value="mi-saison">Mi-saison</option>
            <option value="hiver">Hiver</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "0.5rem" }}>
            Altitude max
          </label>
          <select
            value={ctx.maxAltitude}
            onChange={(e) => setCtx((c) => ({ ...c, maxAltitude: parseInt(e.target.value) }))}
            style={{ width: "100%", padding: "0.4rem", border: "1px solid #E5E7EB", borderRadius: "6px" }}
          >
            {ALTITUDE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280" }}>
            Bivouac
          </label>
          <button
            onClick={() => setCtx((c) => ({ ...c, hasBivouac: !c.hasBivouac }))}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              backgroundColor: ctx.hasBivouac ? "#2D6A4F" : "#D1D5DB",
              cursor: "pointer",
              position: "relative",
              transition: "background-color 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: ctx.hasBivouac ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#F0FDF4",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2D6A4F" }}>
              {checkedCount} / {items.length} items cochés
            </span>
            <span style={{ fontSize: "0.875rem", color: "#6B7280" }}>
              ~{(totalWeight / 1000).toFixed(1)} kg estimé
            </span>
          </div>
          <div style={{ height: 8, backgroundColor: "#D1FAE5", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
                backgroundColor: "#2D6A4F",
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
        <button
          onClick={handleReset}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#EF4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.8rem",
          }}
        >
          Réinitialiser
        </button>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <div key={cat} style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#374151", marginBottom: "0.5rem" }}>
              {CATEGORY_LABELS[cat]}
            </h2>
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                overflow: "hidden",
              }}
            >
              {catItems.map((item, idx) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 1rem",
                    borderBottom: idx < catItems.length - 1 ? "1px solid #F3F4F6" : "none",
                    cursor: "pointer",
                    backgroundColor: checkedIds.has(item.id) ? "#F0FDF4" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    style={{ width: 16, height: 16, accentColor: "#2D6A4F", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.875rem",
                      color: checkedIds.has(item.id) ? "#9CA3AF" : "#1F2937",
                      textDecoration: checkedIds.has(item.id) ? "line-through" : "none",
                    }}
                  >
                    {item.name}
                    {item.essential && (
                      <span style={{ color: "#EF4444", marginLeft: 4, fontSize: "0.75rem" }}>*</span>
                    )}
                  </span>
                  {item.weightGrams && (
                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                      {item.weightGrams >= 1000
                        ? `${(item.weightGrams / 1000).toFixed(1)} kg`
                        : `${item.weightGrams} g`}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1rem" }}>
        * Item essentiel
      </p>
    </div>
  );
}
