"use client";

import { supabase } from "../lib/supabase";

export type TrackPoint = { lat: number; lng: number; alt?: number; timestamp: string };
export type TrackNote = { text: string; timestamp: string; lat?: number; lng?: number };

export type ActiveTrack = {
  id?: string;
  hikeId?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  points: TrackPoint[];
  notes: TrackNote[];
};

export type Track = {
  id: string;
  hikeId: string | null;
  name: string | null;
  startTime: string | null;
  endTime: string | null;
  points: TrackPoint[];
  notes: TrackNote[];
  createdAt: string;
};

const TRACKS_STORAGE_KEY = "randos_tracks";

function loadTracksFromStorage(): Track[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRACKS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch { return []; }
}

function saveTracksToStorage(tracks: Track[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(tracks));
}

function rowToTrack(row: Record<string, unknown>): Track {
  return {
    id: row.id as string,
    hikeId: (row.hike_id as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    points: (row.points as TrackPoint[]) ?? [],
    notes: (row.notes as TrackNote[]) ?? [],
    createdAt: row.created_at as string,
  };
}

export async function saveTrack(track: ActiveTrack): Promise<void> {
  const id = track.id ?? crypto.randomUUID();
  const row = {
    id,
    hike_id: track.hikeId ?? null,
    name: track.name ?? null,
    start_time: track.startTime ?? null,
    end_time: track.endTime ?? null,
    points: track.points,
    notes: track.notes,
  };

  // Persist locally first
  const local = loadTracksFromStorage();
  const exists = local.findIndex((t) => t.id === id);
  const trackRecord: Track = {
    id,
    hikeId: row.hike_id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    points: track.points,
    notes: track.notes,
    createdAt: new Date().toISOString(),
  };
  if (exists >= 0) {
    local[exists] = trackRecord;
  } else {
    local.unshift(trackRecord);
  }
  saveTracksToStorage(local);

  // Try Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from("tracks").upsert(row);
      if (error) console.warn("Supabase saveTrack error:", error.message);
    } catch { /* silent fail */ }
  }
}

export async function listTracks(): Promise<Track[]> {
  if (!supabase) return loadTracksFromStorage();
  try {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return loadTracksFromStorage();

    const tracks = data.map((row) => rowToTrack(row as Record<string, unknown>));
    saveTracksToStorage(tracks);
    return tracks;
  } catch {
    return loadTracksFromStorage();
  }
}

export async function deleteTrack(id: string): Promise<void> {
  // Remove locally
  const local = loadTracksFromStorage().filter((t) => t.id !== id);
  saveTracksToStorage(local);

  if (supabase) {
    try {
      const { error } = await supabase.from("tracks").delete().eq("id", id);
      if (error) console.warn("Supabase deleteTrack error:", error.message);
    } catch { /* silent fail */ }
  }
}
