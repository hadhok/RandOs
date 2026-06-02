import dynamic from "next/dynamic";

const TrackSummary = dynamic(() => import("../../../components/TrackSummary"), { ssr: false });

export default async function BilanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <TrackSummary id={id} />
    </main>
  );
}
