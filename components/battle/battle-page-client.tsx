"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ScoreBar from "@/components/battle/score-bar";
import type { BattleOption, BattleMetrics } from "@/lib/battle-types";

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
type BattleFlowStep = "vote" | "contact" | "reserve" | "preorder" | "done";

const STEP_LABELS: Record<Exclude<BattleFlowStep, "done">, string> = {
  vote: "Join",
  contact: "Contact",
  reserve: "Time",
  preorder: "Pay",
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

function getNextFlowStep(current: BattleFlowStep, battle: PublicBattle): BattleFlowStep {
  const steps = getBattleFlowSteps(battle);
  const index = steps.indexOf(current as Exclude<BattleFlowStep, "done">);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : "done";
}

export default function BattlePageClient({ shortCode }: { shortCode: string }) {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<BattleOption | null>(null);
  const [step, setStep] = useState<BattleFlowStep>("vote");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [consent, setConsent] = useState(false);
  const [sessionToken] = useState(() => getSessionToken());
  const [submitting, setSubmitting] = useState(false);
  const [reviewClaimed, setReviewClaimed] = useState(false);
  const [error, setError] = useState("");

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
          preferredTime: commitmentLevel === "reserved" || commitmentLevel === "deposited" ? preferredTime : undefined,
          depositAmount: commitmentLevel === "deposited" ? 1 : undefined,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");

      setStep(commitmentLevel === "deposited" ? "done" : getNextFlowStep(step, stats.battle));
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoDeposit() {
    await submitLevel("deposited", { depositAmount: 1 });
  }

  async function handleMollieDeposit() {
    if (!stats || !selectedOption) return;
    setSubmitting(true);
    setError("");
    try {
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
  const stepIndex = step === "done" ? flowSteps.length : flowSteps.indexOf(step);
  const activeStepIndex = step === "done" ? flowSteps.length : Math.max(stepIndex, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading battle...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Battle not found.</p>
      </div>
    );
  }

  const { battle, metrics, unlock, mollieEnabled } = stats;

  if (battle.status === "closed" || battle.status === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">{battle.business?.name}</p>
        <h1 className="text-2xl font-bold">Battle ended</h1>
        <Button asChild>
          <a href={`/b/${shortCode}/result`}>View results</a>
        </Button>
      </div>
    );
  }

  const unlockOption = unlock
    ? battle.options.find((o) => o.id === unlock.optionId)
    : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_36%),radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.15),_transparent_34%),radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <header className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <div className="rounded-2xl border border-border/70 bg-card/85 px-4 py-4 shadow-sm backdrop-blur md:px-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {battle.business?.name ?? "MenuBattle"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            This week&apos;s MenuBattle
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{battle.question}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {battle.serviceDate} · {battle.serviceWindow}
            </Badge>
            <span>Closes in <Countdown deadline={battle.deadline} /></span>
          </div>
        </div>
      </header>

      {!selectedOption ? (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {battle.options.map((opt) => {
              const m = metrics.find((x) => x.optionId === opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedOption(opt);
                    setStep("vote");
                  }}
                  className="group flex h-full flex-col rounded-2xl border border-border/80 bg-card p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: opt.teamColor }}
                >
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.imageUrl}
                      alt={opt.name}
                      className="mb-4 h-48 w-full rounded-xl object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col">
                    <p className="text-lg font-bold" style={{ color: opt.teamColor }}>
                      {opt.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{opt.description}</p>
                    <p className="mt-3 text-2xl font-semibold">£{opt.price.toFixed(2)}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{m?.votes ?? 0} supporters</span>
                      <span>£{(m?.revenueCommitted ?? 0).toFixed(0)} committed</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tap to join
                      </span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${opt.teamColor}22`,
                          color: opt.teamColor,
                        }}
                      >
                        Select team
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {unlock && unlockOption && unlock.remaining > 0 && (
            <p className="rounded-2xl border border-border/70 bg-card/80 p-4 text-center text-sm text-foreground shadow-sm">
              <strong>{unlockOption.name}</strong> needs {unlock.remaining} more backers to unlock{" "}
              {battle.unlockBonus ?? "a bonus item"}!
            </p>
          )}
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:px-8">
          <div className="space-y-4">
            <div className="flex gap-1">
              {flowSteps.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${i <= activeStepIndex ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>

            <Card
              className="border-0 shadow-md"
              style={{ borderTopColor: selectedOption.teamColor, borderTopWidth: 3 }}
            >
              <CardHeader className="space-y-4">
                {selectedOption.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedOption.imageUrl}
                    alt={selectedOption.name}
                    className="h-56 w-full rounded-xl object-cover lg:h-64"
                  />
                )}
                <div>
                  <CardTitle className="text-xl">{selectedOption.name}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    {step === "done"
                      ? "Complete"
                      : `${STEP_LABELS[step]} — step ${activeStepIndex + 1} of ${flowSteps.length}`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                {step === "vote" && (
                  <>
                    <p className="text-sm sm:text-base">
                      You&apos;re backing <strong>{selectedOption.name}</strong> — {selectedOption.description} for £{selectedOption.price}.
                    </p>
                    <Button
                      className="w-full border border-black/10 font-semibold shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        backgroundColor: selectedOption.teamColor,
                        color: getReadableTextColor(selectedOption.teamColor),
                      }}
                      onClick={() => submitLevel("vote")}
                      disabled={submitting}
                    >
                      Join {selectedOption.name}
                    </Button>
                  </>
                )}

                {step === "contact" && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={contactMethod === "email" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setContactMethod("email")}
                      >
                        Email
                      </Button>
                      <Button
                        variant={contactMethod === "phone" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setContactMethod("phone")}
                      >
                        Phone
                      </Button>
                    </div>
                    {contactMethod === "email" ? (
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07..." />
                      </div>
                    )}
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                      Contact me about this experiment
                    </label>
                    <Button
                      className="w-full"
                      onClick={() => submitLevel("registered")}
                      disabled={submitting || !consent || (contactMethod === "email" ? !email : !phone)}
                    >
                      Continue
                    </Button>
                  </>
                )}

                {step === "reserve" && (
                  <>
                    <p className="text-sm text-muted-foreground">Reserve your arrival time on {battle.serviceDate}.</p>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {TIME_SLOTS.map((t) => (
                        <Button
                          key={t}
                          variant={preferredTime === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreferredTime(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    <Button className="w-full" onClick={() => submitLevel("reserved")} disabled={submitting}>
                      Reserve my spot
                    </Button>
                  </>
                )}

                {step === "preorder" && (
                  <>
                    <p className="text-sm">
                      Pay <strong>£1</strong> now — credited off your order if {selectedOption.name} wins.
                    </p>
                    {mollieEnabled ? (
                      <Button className="w-full" onClick={handleMollieDeposit} disabled={submitting}>
                        Pay £1 with Mollie
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={handleDemoDeposit} disabled={submitting}>
                        Pay £1 (demo checkout)
                      </Button>
                    )}
                    {!mollieEnabled && (
                      <p className="text-center text-xs text-muted-foreground">
                        Demo mode — deposit recorded without real payment
                      </p>
                    )}
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setStep("done")}>
                      Skip deposit for now
                    </Button>
                  </>
                )}

                {step === "done" && (
                  <div className="space-y-3 text-center">
                    <p className="font-semibold text-foreground">You&apos;re in!</p>
                    <p className="text-sm text-muted-foreground">
                      Your team needs you — share with friends to help {selectedOption.name} win.
                    </p>
                    {battle.allowPreorder ? (
                      <p className="text-sm">
                        Pay £1 now → £1 off if {selectedOption.name} wins
                      </p>
                    ) : battle.allowReservation ? (
                      <p className="text-sm">
                        We&apos;ve saved your spot for {preferredTime}.
                      </p>
                    ) : (
                      <p className="text-sm">We&apos;ll keep you updated by contact method.</p>
                    )}
                    {battle.business?.googleReviewUrl && (
                      <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                        <p>Leave us a Google review → free side dish</p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href={battle.business.googleReviewUrl} target="_blank" rel="noopener noreferrer">
                            Leave review
                          </a>
                        </Button>
                        {!reviewClaimed && (
                          <Button variant="ghost" size="sm" className="mt-1 block w-full" onClick={claimReviewReward}>
                            Claim code: REVIEW-SIDE
                          </Button>
                        )}
                        {reviewClaimed && (
                          <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                            Code REVIEW-SIDE claimed!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOption(null);
                    setStep("vote");
                  }}
                >
                  ← Pick a different team
                </Button>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6">
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Battle preview</CardTitle>
                <CardDescription>Desktop view with the details you need at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected team</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: selectedOption.teamColor }}>
                    {selectedOption.name}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedOption.description}</p>
                  <p className="mt-3 text-2xl font-bold">£{selectedOption.price.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-border/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Supporters</p>
                    <p className="mt-1 text-lg font-semibold">
                      {metrics.find((x) => x.optionId === selectedOption.id)?.votes ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Committed</p>
                    <p className="mt-1 text-lg font-semibold">
                      £{(metrics.find((x) => x.optionId === selectedOption.id)?.revenueCommitted ?? 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">How this works</p>
                  <p className="mt-2 leading-6">
                    Join the team, leave your contact details, and only continue into time selection or checkout when those steps are enabled.
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
