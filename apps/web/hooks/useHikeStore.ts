"use client";

import { useState, useEffect } from "react";

export type Waypoint = {
  lat: number;
  lng: number;
  name?: string;
};

export type Hike = {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;
};

const STORAGE_KEY = "randos_hikes";

function loadFromStorage(): Hike[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Hike[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(hikes: Hike[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hikes));
}

export function useHikeStore() {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [activeHikeId, setActiveHikeId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadFromStorage();
    setHikes(loaded);
    if (loaded.length > 0 && loaded[0]) {
      setActiveHikeId(loaded[0].id);
    }
  }, []);

  const activeHike = hikes.find((h) => h.id === activeHikeId) ?? null;

  function createHike(name: string): Hike {
    const hike: Hike = {
      id: crypto.randomUUID(),
      name,
      waypoints: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [hike, ...hikes];
    setHikes(updated);
    saveToStorage(updated);
    setActiveHikeId(hike.id);
    return hike;
  }

  function updateHike(id: string, patch: Partial<Omit<Hike, "id" | "createdAt">>): void {
    const updated = hikes.map((h) => (h.id === id ? { ...h, ...patch } : h));
    setHikes(updated);
    saveToStorage(updated);
  }

  function deleteHike(id: string): void {
    const updated = hikes.filter((h) => h.id !== id);
    setHikes(updated);
    saveToStorage(updated);
    if (activeHikeId === id) {
      setActiveHikeId(updated[0]?.id ?? null);
    }
  }

  function setActiveHike(id: string): void {
    setActiveHikeId(id);
  }

  return {
    hikes,
    activeHike,
    createHike,
    updateHike,
    deleteHike,
    setActiveHike,
  };
}
