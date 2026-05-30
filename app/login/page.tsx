"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Force a hard refresh to update middleware state
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl glass-card p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-[spin_12s_linear_infinite]"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="22" />
              <line x1="2" y1="12" x2="9" y2="12" />
              <line x1="15" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text">MovieVault</h1>
          <p className="mt-2 text-sm font-semibold text-muted">Enter the vault password</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-surface-2 px-4 py-3 font-semibold text-text outline-none transition-colors focus:border-accent"
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-sm font-bold text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-background shadow-soft transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Unlocking..." : "Enter"}
          </button>
        </form>

        <div className="mt-8 border-t border-border/50 pt-6 text-center">
          <p className="mb-3 text-sm font-bold text-muted">Don&apos;t have credentials? Contact me.</p>
          <a
            href="https://www.tazim.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent/10 px-5 py-2 text-sm font-bold text-accent shadow-[0_0_15px_rgba(45,212,191,0.15)] transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-background hover:shadow-[0_0_25px_rgba(45,212,191,0.6)]"
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
        </div>
      </div>
    </main>
  );
}
