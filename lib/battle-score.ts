import type { BattleMetrics, BattleOption, ResponseRecord } from "@/lib/battle-types";

const WEIGHTS = {
  deposits: 0.4,
  reservations: 0.25,
  votes: 0.15,
  profit: 0.15,
  risk: 0.05,
} as const;

const RISK_SCORE: Record<string, number> = {
  low: 1,
  medium: 0.6,
  high: 0.3,
};

function normalize(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(value / max, 1);
}

export function computeOptionMetrics(
  option: BattleOption,
  responses: ResponseRecord[],
  allOptions: BattleOption[],
): BattleMetrics {
  const optionResponses = responses.filter((r) => r.optionId === option.id);
  const votes = optionResponses.filter((r) =>
    ["vote", "registered", "reserved", "deposited"].includes(r.commitmentLevel),
  ).length;
  const registered = optionResponses.filter((r) =>
    ["registered", "reserved", "deposited"].includes(r.commitmentLevel),
  ).length;
  const reserved = optionResponses.filter((r) =>
    ["reserved", "deposited"].includes(r.commitmentLevel),
  ).length;
  const deposited = optionResponses.filter((r) => r.commitmentLevel === "deposited").length;
  const revenueCommitted =
    deposited * option.price + reserved * option.price * 0.7 + registered * option.price * 0.3;

  const allMetrics = allOptions.map((o) => {
    const r = responses.filter((res) => res.optionId === o.id);
    return {
      deposits: r.filter((x) => x.commitmentLevel === "deposited").length,
      reservations: r.filter((x) => ["reserved", "deposited"].includes(x.commitmentLevel)).length,
      votes: r.length,
      profit:
        r.filter((x) => x.commitmentLevel === "deposited").length * o.price * 0.7 +
        r.filter((x) => ["reserved", "deposited"].includes(x.commitmentLevel)).length *
          o.price *
          0.3,
    };
  });

  const maxDeposits = Math.max(...allMetrics.map((m) => m.deposits), 1);
  const maxReservations = Math.max(...allMetrics.map((m) => m.reservations), 1);
  const maxVotes = Math.max(...allMetrics.map((m) => m.votes), 1);
  const maxProfit = Math.max(...allMetrics.map((m) => m.profit), 1);

  const battleScore =
    normalize(deposited, maxDeposits) * WEIGHTS.deposits * 100 +
    normalize(reserved, maxReservations) * WEIGHTS.reservations * 100 +
    normalize(votes, maxVotes) * WEIGHTS.votes * 100 +
    normalize(revenueCommitted, maxProfit) * WEIGHTS.profit * 100 +
    (RISK_SCORE[option.risk ?? "medium"] ?? 0.6) * WEIGHTS.risk * 100;

  return {
    optionId: option.id,
    votes,
    registered,
    reserved,
    deposited,
    revenueCommitted: Math.round(revenueCommitted * 100) / 100,
    battleScore: Math.round(battleScore),
  };
}

export function computeAllMetrics(
  options: BattleOption[],
  responses: ResponseRecord[],
): BattleMetrics[] {
  return options.map((option) => computeOptionMetrics(option, responses, options));
}

export function getWinningOptionId(metrics: BattleMetrics[]): string | null {
  if (metrics.length === 0) return null;
  const sorted = [...metrics].sort((a, b) => b.battleScore - a.battleScore);
  return sorted[0]?.optionId ?? null;
}

export function getUnlockRemaining(
  metrics: BattleMetrics[],
  unlockThreshold: number,
): { optionId: string; remaining: number } | null {
  let best: { optionId: string; remaining: number } | null = null;

  for (const m of metrics) {
    const backers = m.deposited + m.reserved;
    const remaining = unlockThreshold - backers;
    if (remaining > 0 && (!best || remaining < best.remaining)) {
      best = { optionId: m.optionId, remaining };
    }
  }

  return best;
}
