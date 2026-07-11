"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SeedDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSeed() {
    setLoading(true);
    setError("");
    setDone(false);
    try {
      const res = await fetch("/api/seed/demo", { method: "POST" });
      const data = (await res.json()) as {
        battle?: { id?: string; shortCode?: string };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load demo data.");
      }

      setDone(true);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleSeed} disabled={loading}>
        {loading ? "Loading..." : "Load demo data"}
      </Button>
      {done ? <p className="text-sm text-muted-foreground">Demo data loaded.</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
