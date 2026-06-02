"use client";

import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";

const SOSButton = dynamic(() => import("../components/SOSButton"), { ssr: false });

export default function HomePage() {
  const [sosOpen, setSosOpen] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        padding: "2rem",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#2D6A4F", margin: 0 }}>
          RandOs
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#6B7280", marginTop: "0.75rem" }}>
          Planifiez, suivez et analysez vos randonnées
        </p>
      </header>

      {/* Main actions */}
      <section style={{ maxWidth: 960, margin: "0 auto 2.5rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
          Actions principales
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          <BigCard
            icon="🥾"
            title="Préparer"
            href="/preparer"
            description="Tracez votre itinéraire, ajoutez des points d'intérêt et estimez la durée."
            color="#2D6A4F"
          />
          <BigCard
            icon="📍"
            title="En route"
            href="/enroute"
            description="Enregistrez votre position GPS en temps réel et suivez votre progression."
            color="#3B82F6"
          />
          <BigCard
            icon="📊"
            title="Bilans"
            href="/bilan"
            description="Analysez vos sorties passées, exportez en GPX et comparez vos performances."
            color="#8B5CF6"
          />
        </div>
      </section>

      {/* Secondary tools */}
      <section style={{ maxWidth: 960, margin: "0 auto 2.5rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
          Outils
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
          <SmallCard icon="🌤️" title="Météo" href="/meteo" />
          <SmallCard icon="✅" title="Check-list" href="/checklist" />
          <SmallCard icon="🎒" title="Poids du sac" href="/sac" />
          <SmallCard icon="🍎" title="Ravitaillement" href="/ravitaillement" />
          <SmallCard icon="📚" title="Bibliothèque" href="/bibliotheque" />
          <SmallCard icon="🗺️" title="Carte" href="/carte" />
        </div>
      </section>

      {/* SOS */}
      <section style={{ maxWidth: 960, margin: "0 auto 2.5rem" }}>
        <button
          onClick={() => setSosOpen(true)}
          style={{
            width: "100%",
            padding: "1rem 1.5rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "10px",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <span style={{ fontSize: "2rem" }}>🆘</span>
          <div>
            <div style={{ fontWeight: 700, color: "#DC2626", fontSize: "1rem" }}>SOS Urgence</div>
            <div style={{ fontSize: "0.875rem", color: "#6B7280" }}>
              Numéros d'urgence montagne et partage de position GPS
            </div>
          </div>
        </button>
      </section>

      <footer style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.875rem", color: "#9CA3AF" }}>
        &copy; {new Date().getFullYear()} RandOs. Fait avec passion pour les randonneurs.
      </footer>

      {sosOpen && <SOSButton />}
    </main>
  );
}

function BigCard({
  icon,
  title,
  href,
  description,
  color,
}: {
  icon: string;
  title: string;
  href: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: `1px solid ${color}30`,
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{icon}</div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem", color }}>{title}</h2>
      <p style={{ fontSize: "0.9rem", color: "#6B7280", margin: 0, lineHeight: 1.6 }}>{description}</p>
    </Link>
  );
}

function SmallCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#fff",
        borderRadius: "10px",
        padding: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid #E5E7EB",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{title}</span>
    </Link>
  );
}
