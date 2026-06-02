import dynamic from "next/dynamic";

const HikeEditor = dynamic(() => import("../../components/HikeEditor"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#e8e4dc" }} />
  ),
});

export default function PreparerPage() {
  return (
    <main style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <HikeEditor />
    </main>
  );
}
