"use client";

import { useState } from "react";
import { EMERGENCY_CONTACTS, formatGpsForSMS } from "@randos/core";

type GPSPosition = { lat: number; lng: number } | null;

export default function SOSButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<GPSPosition>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleOpen() {
    setOpen(true);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 10000 },
    );
  }

  function handleCopy() {
    if (!position) return;
    const text = formatGpsForSMS(position.lat, position.lng);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="SOS urgence montagne"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 1000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#DC2626",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "1.4rem",
          boxShadow: "0 4px 12px rgba(220,38,38,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
        }}
      >
        SOS
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              maxWidth: 480,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                backgroundColor: "#DC2626",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 800 }}>
                Urgence montagne
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
                Ma position GPS
              </div>
              {gpsLoading && <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>Localisation en cours…</div>}
              {!gpsLoading && position && (
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#1F2937", marginBottom: "0.5rem" }}>
                    Lat: {position.lat.toFixed(5)} · Lng: {position.lng.toFixed(5)}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handleCopy}
                      style={{
                        padding: "0.4rem 0.8rem",
                        backgroundColor: "#1F2937",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                      }}
                    >
                      {copied ? "Copié !" : "Copier position GPS"}
                    </button>
                    <a
                      href={`https://maps.google.com/?q=${position.lat},${position.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.4rem 0.8rem",
                        backgroundColor: "#2563EB",
                        color: "#fff",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.78rem",
                      }}
                    >
                      Voir sur Google Maps
                    </a>
                  </div>
                </div>
              )}
              {!gpsLoading && !position && (
                <div style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>
                  Position GPS indisponible
                </div>
              )}
            </div>

            <div style={{ padding: "0.75rem 1.25rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.5rem" }}>
                Numéros d'urgence
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {EMERGENCY_CONTACTS.map((contact) => (
                  <div
                    key={contact.number}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#FEF2F2",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1F2937" }}>{contact.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "#6B7280" }}>{contact.description}</div>
                    </div>
                    <a
                      href={`tel:${contact.number.replace(/\s/g, "")}`}
                      style={{
                        padding: "0.35rem 0.75rem",
                        backgroundColor: "#DC2626",
                        color: "#fff",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
