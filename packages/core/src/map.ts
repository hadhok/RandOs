import type { GpsPoint } from "./index";

export const IGN_WMTS_URL =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

export const CARTO_TILE_URL =
  "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

const EARTH_RADIUS_KM = 6371;

export function calculateBoundingBox(
  coordinates: GpsPoint[],
  bufferKm: number
): BoundingBox {
  const lats = coordinates.map((p) => p.lat);
  const lons = coordinates.map((p) => p.lon);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latBuffer = (bufferKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const midLat = (minLat + maxLat) / 2;
  const lonBuffer =
    (bufferKm / (EARTH_RADIUS_KM * Math.cos((midLat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    north: maxLat + latBuffer,
    south: minLat - latBuffer,
    east: maxLon + lonBuffer,
    west: minLon - lonBuffer,
  };
}

export function estimateTileCount(
  bbox: BoundingBox,
  minZoom: number,
  maxZoom: number
): number {
  let total = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const n = Math.pow(2, z);
    const xMin = Math.floor(((bbox.west + 180) / 360) * n);
    const xMax = Math.floor(((bbox.east + 180) / 360) * n);
    const latRadNorth = (bbox.north * Math.PI) / 180;
    const latRadSouth = (bbox.south * Math.PI) / 180;
    const yMin = Math.floor(
      ((1 - Math.log(Math.tan(latRadNorth) + 1 / Math.cos(latRadNorth)) / Math.PI) / 2) * n
    );
    const yMax = Math.floor(
      ((1 - Math.log(Math.tan(latRadSouth) + 1 / Math.cos(latRadSouth)) / Math.PI) / 2) * n
    );
    total += (xMax - xMin + 1) * (yMax - yMin + 1);
  }
  return total;
}

export function estimateDownloadSizeMB(tileCount: number): number {
  return (tileCount * 15) / 1024;
}
