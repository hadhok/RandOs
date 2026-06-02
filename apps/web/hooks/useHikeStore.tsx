"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

export type Waypoint = { lat: number; lng: number; name?: string };
export type Hike = { id: string; name: string; waypoints: Waypoint[]; createdAt: string };

const STORAGE_KEY = "randos_hikes";

function loadFromStorage(): Hike[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Hike[]) : [];
  } catch { return []; }
}

function saveToStorage(hikes: Hike[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hikes));
}

type HikeStore = {
  hikes: Hike[];
  activeHike: Hike | null;
  createHike: (name: string) => Hike;
  updateHike: (id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => void;
  deleteHike: (id: string) => void;
  setActiveHike: (id: string) => void;
};

const HikeContext = createContext<HikeStore | null>(null);

export function HikeStoreProvider({ children }: { children: ReactNode }) {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [activeHikeId, setActiveHikeId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadFromStorage();
    setHikes(loaded);
    if (loaded.length > 0 && loaded[0]) setActiveHikeId(loaded[0].id);
  }, []);

  const activeHike = hikes.find((h) => h.id === activeHikeId) ?? null;

  const createHike = useCallback((name: string): Hike => {
    const hike: Hike = { id: crypto.randomUUID(), name, waypoints: [], createdAt: new Date().toISOString() };
    setHikes((prev) => { const updated = [hike, ...prev]; saveToStorage(updated); return updated; });
    setActiveHikeId(hike.id);
    return hike;
  }, []);

  const updateHike = useCallback((id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => {
    setHikes((prev) => { const updated = prev.map((h) => h.id === id ? { ...h, ...patch } : h); saveToStorage(updated); return updated; });
  }, []);

  const deleteHike = useCallback((id: string) => {
    setHikes((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveToStorage(updated);
      if (activeHikeId === id) setActiveHikeId(updated[0]?.id ?? null);
      return updated;
    });
  }, [activeHikeId]);

  const setActiveHike = useCallback((id: string) => setActiveHikeId(id), []);

  return (
    <HikeContext.Provider value={{ hikes, activeHike, createHike, updateHike, deleteHike, setActiveHike }}>
      {children}
    </HikeContext.Provider>
  );
}

export function useHikeStore(): HikeStore {
  const ctx = useContext(HikeContext);
  if (!ctx) throw new Error("useHikeStore must be used inside HikeStoreProvider");
  return ctx;
}
