import dynamic from "next/dynamic";

const MapView = dynamic(() => import("../../components/MapView"), { ssr: false });

export default function CartePage() {
  return (
    <main style={{ height: "calc(100vh - 64px)", width: "100%" }}>
      <MapView />
    </main>
  );
}
