"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CloseBattleButtonProps = {
  battleId: string;
};

export default function CloseBattleButton({ battleId }: CloseBattleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm("Close this battle and compute the winner?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/battles/${battleId}/close`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" onClick={handleClose} disabled={loading}>
      {loading ? "Closing..." : "Close battle"}
    </Button>
  );
}
