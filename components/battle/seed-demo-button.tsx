"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SeedDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    try {
      const res = await fetch("/api/seed/demo", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.battle?.id) {
        router.push(`/dashboard/battles/${data.battle.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleSeed} disabled={loading}>
      {loading ? "Seeding..." : "Load demo battle"}
    </Button>
  );
}
