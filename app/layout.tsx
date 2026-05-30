import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MovieVault",
    template: "%s | MovieVault"
  },
  description: "A fast personal movie database synced from Letterboxd.",
  metadataBase: new URL("https://movies.tazim.dev")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <Link href="/" className="text-lg font-black tracking-[0] text-ink">
              MovieVault
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold text-ink/70">
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-white/70 hover:text-ink"
              >
                Search
              </Link>
              <Link
                href="/stats"
                className="rounded-md px-3 py-2 transition hover:bg-white/70 hover:text-ink"
              >
                Stats
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
