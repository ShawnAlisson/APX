"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { BattleOption } from "@/lib/battle-types";

type WizardStep = 1 | 2;

type BattleSetupResult = {
  question: string;
  options: BattleOption[];
  warnings: string[];
};

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(20, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};

export default function BattleWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [maxPortions, setMaxPortions] = useState(20);
  const [availableHours, setAvailableHours] = useState("Thu 3–5 PM");
  const [foodCostPct, setFoodCostPct] = useState(30);
  const [minBookings, setMinBookings] = useState(12);
  const [staffingCostPerHour, setStaffingCostPerHour] = useState(15);
  const [serviceHours, setServiceHours] = useState(3);
  const [additionalCosts, setAdditionalCosts] = useState(0);
  const [wastageAllowance, setWastageAllowance] = useState(8);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<BattleOption[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [serviceDate, setServiceDate] = useState("Thursday");
  const [serviceWindow, setServiceWindow] = useState("3–5 PM");

  async function generateBattle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/battle-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxPortions,
          availableHours,
          foodCostPct,
          minBookings,
          additionalCosts,
          staffingCostPerHour,
          serviceHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate battle");

      const result = data as BattleSetupResult;
      setQuestion(result.question);
      setOptions(result.options);
      setWarnings(result.warnings);
      setWarningsAcknowledged(false);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function publishBattle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          deadline: new Date(deadline).toISOString(),
          serviceDate,
          serviceWindow,
          maxCapacity: maxPortions,
          minBookings,
          additionalCosts,
          foodCostPct,
          staffingCost: staffingCostPerHour * serviceHours,
          wastageAllowance,
          options,
          unlockThreshold: 16,
          unlockBonus: "free cardamom cream",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");

      router.push(`/dashboard/battles/${data.battle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  function updateOption(index: number, field: keyof BattleOption, value: string | number) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <Badge key={s} variant={step === s ? "default" : "outline"}>
            Step {s}
          </Badge>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
            <CardDescription>Set the commercial guardrails for this battle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxPortions">Max portions</Label>
                <Input
                  id="maxPortions"
                  type="number"
                  value={maxPortions}
                  onChange={(e) => setMaxPortions(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minBookings">Min bookings to run</Label>
                <Input
                  id="minBookings"
                  type="number"
                  value={minBookings}
                  onChange={(e) => setMinBookings(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodCostPct">Food cost %</Label>
                <Input
                  id="foodCostPct"
                  type="number"
                  value={foodCostPct}
                  onChange={(e) => setFoodCostPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffingCostPerHour">Staffing cost per hour (£)</Label>
                <Input
                  id="staffingCostPerHour"
                  type="number"
                  value={staffingCostPerHour}
                  onChange={(e) => setStaffingCostPerHour(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceHours">Service hours</Label>
                <Input
                  id="serviceHours"
                  type="number"
                  step="0.5"
                  value={serviceHours}
                  onChange={(e) => setServiceHours(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalCosts">Other fixed costs (£)</Label>
                <Input
                  id="additionalCosts"
                  type="number"
                  value={additionalCosts}
                  onChange={(e) => setAdditionalCosts(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wastageAllowance">Wastage allowance (£)</Label>
                <Input
                  id="wastageAllowance"
                  type="number"
                  value={wastageAllowance}
                  onChange={(e) => setWastageAllowance(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableHours">Available hours</Label>
              <Input
                id="availableHours"
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
              />
            </div>
            <Button onClick={generateBattle} disabled={loading}>
              {loading ? "Generating..." : "Generate menu options"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Battle options</CardTitle>
            <CardDescription>Review the suggested specials, edit them, then publish.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Battle question</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Decision deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service day</Label>
                <Input
                  id="serviceDate"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceWindow">Service window</Label>
              <Input
                id="serviceWindow"
                value={serviceWindow}
                onChange={(e) => setServiceWindow(e.target.value)}
              />
            </div>

            {options.map((opt, i) => (
              <div
                key={opt.id}
                className="rounded-lg border p-4 space-y-3"
              style={{ borderLeftColor: opt.teamColor, borderLeftWidth: 4 }}
              >
                {opt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={opt.imageUrl}
                    alt={opt.name}
                    className="h-36 w-full rounded-md object-cover"
                  />
                )}
                <div className="space-y-2">
                  <Label>Team name</Label>
                  <Input
                    value={opt.name}
                    onChange={(e) => updateOption(i, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={opt.description}
                    onChange={(e) => updateOption(i, "description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Price (£)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={opt.price}
                      onChange={(e) => updateOption(i, "price", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={opt.teamColor}
                      onChange={(e) => updateOption(i, "teamColor", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Feasibility warnings
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 dark:text-amber-300">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={warningsAcknowledged}
                    onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                  />
                  I have reviewed these warnings
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={publishBattle}
                disabled={
                  loading ||
                  !question ||
                  options.length < 3 ||
                  (warnings.length > 0 && !warningsAcknowledged)
                }
              >
                {loading ? "Publishing..." : "Publish battle"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
