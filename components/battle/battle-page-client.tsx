"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScoreBar from "@/components/battle/score-bar";
import type { BattleMetrics, BattleOption } from "@/lib/battle-types";

type PublicBattle = {
  id: string;
  shortCode: string;
  status: string;
  question: string;
  deadline: string;
  serviceDate: string;
  serviceWindow: string;
  minBookings: number;
  options: BattleOption[];
  allowReservation?: boolean;
  allowPreorder?: boolean;
  unlockThreshold?: number;
  unlockBonus?: string;
  winnerOptionId?: string;
  business?: { name: string; googleReviewUrl?: string };
};

type BattleStats = {
  battle: PublicBattle;
  metrics: BattleMetrics[];
  unlock?: { optionId: string; remaining: number } | null;
  mollieEnabled: boolean;
};

const TIME_SLOTS = ["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"];
const EXPERIENCE_POINTS = [
  "Vote with your appetite and help shape the next service.",
  "Leave your details so the kitchen can confirm interest fast.",
  "Reserve or pre-order only when that extra step is enabled.",
];

type BattleFlowStep = "vote" | "contact" | "reserve" | "preorder" | "done";

const STEP_LABELS: Record<Exclude<BattleFlowStep, "done">, string> = {
  vote: "Choose",
  contact: "Details",
  reserve: "Reserve",
  preorder: "Deposit",
};

function getSessionToken() {
  if (typeof window === "undefined") return "";
  const key = "mb_session";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function getBattleProgressKey(shortCode: string) {
  return `mb_progress_${shortCode}`;
}

function Countdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Closed");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return <span>{remaining}</span>;
}

function getReadableTextColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) return "#ffffff";

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) return "#ffffff";

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

function getBattleFlowSteps(battle: PublicBattle) {
  const steps: Exclude<BattleFlowStep, "done">[] = ["vote", "contact"];
  if (battle.allowReservation) steps.push("reserve");
  if (battle.allowPreorder) steps.push("preorder");
  return steps;
}

function getNextFlowStep(
  current: BattleFlowStep,
  battle: PublicBattle,
): BattleFlowStep {
  const steps = getBattleFlowSteps(battle);
  const index = steps.indexOf(current as Exclude<BattleFlowStep, "done">);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : "done";
}

function getMetric(metrics: BattleMetrics[], optionId: string) {
  return metrics.find((entry) => entry.optionId === optionId);
}

