"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      // Force a hard refresh so the middleware kicks in and redirects to /login
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="ml-4 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-border hover:text-text active:scale-95 disabled:opacity-50"
      title="Log out"
    >
      {loading ? "..." : "Logout"}
    </button>
  );
}
