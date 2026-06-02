export type POIType = 'water' | 'refuge' | 'summit' | 'viewpoint' | 'bivouac';

export type POI = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: POIType;
  elevation?: number;
  description?: string;
};

export const POI_ICONS: Record<POIType, string> = {
  water: '💧',
  refuge: '🏠',
  summit: '⛰️',
  viewpoint: '👁️',
  bivouac: '⛺',
};
