"use client";

import type { BattleMetrics, BattleOption } from "@/lib/battle-types";

type ScoreBarProps = {
  options: BattleOption[];
  metrics: BattleMetrics[];
};

export default function ScoreBar({ options, metrics }: ScoreBarProps) {
  const totalScore = metrics.reduce((sum, m) => sum + m.battleScore, 0) || 1;

  return (
    <div className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur">
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
      <div className="mt-2 flex justify-between text-xs">
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
  );
}
