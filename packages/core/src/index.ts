/**
 * @randos/core - Shared business logic for the RandOs app
 */

// Constants
const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculate the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Format a distance in meters to a human-readable string.
 * Below 1000m → "XXX m", above → "X.X km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format a duration in seconds to a human-readable string.
 * e.g. 3725 → "1h 02min"
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

/**
 * Calculate total elevation gain from an array of elevation points (in meters).
 */
export function calculateElevationGain(elevations: number[]): number {
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = (elevations[i] ?? 0) - (elevations[i - 1] ?? 0);
    if (diff > 0) gain += diff;
  }
  return gain;
}

/**
 * Calculate the total distance of a path from an array of [lat, lon] points.
 * @returns Distance in meters
 */
export function calculatePathDistance(
  points: Array<{ lat: number; lon: number }>
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      total += calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    }
  }
  return total;
}

export type HikeStatus = "draft" | "planned" | "completed";

export interface GpsPoint {
  lat: number;
  lon: number;
  elevation?: number;
}

export interface HikeSummary {
  distanceMeters: number;
  elevationGainMeters: number;
  durationSeconds: number;
}

export { generateChecklist } from "./checklist";
export type { ChecklistItem, ChecklistCategory, ChecklistContext } from "./checklist";

export { assessRisk, weatherCodeToIcon, weatherCodeToDescription } from "./meteo";
export type { WeatherPoint, WeatherForecast, WeatherIcon } from "./meteo";

export {
  IGN_WMTS_URL,
  CARTO_TILE_URL,
  calculateBoundingBox,
  estimateTileCount,
  estimateDownloadSizeMB,
} from "./map";
export type { BoundingBox } from "./map";

export { interpolateElevation, calculateStats } from "./elevation";
export type { ElevationPoint } from "./elevation";

export { computeStages } from "./stages";
export type { HikerLevel, Stage } from "./stages";

export { POI_ICONS } from "./poi";
export type { POIType, POI } from "./poi";

export { assessHikeRisk } from "./risk";
export type { RiskLevel, RiskFactor, RiskAssessment } from "./risk";

export { EMERGENCY_CONTACTS, formatGpsForSMS } from "./sos";
export type { EmergencyContact } from "./sos";

export { totalWeight, weightByCategory, weightStatus, WEIGHT_THRESHOLDS } from "./gear";
export type { GearItem, GearCategory } from "./gear";

export {
  calculateTotalCalories,
  calculateFoodWeightGrams,
  DEFAULT_RATIONS,
} from "./resupply";
export type { ResupplyPoint, RationDay } from "./resupply";

export { computeTrackStats, exportToGPX } from "./tracking";
export type { TrackPoint, WaypointNote, ActiveTrack } from "./tracking";

export { parseGPX, waypointsToGeoJSON } from "./gpx";
export type { GPXWaypoint, GeoJSONLineString } from "./gpx";

export { generateShareableLink, generateTextSummary } from "./export";
