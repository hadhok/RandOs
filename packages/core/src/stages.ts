export type HikerLevel = 'debutant' | 'intermediaire' | 'expert';

export type Stage = {
  day: number;
  startIndex: number;
  endIndex: number;
  distanceKm: number;
  estimatedDurationH: number;
  elevationGainM: number;
};

const MAX_HOURS: Record<HikerLevel, number> = {
  debutant: 5,
  intermediaire: 7,
  expert: 9,
};

function naismithDuration(distanceKm: number, elevationGainM: number): number {
  return distanceKm / 4 + (elevationGainM / 100) * (10 / 60);
}

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeStages(
  waypoints: { lat: number; lng: number }[],
  elevationGainPerSegment: number[],
  level: HikerLevel,
): Stage[] {
  if (waypoints.length < 2) return [];

  const maxH = MAX_HOURS[level];
  const stages: Stage[] = [];
  let day = 1;
  let stageStart = 0;
  let stageDist = 0;
  let stageGain = 0;
  let stageDuration = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const segDist = haversineKm(
      waypoints[i - 1]!.lat, waypoints[i - 1]!.lng,
      waypoints[i]!.lat, waypoints[i]!.lng,
    );
    const segGain = elevationGainPerSegment[i - 1] ?? 0;
    const segDuration = naismithDuration(segDist, segGain);

    if (stageDuration + segDuration > maxH && i - 1 > stageStart) {
      stages.push({
        day,
        startIndex: stageStart,
        endIndex: i - 1,
        distanceKm: stageDist,
        estimatedDurationH: stageDuration,
        elevationGainM: stageGain,
      });
      day++;
      stageStart = i - 1;
      stageDist = segDist;
      stageGain = segGain;
      stageDuration = segDuration;
    } else {
      stageDist += segDist;
      stageGain += segGain;
      stageDuration += segDuration;
    }
  }

  stages.push({
    day,
    startIndex: stageStart,
    endIndex: waypoints.length - 1,
    distanceKm: stageDist,
    estimatedDurationH: stageDuration,
    elevationGainM: stageGain,
  });

  return stages;
}
