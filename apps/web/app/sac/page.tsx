import GearManager from "../../components/GearManager";

export default function SacPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#2D6A4F" }}>
          Poids du sac
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.875rem" }}>
          Gérez le contenu et le poids de votre sac à dos
        </p>
      </div>
      <GearManager />
    </main>
  );
}
