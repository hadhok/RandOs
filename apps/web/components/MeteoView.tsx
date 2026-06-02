"use client";

import { useState, type FormEvent } from "react";
import {
  assessRisk,
  weatherCodeToIcon,
  weatherCodeToDescription,
  type WeatherForecast,
  type WeatherPoint,
  type WeatherIcon,
} from "@randos/core";

const ICON_MAP: Record<WeatherIcon, string> = {
  sun: "☀️",
  cloud: "☁️",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
};

const RISK_STYLE: Record<"low" | "medium" | "high", { bg: string; color: string; label: string }> = {
  low: { bg: "#D1FAE5", color: "#065F46", label: "Risque faible" },
  medium: { bg: "#FEF3C7", color: "#92400E", label: "Risque modéré" },
  high: { bg: "#FEE2E2", color: "#991B1B", label: "Risque élevé" },
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    windspeed_10m: number[];
    weathercode: number[];
  };
};

function groupByDay(points: WeatherPoint[]): { date: string; points: WeatherPoint[] }[] {
  const map = new Map<string, WeatherPoint[]>();
  for (const p of points) {
    const day = p.datetime.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(p);
  }
  return [...map.entries()].map(([date, pts]) => ({ date, points: pts }));
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function TempBar({ value, min, max }: { value: number; min: number; max: number }) {
  const range = max - min || 1;
  const pct = ((value - min) / range) * 100;
  const color = value < 0 ? "#93C5FD" : value < 10 ? "#6EE7B7" : value < 25 ? "#FCD34D" : "#F97316";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.7rem", color: "#6B7280", width: 30, textAlign: "right" }}>
        {value.toFixed(0)}°
      </span>
      <div style={{ flex: 1, height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.max(pct, 2)}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
}

export default function MeteoView() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const geoData = (await geoRes.json()) as NominatimResult[];
      if (!geoData.length || !geoData[0]) {
        setError("Lieu introuvable. Essayez une autre ville.");
        return;
      }

      const { lat, lon, display_name } = geoData[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      const meteoRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,windspeed_10m,weathercode&forecast_days=3&timezone=Europe%2FParis`
      );
      const meteoData = (await meteoRes.json()) as OpenMeteoResponse;

      const points: WeatherPoint[] = meteoData.hourly.time.map((time, i) => ({
        datetime: time,
        tempC: meteoData.hourly.temperature_2m[i] ?? 0,
        windKmh: meteoData.hourly.windspeed_10m[i] ?? 0,
        precipMm: meteoData.hourly.precipitation[i] ?? 0,
        description: weatherCodeToDescription(meteoData.hourly.weathercode[i] ?? 0),
        icon: weatherCodeToIcon(meteoData.hourly.weathercode[i] ?? 0),
      }));

      setForecast({
        location: display_name.split(",")[0] ?? display_name,
        latitude,
        longitude,
        forecast: points,
      });
    } catch {
      setError("Erreur lors de la récupération des données météo.");
    } finally {
      setLoading(false);
    }
  }

  const risk = forecast ? assessRisk(forecast) : null;
  const days = forecast ? groupByDay(forecast.forecast) : [];
  const allTemps = forecast ? forecast.forecast.map((p) => p.tempC) : [];
  const minTemp = allTemps.length ? Math.min(...allTemps) : 0;
  const maxTemp = allTemps.length ? Math.max(...allTemps) : 30;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2D6A4F", marginBottom: "1.5rem" }}>
        Météo montagne
      </h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un lieu en France..."
          style={{
            flex: 1,
            padding: "0.65rem 1rem",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.65rem 1.25rem",
            backgroundColor: "#2D6A4F",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "..." : "Chercher"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#FEE2E2", borderRadius: "8px", color: "#991B1B", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6B7280" }}>
          Chargement des prévisions...
        </div>
      )}

      {forecast && risk && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
              {forecast.location}
            </h2>
            <span
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "20px",
                fontWeight: 700,
                fontSize: "0.875rem",
                backgroundColor: RISK_STYLE[risk].bg,
                color: RISK_STYLE[risk].color,
              }}
            >
              {RISK_STYLE[risk].label}
            </span>
          </div>

          {days.map(({ date, points: pts }) => {
            const dayMin = Math.min(...pts.map((p) => p.tempC));
            const dayMax = Math.max(...pts.map((p) => p.tempC));
            const mainIcon = pts[Math.floor(pts.length / 2)]?.icon ?? "sun";
            const avgWind = pts.reduce((acc, p) => acc + p.windKmh, 0) / pts.length;
            const totalPrecip = pts.reduce((acc, p) => acc + p.precipMm, 0);

            return (
              <div
                key={date}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  marginBottom: "1rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0.75rem 1.25rem",
                    backgroundColor: "#F9FAFB",
                    borderBottom: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{ICON_MAP[mainIcon]}</span>
                    <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{formatDate(date)}</span>
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", color: "#6B7280" }}>
                    <span>🌡 {dayMin.toFixed(0)}° / {dayMax.toFixed(0)}°C</span>
                    <span>💨 {avgWind.toFixed(0)} km/h</span>
                    <span>💧 {totalPrecip.toFixed(1)} mm</span>
                  </div>
                </div>

                <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem" }}>
                  {pts.filter((_, i) => i % 3 === 0).map((point) => (
                    <div
                      key={point.datetime}
                      style={{
                        textAlign: "center",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        backgroundColor: "#F9FAFB",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                        {new Date(point.datetime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: "1.25rem", margin: "0.25rem 0" }}>{ICON_MAP[point.icon]}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{point.tempC.toFixed(0)}°C</div>
                      <TempBar value={point.tempC} min={minTemp} max={maxTemp} />
                      <div style={{ fontSize: "0.7rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                        {point.windKmh.toFixed(0)} km/h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
