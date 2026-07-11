"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { BattleOption } from "@/lib/battle-types";

type WizardStep = 1 | 2 | 3;

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

  const [businessName, setBusinessName] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  const [ingredients, setIngredients] = useState(
    "Bread, eggs, chicken, cheese, coffee, tea, cakes",
  );
  const [maxPortions, setMaxPortions] = useState(20);
  const [availableHours, setAvailableHours] = useState("Thu 3–5 PM");
  const [targetMarginPct, setTargetMarginPct] = useState(30);
  const [minBookings, setMinBookings] = useState(12);
  const [staffingCost, setStaffingCost] = useState(45);
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
          ingredients,
          maxPortions,
          availableHours,
          targetMarginPct,
          minBookings,
          staffingCost,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate battle");

      const result = data as BattleSetupResult;
      setQuestion(result.question);
      setOptions(result.options);
      setWarnings(result.warnings);
      setWarningsAcknowledged(false);
      setStep(3);
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
          businessName,
          googleReviewUrl: googleReviewUrl || undefined,
          question,
          deadline: new Date(deadline).toISOString(),
          serviceDate,
          serviceWindow,
          maxCapacity: maxPortions,
          minBookings,
          additionalCosts: 0,
          foodCostPct: targetMarginPct,
          staffingCost,
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
        {[1, 2, 3].map((s) => (
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
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Tell customers who is running this battle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Corner Café"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleReviewUrl">Google review URL (optional)</Label>
              <Input
                id="googleReviewUrl"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/..."
              />
            </div>
            <Button onClick={() => setStep(2)} disabled={!businessName.trim()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
            <CardDescription>AI uses these to generate feasible battle options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients available</Label>
              <Textarea
                id="ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={3}
              />
            </div>
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
                <Label htmlFor="targetMarginPct">Food cost %</Label>
                <Input
                  id="targetMarginPct"
                  type="number"
                  value={targetMarginPct}
                  onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffingCost">Staffing cost (£)</Label>
                <Input
                  id="staffingCost"
                  type="number"
                  value={staffingCost}
                  onChange={(e) => setStaffingCost(Number(e.target.value))}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={generateBattle} disabled={loading}>
                {loading ? "Generating..." : "Generate battle options"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Battle options</CardTitle>
            <CardDescription>Review AI suggestions, edit, then publish.</CardDescription>
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
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={publishBattle}
                disabled={
                  loading ||
                  !question ||
                  options.length < 2 ||
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
