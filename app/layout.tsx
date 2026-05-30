import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MovieVault",
    template: "%s | MovieVault"
  },
  description:
    "A fast personal movie database synced from your public Letterboxd and IMDb profiles.",
  metadataBase: new URL("https://movies.tazim.dev")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b border-ink/6 bg-paper/80 backdrop-blur-sm">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-black tracking-[-0.02em] text-ink transition hover:text-vault"
              >
                <span className="text-2xl">🎬</span>
                MovieVault
              </Link>
              <nav className="flex items-center gap-1 text-sm font-semibold">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-ink/60 transition hover:bg-white/80 hover:text-ink"
                >
                  Search
                </Link>
                <Link
                  href="/stats"
                  className="rounded-lg px-3 py-2 text-ink/60 transition hover:bg-white/80 hover:text-ink"
                >
                  Stats
                </Link>
                <Link
                  href="/import"
                  className="rounded-lg px-3 py-2 text-ink/60 transition hover:bg-white/80 hover:text-ink"
                >
                  Import
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
