import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../../components/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#e8e4dc" }} />
  ),
});

export default function CartePage() {
  return (
    <main style={{ width: "100%", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      <MapView />
    </main>
  );
}
