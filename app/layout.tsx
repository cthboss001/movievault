import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("vault_auth")?.value === process.env.ADMIN_PASSWORD;

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
      <body suppressHydrationWarning>
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-black tracking-[-0.02em] text-text transition hover:text-accent"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="24" 
                  height="24" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-accent animate-[spin_12s_linear_infinite]"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="9" />
                  <line x1="12" y1="15" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="9" y2="12" />
                  <line x1="15" y1="12" x2="22" y2="12" />
                </svg>
                MovieVault
              </Link>
              <nav className="flex items-center gap-1 text-sm font-semibold">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-text"
                >
                  Search
                </Link>
                <Link
                  href="/stats"
                  className="rounded-lg px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-text"
                >
                  Stats
                </Link>
                {isAdmin && (
                  <Link
                    href="/import"
                    className="rounded-lg px-3 py-2 text-muted transition hover:bg-surface-2 hover:text-text"
                  >
                    Import
                  </Link>
                )}
                <a
                  href="https://www.tazim.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-4 flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-bold text-accent shadow-[0_0_15px_rgba(45,212,191,0.15)] transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-background hover:shadow-[0_0_25px_rgba(45,212,191,0.6)]"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="16" 
                    height="16" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    fill="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="animate-pulse"
                  >
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  Visit my portfolio
                </a>
                {isAdmin && <LogoutButton />}
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
