import type { HikerLevel } from './stages';

export type RiskLevel = 'faible' | 'modere' | 'eleve' | 'extreme';

export type RiskFactor = {
  label: string;
  severity: 'ok' | 'warning' | 'danger';
  detail: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  factors: RiskFactor[];
};

export function assessHikeRisk(params: {
  durationDays: number;
  maxAltitude: number;
  totalDistanceKm: number;
  elevationGainM: number;
  season: 'ete' | 'hiver' | 'mi-saison';
  level: HikerLevel;
  weatherRisk?: 'low' | 'medium' | 'high';
}): RiskAssessment {
  const factors: RiskFactor[] = [];
  let score = 0;

  const distPerDay = params.durationDays > 0 ? params.totalDistanceKm / params.durationDays : params.totalDistanceKm;
  const gainPerDay = params.durationDays > 0 ? params.elevationGainM / params.durationDays : params.elevationGainM;

  if (params.maxAltitude > 3000 && params.season === 'hiver') {
    factors.push({ label: 'Altitude hivernale', severity: 'danger', detail: `Altitude max ${params.maxAltitude}m en hiver` });
    score += 40;
  } else if (params.maxAltitude > 3000) {
    factors.push({ label: 'Haute altitude', severity: 'warning', detail: `Altitude max ${params.maxAltitude}m` });
    score += 20;
  } else {
    factors.push({ label: 'Altitude', severity: 'ok', detail: `Altitude max ${params.maxAltitude}m acceptable` });
  }

  if (gainPerDay > 1500) {
    factors.push({ label: 'Dénivelé positif', severity: 'danger', detail: `${Math.round(gainPerDay)}m D+/jour` });
    score += 25;
  } else if (gainPerDay > 800) {
    factors.push({ label: 'Dénivelé positif', severity: 'warning', detail: `${Math.round(gainPerDay)}m D+/jour` });
    score += 15;
  } else {
    factors.push({ label: 'Dénivelé positif', severity: 'ok', detail: `${Math.round(gainPerDay)}m D+/jour` });
  }

  if (distPerDay > 25) {
    factors.push({ label: 'Distance journalière', severity: 'warning', detail: `${distPerDay.toFixed(1)}km/jour` });
    score += 15;
  } else {
    factors.push({ label: 'Distance journalière', severity: 'ok', detail: `${distPerDay.toFixed(1)}km/jour` });
  }

  if (params.weatherRisk === 'high') {
    factors.push({ label: 'Météo', severity: 'danger', detail: 'Risque météo élevé' });
    score += 30;
  } else if (params.weatherRisk === 'medium') {
    factors.push({ label: 'Météo', severity: 'warning', detail: 'Risque météo modéré' });
    score += 15;
  } else {
    factors.push({ label: 'Météo', severity: 'ok', detail: 'Météo favorable' });
  }

  if (params.level === 'debutant' && params.maxAltitude > 2000) {
    factors.push({ label: 'Niveau/Altitude', severity: 'warning', detail: 'Débutant en haute altitude' });
    score += 20;
  } else if (params.level === 'debutant' && params.maxAltitude > 1500) {
    factors.push({ label: 'Niveau', severity: 'ok', detail: 'Profil adapté au niveau débutant' });
  }

  if (params.season === 'hiver') {
    factors.push({ label: 'Saison', severity: 'warning', detail: 'Conditions hivernales' });
    score += 10;
  } else if (params.season === 'mi-saison') {
    factors.push({ label: 'Saison', severity: 'ok', detail: 'Mi-saison' });
    score += 5;
  }

  const clampedScore = Math.min(100, score);

  let level: RiskLevel;
  if (clampedScore >= 70) level = 'extreme';
  else if (clampedScore >= 45) level = 'eleve';
  else if (clampedScore >= 20) level = 'modere';
  else level = 'faible';

  return { level, score: clampedScore, factors };
}
