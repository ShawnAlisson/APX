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
      <div className="demo-panel rounded-[24px] px-4 py-4 text-white shadow-2xl sm:px-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
            Live demand
          </p>
          <p className="text-xs text-white/60">Updates every 5 seconds</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
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
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
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
