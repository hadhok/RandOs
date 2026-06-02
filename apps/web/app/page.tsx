import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            color: "#2D6A4F",
            margin: 0,
          }}
        >
          RandOs
        </h1>
        <p
          style={{
            fontSize: "1.25rem",
            color: "#6B7280",
            marginTop: "0.75rem",
          }}
        >
          Planifiez, suivez et analysez vos randonnées
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          maxWidth: "900px",
          width: "100%",
        }}
      >
        <FeatureCard
          icon="🗺️"
          title="Préparer"
          href="/preparer"
          description="Tracez votre itinéraire, ajoutez des points d'intérêt et estimez la durée de votre randonnée."
        />
        <FeatureCard
          icon="🌤️"
          title="Météo"
          href="/meteo"
          description="Consultez les prévisions météo détaillées pour votre destination et évaluez le risque rando."
        />
        <FeatureCard
          icon="✅"
          title="Check-list"
          href="/checklist"
          description="Préparez votre équipement avec une liste personnalisée selon la saison, l'altitude et la durée."
        />
        <FeatureCard
          icon="🧭"
          title="Carte"
          href="/carte"
          description="Explorez les cartes IGN détaillées et recherchez un lieu pour planifier votre sortie."
        />
      </section>

      <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
        <a
          href="https://apps.apple.com"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2D6A4F",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          App Store
        </a>
        <a
          href="https://play.google.com"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#1F2937",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Google Play
        </a>
      </div>

      <footer
        style={{
          marginTop: "4rem",
          fontSize: "0.875rem",
          color: "#9CA3AF",
        }}
      >
        &copy; {new Date().getFullYear()} RandOs. Fait avec passion pour les
        randonneurs.
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  href,
  description,
}: {
  icon: string;
  title: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #E5E7EB",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{icon}</div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
        {title}
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
        {description}
      </p>
    </Link>
  );
}
