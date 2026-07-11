import { NextResponse } from "next/server";
import { ensurePublicDemoBattle, getPublicBattleStats } from "@/lib/battles";
import { getUnlockRemaining } from "@/lib/battle-score";
import { isMollieConfigured } from "@/lib/mollie";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ shortCode: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { shortCode } = await context.params;

    if (shortCode === "xK9m2p") {
      await ensurePublicDemoBattle();
    }

    const stats = await getPublicBattleStats(shortCode);

    if (!stats) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    const unlock =
      stats.battle.unlockThreshold != null
        ? getUnlockRemaining(stats.metrics, stats.battle.unlockThreshold)
        : null;

    return NextResponse.json({
      ...stats,
      unlock,
      mollieEnabled: isMollieConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
