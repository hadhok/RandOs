import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "RandOs – Planifiez vos randonnées",
  description:
    "Planifiez, suivez et analysez vos randonnées avec RandOs. Tracez vos itinéraires, enregistrez vos performances et partagez vos aventures.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RandOs",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A4F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#F9FAFB",
          color: "#1F2937",
        }}
      >
        {children}
      </body>
    </html>
  );
}
