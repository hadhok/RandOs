import HikeLibrary from "../../components/HikeLibrary";

export default function BibliothequeePage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#2D6A4F" }}>
          Bibliothèque de randonnées
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.875rem" }}>
          Retrouvez et gérez toutes vos randonnées enregistrées
        </p>
      </div>
      <HikeLibrary />
    </main>
  );
}
