import dynamic from "next/dynamic";
import { HikeStoreProvider } from "../../hooks/useHikeStore";

const HikeEditor = dynamic(() => import("../../components/HikeEditor"), {
  ssr: false,
  loading: () => <div style={{ width: "100%", height: "100vh", backgroundColor: "#e8e4dc" }} />,
});

const StagesPlanner = dynamic(() => import("../../components/StagesPlanner"), { ssr: false });

export default function PreparerPage() {
  return (
    <HikeStoreProvider>
      <main style={{ width: "100%", overflow: "hidden" }}>
        <div style={{ height: "100vh" }}>
          <HikeEditor />
        </div>
        <section style={{ padding: "1.5rem", maxWidth: 800, margin: "0 auto" }}>
          <details>
            <summary style={{ cursor: "pointer", fontSize: "1rem", fontWeight: 700, color: "#2D6A4F", padding: "0.75rem 0", userSelect: "none" }}>
              Planification des étapes journalières
            </summary>
            <div style={{ paddingTop: "1rem" }}>
              <StagesPlanner />
            </div>
          </details>
        </section>
      </main>
    </HikeStoreProvider>
  );
}
