export type EmergencyContact = { name: string; number: string; description: string };

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: 'Secours montagne (PGHM)', number: '04 50 53 16 89', description: 'Peloton de Gendarmerie de Haute Montagne' },
  { name: 'SAMU', number: '15', description: 'Urgences médicales' },
  { name: 'Secours européen', number: '112', description: "Numéro d'urgence européen" },
  { name: 'Gendarmerie', number: '17', description: "Forces de l'ordre" },
  { name: 'Pompiers', number: '18', description: 'Secours et incendie' },
];

export function formatGpsForSMS(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}${lng >= 0 ? 'E' : 'W'}`;
  return `GPS: ${latStr} ${lngStr} - https://maps.google.com/?q=${lat.toFixed(4)},${lng.toFixed(4)}`;
}
