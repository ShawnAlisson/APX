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

const STEPS = ["Vote", "Contact", "Time", "Pay"] as const;
const TIME_SLOTS = ["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"];

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

export default function BattlePageClient({ shortCode }: { shortCode: string }) {
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<BattleOption | null>(null);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  const [consent, setConsent] = useState(false);
  const [sessionToken] = useState(() => getSessionToken());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
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

      if (commitmentLevel === "deposited") {
        setDone(true);
      } else {
        setStep((s) => s + 1);
      }
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/80 px-4 py-4 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {battle.business?.name ?? "MenuBattle"}
        </p>
        <h1 className="mt-1 text-xl font-bold text-foreground">This week&apos;s MenuBattle</h1>
        <p className="mt-1 text-sm text-muted-foreground">{battle.question}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{battle.serviceDate} · {battle.serviceWindow}</Badge>
          <span>Closes in <Countdown deadline={battle.deadline} /></span>
        </div>
      </header>

      {!selectedOption ? (
        <main className="flex-1 space-y-4 p-4">
          {battle.options.map((opt) => {
            const m = metrics.find((x) => x.optionId === opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className="w-full rounded-xl border-2 border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md"
                style={{ borderColor: opt.teamColor }}
              >
                {opt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={opt.imageUrl}
                    alt={opt.name}
                    className="mb-3 h-44 w-full rounded-lg object-cover"
                  />
                )}
                <p className="font-bold" style={{ color: opt.teamColor }}>
                  {opt.name}
                </p>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
                <p className="mt-2 text-lg font-semibold">£{opt.price.toFixed(2)}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{m?.votes ?? 0} supporters</span>
                  <span>£{(m?.revenueCommitted ?? 0).toFixed(0)} committed</span>
                </div>
              </button>
            );
          })}

          {unlock && unlockOption && unlock.remaining > 0 && (
            <p className="rounded-lg bg-card p-3 text-center text-sm text-foreground">
              <strong>{unlockOption.name}</strong> needs {unlock.remaining} more backers to unlock{" "}
              {battle.unlockBonus ?? "a bonus item"}!
            </p>
          )}
        </main>
      ) : (
        <main className="flex-1 p-4">
          <div className="mb-4 flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <Card className="border-0 shadow-md" style={{ borderTopColor: selectedOption.teamColor, borderTopWidth: 3 }}>
            <CardHeader>
              {selectedOption.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedOption.imageUrl}
                  alt={selectedOption.name}
                  className="mb-3 h-44 w-full rounded-lg object-cover"
                />
              )}
              <CardTitle className="text-lg">{selectedOption.name}</CardTitle>
              <CardDescription>{STEPS[step]} — step {step + 1} of 4</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {step === 0 && (
                <>
                  <p className="text-sm">You&apos;re backing <strong>{selectedOption.name}</strong> — {selectedOption.description} for £{selectedOption.price}.</p>
                  <Button
                    className="w-full"
                    style={{ backgroundColor: selectedOption.teamColor }}
                    onClick={() => submitLevel("vote")}
                    disabled={submitting}
                  >
                    Join {selectedOption.name}
                  </Button>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="flex gap-2">
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

              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">Reserve your arrival time on {battle.serviceDate}.</p>
                  <div className="grid grid-cols-2 gap-2">
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
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setStep(3)}>
                    Skip to deposit
                  </Button>
                </>
              )}

              {step === 3 && !done && (
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
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setDone(true)}>
                    Skip deposit for now
                  </Button>
                </>
              )}

              {done && (
                <div className="space-y-3 text-center">
                  <p className="font-semibold text-foreground">You&apos;re in!</p>
                  <p className="text-sm text-muted-foreground">
                    Your team needs you — share with friends to help {selectedOption.name} win.
                  </p>
                  {selectedOption && (
                    <p className="text-sm">
                      Pay £1 now → £1 off if {selectedOption.name} wins
                    </p>
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

              <Button variant="ghost" size="sm" onClick={() => { setSelectedOption(null); setStep(0); }}>
                ← Pick a different team
              </Button>
            </CardContent>
          </Card>
        </main>
      )}

      <ScoreBar options={battle.options} metrics={metrics} />
    </div>
  );
}
