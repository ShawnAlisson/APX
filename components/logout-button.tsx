"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}
