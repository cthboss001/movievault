import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MovieVault - Tazim's Personal Movie Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1117",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <svg
            viewBox="0 0 24 24"
            width="140"
            height="140"
            stroke="#2dd4bf"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="9" />
            <line x1="12" y1="15" x2="12" y2="22" />
            <line x1="2" y1="12" x2="9" y2="12" />
            <line x1="15" y1="12" x2="22" y2="12" />
          </svg>
          <div
            style={{
              fontSize: 110,
              fontWeight: 900,
              color: "#f0f6fc",
              letterSpacing: "-0.05em",
            }}
          >
            MovieVault
          </div>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 48,
            color: "#8b949e",
            fontWeight: 600,
          }}
        >
          Tazim&apos;s Personal Movie Archive
        </div>
      </div>
    ),
    { ...size }
  );
}