export default function BattlePageClient({ shortCode }: { shortCode: string }) {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<BattleOption | null>(
    null,
  );
  const [step, setStep] = useState<BattleFlowStep>("vote");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">(
    "email",
  );
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [consent, setConsent] = useState(false);
  const [sessionToken] = useState(() => getSessionToken());
  const [submitting, setSubmitting] = useState(false);
  const [reviewClaimed, setReviewClaimed] = useState(false);
  const [error, setError] = useState("");

  const saveBattleProgress = useCallback(
    (optionId: string, stepValue: BattleFlowStep) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        getBattleProgressKey(shortCode),
        JSON.stringify({ optionId, step: stepValue }),
      );
    },
    [shortCode],
  );

  const clearBattleProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(getBattleProgressKey(shortCode));
  }, [shortCode]);

  const getStoredBattleProgress = useCallback(() => {
    if (typeof window === "undefined" || !stats) return null;

    const raw = localStorage.getItem(getBattleProgressKey(shortCode));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as {
        optionId?: string;
        step?: BattleFlowStep;
      };
      const option = stats.battle.options.find(
        (item) => item.id === parsed.optionId,
      );
      if (!option) return null;
      return { option, step: parsed.step ?? "vote" };
    } catch {
      return null;
    }
  }, [shortCode, stats]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/public/${shortCode}`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } finally {
      setLoading(false);
    }
  }, [shortCode]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, [fetchStats]);

  useEffect(() => {
    if (!stats || searchParams.get("paid") !== "1") return;

    const progress = getStoredBattleProgress();
    if (!progress) return;

    const id = window.setTimeout(() => {
      setSelectedOption(progress.option);
      setStep("done");
    }, 0);

    return () => window.clearTimeout(id);
  }, [getStoredBattleProgress, searchParams, stats]);

  async function submitLevel(
    commitmentLevel: "vote" | "registered" | "reserved" | "deposited",
    extra?: Record<string, unknown>,
  ) {
    if (!stats || !selectedOption) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/battles/${stats.battle.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: selectedOption.id,
          commitmentLevel,
          sessionToken,
          email: contactMethod === "email" ? email : undefined,
          phone: contactMethod === "phone" ? phone : undefined,
          preferredTime:
            commitmentLevel === "reserved" || commitmentLevel === "deposited"
              ? preferredTime
              : undefined,
          depositAmount: commitmentLevel === "deposited" ? 1 : undefined,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");

      const nextStep =
        commitmentLevel === "deposited"
          ? "done"
          : getNextFlowStep(step, stats.battle);
      saveBattleProgress(selectedOption.id, nextStep);
      setStep(nextStep);
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMollieDeposit() {
    if (!stats || !selectedOption) return;
    setSubmitting(true);
    setError("");

    try {
      saveBattleProgress(selectedOption.id, "preorder");
      const redirectUrl = `${window.location.origin}/b/${shortCode}?paid=1`;
      const res = await fetch("/api/payments/mollie/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: stats.battle.id,
          optionId: selectedOption.id,
          sessionToken,
          redirectUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setSubmitting(false);
    }
  }

  async function claimReviewReward() {
    if (!stats || !selectedOption) return;
    await fetch(`/api/battles/${stats.battle.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optionId: selectedOption.id,
        commitmentLevel: "vote",
        sessionToken,
        reviewClaimed: true,
      }),
    });
    setReviewClaimed(true);
  }

  const flowSteps = stats ? getBattleFlowSteps(stats.battle) : [];
  const stepIndex =
    step === "done" ? flowSteps.length : flowSteps.indexOf(step);
  const activeStepIndex =
    step === "done" ? flowSteps.length : Math.max(stepIndex, 0);

  if (loading) {
    return (
      <div className="demo-page flex min-h-screen items-center justify-center px-6 text-white">
        <div className="demo-panel demo-fade-up rounded-[28px] px-8 py-7 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-white/60">
            Preparing the menu
          </p>
          <p className="mt-3 text-lg text-white/90">
            Loading the live food battle...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="demo-page flex min-h-screen items-center justify-center px-6 text-white">
        <div className="demo-panel rounded-[28px] px-8 py-7 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-white/60">
            Unavailable
          </p>
          <p className="mt-3 text-lg text-white/90">
            This food battle could not be found.
          </p>
        </div>
      </div>
    );
  }

  const { battle, metrics, unlock, mollieEnabled } = stats;
  const heroOption = selectedOption ?? battle.options[0];
  const heroMetric = getMetric(metrics, heroOption.id);

  if (battle.status === "closed" || battle.status === "failed") {
    return (
      <div className="demo-page flex min-h-screen items-center justify-center px-6 py-10 text-white">
        <div className="demo-panel demo-fade-up max-w-2xl rounded-[32px] p-8 text-center sm:p-10">
          <p className="text-sm uppercase tracking-[0.34em] text-white/55">
            {battle.business?.name ?? "MenuBattle"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            This service has wrapped.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            The tasting window is over, but the outcome is ready. Open the
            result page to see which dish won the crowd.
          </p>
          <Button
            asChild
            className="mt-7 h-12 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90"
          >
            <a href={`/b/${shortCode}/result`}>View results</a>
          </Button>
        </div>
      </div>
    );
  }

  const unlockOption = unlock
    ? battle.options.find((option) => option.id === unlock.optionId)
    : null;
  const selectedMetric = selectedOption
    ? getMetric(metrics, selectedOption.id)
    : null;

  return (
    <div className="demo-page relative flex min-h-screen flex-col overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-16 h-56 w-56 rounded-full bg-[#d38b4d]/20 blur-3xl" />
        <div className="absolute right-[-6%] top-28 h-72 w-72 rounded-full bg-[#f6d6b8]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#8b3d22]/16 blur-3xl" />
      </div>

      <header className="mx-auto w-full max-w-7xl px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
          <div
            className="demo-panel demo-fade-up rounded-[32px] p-5 sm:p-7"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/60">
              <span>{battle.business?.name ?? "MenuBattle"}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>Live tasting demo</span>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <Badge className="demo-on-image rounded-full border border-white/10 bg-white/6 px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] shadow-none">
                  {battle.serviceDate} · {battle.serviceWindow}
                </Badge>
                <div>
                  <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                    Choose the dish your guests would book first.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                    {battle.question}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="demo-panel-soft rounded-[24px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Closes in
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      <Countdown deadline={battle.deadline} />
                    </p>
                  </div>
                  <div className="demo-panel-soft rounded-[24px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Minimum run
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {battle.minBookings} bookings
                    </p>
                  </div>
                  <div className="demo-panel-soft rounded-[24px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      Current lead
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {heroOption.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="demo-panel-soft demo-float overflow-hidden rounded-[28px] p-3">
                <div className="demo-shimmer relative h-full overflow-hidden rounded-[22px]">
                  {heroOption.imageUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroOption.imageUrl}
                        alt={heroOption.name}
                        className="demo-hero-image h-[360px] w-full rounded-[22px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="demo-on-image-soft text-[11px] uppercase tracking-[0.26em]">
                      Spotlight dish
                    </p>
                    <p className="demo-on-image mt-2 text-2xl font-semibold">
                      {heroOption.name}
                    </p>
                    <p className="demo-on-image-muted mt-1 text-sm">
                      {heroOption.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="demo-on-image rounded-full bg-black/35 px-3 py-1">
                        {heroMetric?.votes ?? 0} supporters
                      </span>
                      <span className="text-lg font-semibold">
                        £{heroOption.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside
            className="demo-panel demo-fade-up rounded-[32px] p-5 sm:p-6"
            style={{ animationDelay: "130ms" }}
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">
              How it works
            </p>
            <div className="mt-4 space-y-3">
              {EXPERIENCE_POINTS.map((point, index) => (
                <div key={point} className="demo-panel-soft rounded-[22px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </header>

      {!selectedOption ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 pb-8 sm:px-6 lg:px-8">
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {battle.options.map((opt, index) => {
              const metric = getMetric(metrics, opt.id);
              const isLeader =
                (metric?.battleScore ?? 0) ===
                Math.max(...metrics.map((entry) => entry.battleScore));

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(opt);
                    setStep("vote");
                    saveBattleProgress(opt.id, "vote");
                  }}
                  className="demo-panel demo-fade-up group relative overflow-hidden rounded-[30px] p-3 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(0,0,0,0.35)]"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-white/10" />
                  <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at top, ${opt.teamColor}33, transparent 45%)`,
                      }}
                    />
                  </div>

                  <div className="relative overflow-hidden rounded-[24px]">
                    {opt.imageUrl && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={opt.imageUrl}
                          alt={opt.name}
                          className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                      </>
                    )}
                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <span className="demo-on-image rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em]">
                        {isLeader ? "Leading" : "Open"}
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${opt.teamColor}26`,
                          color:
                            getReadableTextColor(opt.teamColor) === "#ffffff"
                              ? "#fff"
                              : "#111827",
                        }}
                      >
                        £{opt.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="demo-on-image-soft text-[11px] uppercase tracking-[0.26em]">
                        Chef&apos;s contender
                      </p>
                      <p className="demo-on-image mt-2 text-2xl font-semibold">
                        {opt.name}
                      </p>
                      <p className="demo-on-image-muted mt-1 text-sm leading-6">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative grid gap-4 px-2 pb-2 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="demo-panel-soft rounded-[20px] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                          Supporters
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {metric?.votes ?? 0}
                        </p>
                      </div>
                      <div className="demo-panel-soft rounded-[20px] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                          Committed
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          £{(metric?.revenueCommitted ?? 0).toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm leading-6 text-white/65">
                        Back this dish and help decide what the restaurant
                        serves next.
                      </p>
                      <span
                        className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition group-hover:scale-[1.02]"
                        style={{
                          borderColor: `${opt.teamColor}55`,
                          color: opt.teamColor,
                        }}
                      >
                        Choose dish
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          {unlock && unlockOption && unlock.remaining > 0 && (
            <section
              className="demo-panel demo-fade-up rounded-[28px] p-5 text-center"
              style={{ animationDelay: "420ms" }}
            >
              <p className="text-sm leading-7 text-white/80">
                <strong className="text-white">{unlockOption.name}</strong>{" "}
                needs <strong className="text-white">{unlock.remaining}</strong>{" "}
                more backers to unlock{" "}
                <span className="text-[#f7d7b8]">
                  {battle.unlockBonus ?? "a bonus item"}
                </span>
                .
              </p>
            </section>
          )}
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.1fr)_360px] lg:px-8">
          <section className="space-y-4">
            <div className="demo-panel rounded-[30px] p-4 sm:p-5">
              <div className="flex gap-2">
                {flowSteps.map((flowStep, index) => (
                  <div
                    key={flowStep}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= activeStepIndex ? "bg-[#f1c593]" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/70">
                  {step === "done"
                    ? "Your interest is saved."
                    : `${STEP_LABELS[step]} step ${activeStepIndex + 1} of ${flowSteps.length}`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="demo-on-image rounded-full px-4 hover:bg-white/10"
                  onClick={() => {
                    setSelectedOption(null);
                    setStep("vote");
                    clearBattleProgress();
                  }}
                >
                  Pick another dish
                </Button>
              </div>
            </div>

            <Card className="demo-panel overflow-hidden rounded-[32px] border-0 text-white shadow-none">
              <CardHeader className="p-0">
                <div className="relative">
                  {selectedOption.imageUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedOption.imageUrl}
                        alt={selectedOption.name}
                        className="h-[300px] w-full object-cover sm:h-[360px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#130f0f] via-black/20 to-transparent" />
                    </>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <p className="demo-on-image-soft text-[11px] uppercase tracking-[0.28em]">
                      Selected dish
                    </p>
                    <CardTitle className="demo-on-image mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                      {selectedOption.name}
                    </CardTitle>
                    <CardDescription className="demo-on-image-muted mt-2 max-w-2xl text-sm leading-7 sm:text-base">
                      {selectedOption.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-6 sm:p-8">
                {error && (
                  <div className="rounded-[20px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                {step === "vote" && (
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-white/78 sm:text-base">
                      Back{" "}
                      <strong className="text-white">
                        {selectedOption.name}
                      </strong>{" "}
                      for{" "}
                      <strong className="text-white">
                        £{selectedOption.price.toFixed(2)}
                      </strong>{" "}
                      and help the kitchen decide what deserves the next
                      spotlight service.
                    </p>
                    <Button
                      className="h-12 w-full rounded-full border border-black/10 font-semibold shadow-md shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        backgroundColor: selectedOption.teamColor,
                        color: getReadableTextColor(selectedOption.teamColor),
                      }}
                      onClick={() => submitLevel("vote")}
                      disabled={submitting}
                    >
                      Back this dish
                    </Button>
                  </div>
                )}

                {step === "contact" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={
                          contactMethod === "email" ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-full"
                        onClick={() => setContactMethod("email")}
                      >
                        Email
                      </Button>
                      <Button
                        variant={
                          contactMethod === "phone" ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-full"
                        onClick={() => setContactMethod("phone")}
                      >
                        Phone
                      </Button>
                    </div>
                    {contactMethod === "email" ? (
                      <div className="space-y-2">
                        <Label className="demo-form-text">Email</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="demo-form-input h-12 rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="demo-form-text">Phone</Label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07..."
                          className="demo-form-input h-12 rounded-2xl"
                        />
                      </div>
                    )}
                    <label className="demo-on-image flex items-start gap-3 rounded-[20px] border border-white/8 bg-white/4 p-4 text-sm">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1"
                      />
                      Contact me with the result of this service test and any
                      booking details.
                    </label>
                    <Button
                      className="h-12 w-full rounded-full bg-white text-black hover:bg-white/90"
                      onClick={() => submitLevel("registered")}
                      disabled={
                        submitting ||
                        !consent ||
                        (contactMethod === "email" ? !email : !phone)
                      }
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {step === "reserve" && (
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-white/72">
                      Reserve your preferred arrival time for{" "}
                      {battle.serviceDate}.
                    </p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {TIME_SLOTS.map((timeSlot) => (
                        <Button
                          key={timeSlot}
                          variant={
                            preferredTime === timeSlot ? "default" : "outline"
                          }
                          size="sm"
                          className="rounded-2xl"
                          onClick={() => setPreferredTime(timeSlot)}
                        >
                          {timeSlot}
                        </Button>
                      ))}
                    </div>
                    <Button
                      className="h-12 w-full rounded-full bg-white text-black hover:bg-white/90"
                      onClick={() => submitLevel("reserved")}
                      disabled={submitting}
                    >
                      Reserve my spot
                    </Button>
                  </div>
                )}

                {step === "preorder" && (
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-white/78">
                      Pay <strong className="text-white">£1</strong> now and it
                      comes off your order if {selectedOption.name} wins the
                      service.
                    </p>
                    {mollieEnabled ? (
                      <Button
                        className="h-12 w-full rounded-full bg-white text-black hover:bg-white/90"
                        onClick={handleMollieDeposit}
                        disabled={submitting}
                      >
                        Pay £1 with Mollie
                      </Button>
                    ) : (
                      <p className="rounded-[20px] border border-dashed border-white/15 bg-white/5 p-4 text-sm leading-6 text-white/62">
                        Mollie checkout is not connected yet. Add a Mollie test
                        API key to enable the real hosted checkout here.
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full rounded-full text-xs text-white/72 hover:bg-white/8 hover:text-white"
                      onClick={() => setStep("done")}
                    >
                      Skip deposit for now
                    </Button>
                  </div>
                )}

                {step === "done" && (
                  <div className="space-y-4 text-center">
                    <p className="text-2xl font-semibold text-white">
                      You&apos;re on the list.
                    </p>
                    <p className="text-sm leading-7 text-white/72">
                      Share this page with friends and help{" "}
                      {selectedOption.name} win the next service.
                    </p>
                    {battle.allowPreorder ? (
                      <p className="text-sm text-white/86">
                        Your £1 deposit becomes £1 off if this dish wins.
                      </p>
                    ) : battle.allowReservation ? (
                      <p className="text-sm text-white/86">
                        Your spot is saved for {preferredTime}.
                      </p>
                    ) : (
                      <p className="text-sm text-white/86">
                        We&apos;ll keep you updated directly.
                      </p>
                    )}

                    {battle.business?.googleReviewUrl && (
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm">
                        <p className="demo-on-image">
                          Leave a Google review and claim a free side dish.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="demo-on-image mt-3 rounded-full border-white/20 bg-transparent hover:bg-white hover:text-black"
                          asChild
                        >
                          <a
                            href={battle.business.googleReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Leave review
                          </a>
                        </Button>
                        {!reviewClaimed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="demo-on-image mt-2 block w-full rounded-full hover:bg-white/8 hover:text-white"
                            onClick={claimReviewReward}
                          >
                            Claim code: REVIEW-SIDE
                          </Button>
                        )}
                        {reviewClaimed && (
                          <p className="mt-2 text-xs text-emerald-300">
                            Code REVIEW-SIDE claimed.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="demo-panel rounded-[30px] border-0 text-white shadow-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Service snapshot
                </CardTitle>
                <CardDescription className="text-white/62">
                  A tighter view of how this dish is performing right now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="demo-panel-soft rounded-[22px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                    Selected dish
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {selectedOption.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    {selectedOption.description}
                  </p>
                  <p className="mt-4 text-3xl font-semibold text-white">
                    £{selectedOption.price.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="demo-panel-soft rounded-[22px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                      Supporters
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {selectedMetric?.votes ?? 0}
                    </p>
                  </div>
                  <div className="demo-panel-soft rounded-[22px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                      Committed
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      £{(selectedMetric?.revenueCommitted ?? 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="demo-panel-soft rounded-[22px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                    What happens next
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/68">
                    Once enough guests commit, the restaurant can schedule the
                    service with more confidence and lower waste.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
      )}

      <ScoreBar options={battle.options} metrics={metrics} />
    </div>
  );
}
