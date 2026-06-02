import ResupplyPlanner from "../../components/ResupplyPlanner";

export default function RavitaillementPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#2D6A4F" }}>
          Carnet de ravitaillement
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.875rem" }}>
          Planifiez vos points de ravitaillement et estimez le poids alimentaire
        </p>
      </div>
      <ResupplyPlanner />
    </main>
  );
}
