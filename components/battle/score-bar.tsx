"use client";

import type { BattleMetrics, BattleOption } from "@/lib/battle-types";

type ScoreBarProps = {
  options: BattleOption[];
  metrics: BattleMetrics[];
};

export default function ScoreBar({ options, metrics }: ScoreBarProps) {
  const totalScore = metrics.reduce((sum, m) => sum + m.battleScore, 0) || 1;

  return (
    <div className="sticky bottom-3 z-20 mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Live battle score</p>
        <div className="flex h-3 overflow-hidden rounded-full">
          {options.map((opt) => {
            const m = metrics.find((x) => x.optionId === opt.id);
            const pct = ((m?.battleScore ?? 0) / totalScore) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={opt.id}
                style={{ width: `${pct}%`, backgroundColor: opt.teamColor }}
                title={`${opt.name}: ${m?.battleScore ?? 0}`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
          {options.map((opt) => {
            const m = metrics.find((x) => x.optionId === opt.id);
            return (
              <span key={opt.id} style={{ color: opt.teamColor }} className="font-medium">
                {opt.name}: {m?.battleScore ?? 0}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
