export type ElevationPoint = { distance: number; elevation: number };

export function interpolateElevation(points: ElevationPoint[]): ElevationPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ distance: 0, elevation: points[0]!.elevation }];

  const totalDistance = points[points.length - 1]!.distance;
  const result: ElevationPoint[] = [];

  for (let i = 0; i < 100; i++) {
    const targetDist = (i / 99) * totalDistance;
    let j = 0;
    while (j < points.length - 1 && points[j + 1]!.distance < targetDist) {
      j++;
    }
    if (j >= points.length - 1) {
      result.push({ distance: targetDist, elevation: points[points.length - 1]!.elevation });
    } else {
      const p0 = points[j]!;
      const p1 = points[j + 1]!;
      const span = p1.distance - p0.distance;
      const t = span === 0 ? 0 : (targetDist - p0.distance) / span;
      result.push({ distance: targetDist, elevation: p0.elevation + t * (p1.elevation - p0.elevation) });
    }
  }

  return result;
}

export function calculateStats(points: ElevationPoint[]): {
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number;
  minElevation: number;
} {
  if (points.length === 0) {
    return { elevationGain: 0, elevationLoss: 0, maxElevation: 0, minElevation: 0 };
  }

  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation = points[0]!.elevation;
  let minElevation = points[0]!.elevation;

  for (let i = 1; i < points.length; i++) {
    const diff = points[i]!.elevation - points[i - 1]!.elevation;
    if (diff > 0) elevationGain += diff;
    else elevationLoss += Math.abs(diff);
    if (points[i]!.elevation > maxElevation) maxElevation = points[i]!.elevation;
    if (points[i]!.elevation < minElevation) minElevation = points[i]!.elevation;
  }

  return { elevationGain, elevationLoss, maxElevation, minElevation };
}
