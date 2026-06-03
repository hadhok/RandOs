"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hikes));
  } catch { /* storage full */ }
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
  if (!supabase) return null;
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
  const [loaded, setLoaded] = useState(false);

  // Keep a ref to latest hikes for use inside callbacks without stale closures.
  const hikesRef = useRef<Hike[]>([]);
  hikesRef.current = hikes;

  // Load from localStorage then sync with Supabase once on mount.
  useEffect(() => {
    const localHikes = loadFromStorage();
    if (localHikes.length > 0) {
      setHikes(localHikes);
      setActiveHikeId(localHikes[0]?.id ?? null);
    }
    setLoaded(true);

    if (!supabase) return;
    setSyncing(true);
    supabaseFetch()
      .then((remoteHikes) => {
        setSyncing(false);
        if (!remoteHikes) return;
        const remoteIds = new Set(remoteHikes.map((h) => h.id));
        const localOnly = loadFromStorage().filter((h) => !remoteIds.has(h.id));
        const merged = [...remoteHikes, ...localOnly];
        setHikes(merged);
        saveToStorage(merged);
        setActiveHikeId((prev) => prev ?? merged[0]?.id ?? null);
      })
      .catch(() => setSyncing(false));
  }, []);

  // Persist to localStorage whenever hikes change (after initial load).
  useEffect(() => {
    if (loaded) saveToStorage(hikes);
  }, [hikes, loaded]);

  const createHike = useCallback((name: string): Hike => {
    const hike: Hike = {
      id: crypto.randomUUID(),
      name,
      waypoints: [],
      createdAt: new Date().toISOString(),
    };
    setHikes((prev) => [hike, ...prev]);
    setActiveHikeId(hike.id);

    if (supabase) {
      supabase
        .from("hikes")
        .insert({ id: hike.id, name: hike.name, created_at: hike.createdAt, metadata: { waypoints: [] } })
        .then(({ error }) => { if (error) console.warn("Supabase insert:", error.message); })
        .catch(() => {});
    }

    return hike;
  }, []);

  const updateHike = useCallback((id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => {
    setHikes((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));

    if (supabase) {
      // Use the ref to get the latest state without a stale closure.
      const current = hikesRef.current.find((h) => h.id === id);
      const updated = current ? { ...current, ...patch } : null;
      if (updated) {
        supabase
          .from("hikes")
          .upsert({
            id: updated.id,
            name: updated.name,
            created_at: updated.createdAt,
            metadata: { waypoints: updated.waypoints },
            updated_at: new Date().toISOString(),
          })
          .then(({ error }) => { if (error) console.warn("Supabase upsert:", error.message); })
          .catch(() => {});
      }
    }
  }, []);

  const deleteHike = useCallback((id: string) => {
    setHikes((prev) => prev.filter((h) => h.id !== id));
    setActiveHikeId((curr) => {
      if (curr !== id) return curr;
      const remaining = hikesRef.current.filter((h) => h.id !== id);
      return remaining[0]?.id ?? null;
    });

    if (supabase) {
      supabase
        .from("hikes")
        .delete()
        .eq("id", id)
        .then(({ error }) => { if (error) console.warn("Supabase delete:", error.message); })
        .catch(() => {});
    }
  }, []);

  const setActiveHike = useCallback((id: string) => setActiveHikeId(id), []);

  const activeHike = hikes.find((h) => h.id === activeHikeId) ?? null;

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
