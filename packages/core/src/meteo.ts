export type WeatherIcon = "sun" | "cloud" | "rain" | "snow" | "storm";

export type WeatherPoint = {
  datetime: string;
  tempC: number;
  windKmh: number;
  precipMm: number;
  description: string;
  icon: WeatherIcon;
};

export type WeatherForecast = {
  location: string;
  latitude: number;
  longitude: number;
  forecast: WeatherPoint[];
};

export function assessRisk(forecast: WeatherForecast): "low" | "medium" | "high" {
  for (const point of forecast.forecast) {
    if (point.windKmh > 70 || point.precipMm > 5 || point.tempC < 0) {
      return "high";
    }
  }
  for (const point of forecast.forecast) {
    if (
      (point.windKmh >= 40 && point.windKmh <= 70) ||
      (point.precipMm > 0 && point.precipMm <= 5) ||
      (point.tempC >= 0 && point.tempC <= 5)
    ) {
      return "medium";
    }
  }
  return "low";
}

export function weatherCodeToIcon(code: number): WeatherIcon {
  if (code === 0 || code === 1) return "sun";
  if (code <= 3) return "cloud";
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 51) return "rain";
  if (code >= 45) return "cloud";
  return "sun";
}

export function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code === 1) return "Peu nuageux";
  if (code === 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if (code === 45 || code === 48) return "Brouillard";
  if (code >= 51 && code <= 57) return "Bruine";
  if (code >= 61 && code <= 67) return "Pluie";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code === 85 || code === 86) return "Averses de neige";
  if (code === 95) return "Orage";
  if (code >= 96) return "Orage avec grêle";
  return "Variable";
}
