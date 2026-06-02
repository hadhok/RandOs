"use client";

import { useEffect, useState } from "react";
import {
  totalWeight,
  weightByCategory,
  weightStatus,
  WEIGHT_THRESHOLDS,
} from "@randos/core";
import type { GearItem, GearCategory } from "@randos/core";

const STORAGE_KEY = "randos_gear";

const CATEGORIES: GearCategory[] = [
  "navigation",
  "vetements",
  "bivouac",
  "securite",
  "nourriture",
  "electronique",
  "divers",
];

const CATEGORY_LABELS: Record<GearCategory, string> = {
  navigation: "Navigation",
  vetements: "Vêtements",
  bivouac: "Bivouac",
  securite: "Sécurité",
  nourriture: "Nourriture",
  electronique: "Électronique",
  divers: "Divers",
};

const CATEGORY_COLORS: Record<GearCategory, string> = {
  navigation: "#3B82F6",
  vetements: "#8B5CF6",
  bivouac: "#F59E0B",
  securite: "#EF4444",
  nourriture: "#10B981",
  electronique: "#6366F1",
  divers: "#6B7280",
};

function loadItems(): GearItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GearItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(items: GearItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function GearManager() {
  const [items, setItems] = useState<GearItem[]>([]);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  function update(updated: GearItem[]) {
    setItems(updated);
    saveItems(updated);
  }

  function addItem() {
    const newItem: GearItem = {
      id: crypto.randomUUID(),
      name: "Nouvel item",
      category: "divers",
      weightGrams: 100,
      quantity: 1,
      packed: false,
    };
    update([...items, newItem]);
  }

  function updateItem(id: string, patch: Partial<GearItem>) {
    update(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    update(items.filter((item) => item.id !== id));
  }

  const total = totalWeight(items);
  const byCategory = weightByCategory(items);
  const status = weightStatus(total);

  const statusColor =
    total < WEIGHT_THRESHOLDS.light
      ? "#22C55E"
      : total < WEIGHT_THRESHOLDS.moderate
        ? "#F59E0B"
        : "#EF4444";

  const sortedItems = [...items].sort((a, b) =>
    CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category)
  );

  const statusLabels: Record<ReturnType<typeof weightStatus>, string> = {
    optimal: "Optimal",
    acceptable: "Acceptable",
    lourd: "Lourd",
    "trop-lourd": "Trop lourd",
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Gestion du sac</h2>
        <button
          onClick={addItem}
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
          + Ajouter un item
        </button>
      </div>

      {/* Items list grouped by category */}
      {CATEGORIES.map((cat) => {
        const catItems = sortedItems.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: CATEGORY_COLORS[cat],
                textTransform: "uppercase",
                marginBottom: "0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            {catItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  padding: "0.5rem",
                  backgroundColor: item.packed ? "#F0FDF4" : "#FAFAFA",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                  marginBottom: "0.25rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={item.packed}
                  onChange={(e) => updateItem(item.id, { packed: e.target.checked })}
                  title="Dans le sac"
                />
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  style={{
                    flex: 2,
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                />
                <select
                  value={item.category}
                  onChange={(e) => updateItem(item.id, { category: e.target.value as GearCategory })}
                  style={{
                    flex: 1,
                    padding: "0.25rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.weightGrams}
                  min={0}
                  onChange={(e) => updateItem(item.id, { weightGrams: Number(e.target.value) })}
                  style={{
                    width: 70,
                    padding: "0.25rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                  title="Poids en grammes"
                />
                <span style={{ fontSize: "0.7rem", color: "#6B7280", minWidth: 14 }}>g</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <button
                    onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid #E5E7EB",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                      background: "#fff",
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 20, textAlign: "center", fontSize: "0.875rem" }}>{item.quantity}</span>
                  <button
                    onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid #E5E7EB",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                      background: "#fff",
                    }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#6B7280", minWidth: 55, textAlign: "right" }}>
                  {((item.weightGrams * item.quantity) / 1000).toFixed(2)} kg
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {items.length === 0 && (
        <div style={{ textAlign: "center", color: "#9CA3AF", padding: "3rem 0" }}>
          Votre sac est vide. Ajoutez des items pour commencer.
        </div>
      )}

      {/* Total weight gauge */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.25rem",
          backgroundColor: "#F9FAFB",
          borderRadius: "10px",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Poids total</span>
          <span style={{ fontWeight: 800, fontSize: "1.5rem", color: statusColor }}>
            {(total / 1000).toFixed(2)} kg
          </span>
          <span
            style={{
              padding: "0.2rem 0.6rem",
              backgroundColor: statusColor + "20",
              color: statusColor,
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {statusLabels[status]}
          </span>
        </div>

        {/* Weight gauge */}
        <div style={{ position: "relative", height: 10, backgroundColor: "#E5E7EB", borderRadius: 5, marginBottom: "1rem", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, (total / WEIGHT_THRESHOLDS.heavy) * 100)}%`,
              backgroundColor: statusColor,
              borderRadius: 5,
              transition: "width 0.3s",
            }}
          />
          {/* Threshold markers */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(WEIGHT_THRESHOLDS.light / WEIGHT_THRESHOLDS.heavy) * 100}%`,
              width: 2,
              backgroundColor: "#22C55E",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(WEIGHT_THRESHOLDS.moderate / WEIGHT_THRESHOLDS.heavy) * 100}%`,
              width: 2,
              backgroundColor: "#F59E0B",
              opacity: 0.6,
            }}
          />
        </div>

        {/* Category breakdown */}
        {items.length > 0 && (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
              Répartition par catégorie
            </div>
            {CATEGORIES.filter((c) => byCategory[c] > 0).map((cat) => {
              const pct = total > 0 ? (byCategory[cat] / total) * 100 : 0;
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ minWidth: 90, fontSize: "0.75rem", color: "#374151" }}>{CATEGORY_LABELS[cat]}</span>
                  <div style={{ flex: 1, height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct.toFixed(1)}%`,
                        backgroundColor: CATEGORY_COLORS[cat],
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span style={{ minWidth: 50, textAlign: "right", fontSize: "0.7rem", color: "#6B7280" }}>
                    {(byCategory[cat] / 1000).toFixed(2)} kg
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
