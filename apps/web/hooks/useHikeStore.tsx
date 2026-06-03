"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

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

function rowToHike(row: Record<string, unknown>): Hike {
  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    waypoints: (metadata.waypoints as Waypoint[]) ?? [],
  };
}

async function supabaseFetch(): Promise<Hike[] | null> {
  try {
    const { data, error } = await supabase
      .from("hikes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return null;
    return data.map((row) => rowToHike(row as Record<string, unknown>));
  } catch {
    return null;
  }
}

type HikeStore = {
  hikes: Hike[];
  activeHike: Hike | null;
  syncing: boolean;
  createHike: (name: string) => Hike;
  updateHike: (id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => void;
  deleteHike: (id: string) => void;
  setActiveHike: (id: string) => void;
};

const HikeContext = createContext<HikeStore | null>(null);

export function HikeStoreProvider({ children }: { children: ReactNode }) {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [activeHikeId, setActiveHikeId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const localHikes = loadFromStorage();
    if (localHikes.length > 0) {
      setHikes(localHikes);
      setActiveHikeId(localHikes[0]?.id ?? null);
    }

    setSyncing(true);
    supabaseFetch().then((remoteHikes) => {
      setSyncing(false);
      if (!remoteHikes) return; // fallback: keep localStorage data
      const remoteIds = new Set(remoteHikes.map((h) => h.id));
      const localOnly = loadFromStorage().filter((h) => !remoteIds.has(h.id));
      const merged = [...remoteHikes, ...localOnly];
      setHikes(merged);
      saveToStorage(merged);
      if (merged.length > 0) setActiveHikeId((prev) => prev ?? merged[0]?.id ?? null);
    }).catch(() => setSyncing(false));
  }, []);

  const activeHike = hikes.find((h) => h.id === activeHikeId) ?? null;

  const createHike = useCallback((name: string): Hike => {
    const hike: Hike = { id: crypto.randomUUID(), name, waypoints: [], createdAt: new Date().toISOString() };
    setHikes((prev) => { const updated = [hike, ...prev]; saveToStorage(updated); return updated; });
    setActiveHikeId(hike.id);

    // Persist to Supabase (silent fail)
    Promise.resolve(
      supabase
        .from("hikes")
        .insert({ id: hike.id, name: hike.name, created_at: hike.createdAt, metadata: { waypoints: [] } })
    ).then(({ error }) => {
      if (error) console.warn("Supabase insert hike error:", error.message);
    }).catch(() => {});

    return hike;
  }, []);

  const updateHike = useCallback((id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => {
    setHikes((prev) => {
      const updated = prev.map((h) => h.id === id ? { ...h, ...patch } : h);
      saveToStorage(updated);

      // Persist to Supabase (silent fail)
      const hike = updated.find((h) => h.id === id);
      if (hike) {
        const supabasePatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (patch.name !== undefined) supabasePatch.name = patch.name;
        if (patch.waypoints !== undefined) supabasePatch.metadata = { waypoints: patch.waypoints };
        Promise.resolve(
          supabase.from("hikes").update(supabasePatch).eq("id", id)
        ).then(({ error }) => {
          if (error) console.warn("Supabase update hike error:", error.message);
        }).catch(() => {});
      }

      return updated;
    });
  }, []);

  const deleteHike = useCallback((id: string) => {
    setHikes((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveToStorage(updated);
      if (activeHikeId === id) setActiveHikeId(updated[0]?.id ?? null);

      // Delete from Supabase (silent fail)
      Promise.resolve(
        supabase.from("hikes").delete().eq("id", id)
      ).then(({ error }) => {
        if (error) console.warn("Supabase delete hike error:", error.message);
      }).catch(() => {});

      return updated;
    });
  }, [activeHikeId]);

  const setActiveHike = useCallback((id: string) => setActiveHikeId(id), []);

  return (
    <HikeContext.Provider value={{ hikes, activeHike, syncing, createHike, updateHike, deleteHike, setActiveHike }}>
      {children}
    </HikeContext.Provider>
  );
}

export function useHikeStore(): HikeStore {
  const ctx = useContext(HikeContext);
  if (!ctx) throw new Error("useHikeStore must be used inside HikeStoreProvider");
  return ctx;
}
