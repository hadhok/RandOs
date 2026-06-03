import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Waypoint = { lat: number; lng: number; name?: string };
export type Hike = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;
};

const STORAGE_KEY = "randos_hikes";

type HikeStore = {
  hikes: Hike[];
  activeHike: Hike | null;
  loaded: boolean;
  createHike: (name: string) => Hike;
  updateHike: (id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => void;
  deleteHike: (id: string) => void;
  setActiveHike: (id: string) => void;
};

const HikeContext = createContext<HikeStore | null>(null);

export function HikeStoreProvider({ children }: { children: React.ReactNode }) {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [activeHikeId, setActiveHikeId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const stored = JSON.parse(raw) as Hike[];
            setHikes(stored);
            if (stored.length > 0) setActiveHikeId(stored[0]!.id);
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((updated: Hike[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const createHike = useCallback(
    (name: string): Hike => {
      const hike: Hike = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        name,
        waypoints: [],
        createdAt: new Date().toISOString(),
      };
      setHikes((prev) => {
        const next = [hike, ...prev];
        persist(next);
        return next;
      });
      setActiveHikeId(hike.id);
      return hike;
    },
    [persist],
  );

  const updateHike = useCallback(
    (id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>) => {
      setHikes((prev) => {
        const next = prev.map((h) => (h.id === id ? { ...h, ...patch } : h));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const deleteHike = useCallback(
    (id: string) => {
      setHikes((prev) => {
        const next = prev.filter((h) => h.id !== id);
        persist(next);
        return next;
      });
      setActiveHikeId((curr) => {
        if (curr !== id) return curr;
        return null;
      });
    },
    [persist],
  );

  const setActiveHike = useCallback((id: string) => setActiveHikeId(id), []);

  const activeHike = hikes.find((h) => h.id === activeHikeId) ?? null;

  return (
    <HikeContext.Provider
      value={{ hikes, activeHike, loaded, createHike, updateHike, deleteHike, setActiveHike }}
    >
      {children}
    </HikeContext.Provider>
  );
}

export function useHikeStore(): HikeStore {
  const ctx = useContext(HikeContext);
  if (!ctx) throw new Error("useHikeStore must be inside HikeStoreProvider");
  return ctx;
}
