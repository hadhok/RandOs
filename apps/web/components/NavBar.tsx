"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/preparer", label: "Préparer", icon: "🥾" },
  { href: "/enroute", label: "En route", icon: "📍" },
  { href: "/bilan", label: "Bilans", icon: "📊" },
  { href: "/meteo", label: "Météo", icon: "🌤️" },
  { href: "/checklist", label: "Check-list", icon: "✅" },
  { href: "/sac", label: "Sac", icon: "🎒" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 48,
        backgroundColor: "#fff",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        paddingInline: "1rem",
        gap: "0.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <Link
        href="/"
        style={{
          fontWeight: 800,
          fontSize: "1.1rem",
          color: "#2D6A4F",
          textDecoration: "none",
          marginRight: "1rem",
          flexShrink: 0,
        }}
      >
        RandOs
      </Link>

      <div style={{ display: "flex", gap: "0.125rem", overflowX: "auto", flex: 1 }}>
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: active ? 700 : 500,
                color: active ? "#fff" : "#374151",
                backgroundColor: active ? "#2D6A4F" : "transparent",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
