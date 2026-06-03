import dynamic from "next/dynamic";

const TrackingDashboard = dynamic(
  () => import("../../components/TrackingDashboard"),
  { ssr: false }
);

export default function EnRoutePage() {
  return (
    <main style={{ height: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #E5E7EB",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#2D6A4F" }}>
          En route
        </h1>
        <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
          Enregistrement GPS en temps réel
        </span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <TrackingDashboard />
      </div>
    </main>
  );
}
