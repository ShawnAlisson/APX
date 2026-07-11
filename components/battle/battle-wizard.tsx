"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BattleOption } from "@/lib/battle-types";

type WizardStep = 1 | 2;
type WizardMode = "ai" | "manual";

type BattleSetupResult = {
  question: string;
  options: BattleOption[];
  warnings: string[];
};

const DEFAULT_COLORS = ["#2A9D8F", "#1D3557", "#D39A52", "#C85E41"];

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(20, 0, 0, 0);
  return d.toISOString().slice(0, 16);
};

function createEmptyOption(index: number): BattleOption {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    price: 0,
    teamColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    risk: "medium",
  };
}

function createEmptyOptions(count = 4) {
  return Array.from({ length: count }, (_, index) => createEmptyOption(index));
}

export default function BattleWizard() {
  const router = useRouter();
  const [mode, setMode] = useState<WizardMode>("ai");
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [battleIdea, setBattleIdea] = useState("");
  const [allowReservation, setAllowReservation] = useState(false);
  const [allowPreorder, setAllowPreorder] = useState(false);
  const [maxPortions, setMaxPortions] = useState(20);
  const [availableHours, setAvailableHours] = useState("Thu 3–5 PM");
  const [foodCostPct, setFoodCostPct] = useState(30);
  const [minBookings, setMinBookings] = useState(12);
  const [staffingCostPerHour, setStaffingCostPerHour] = useState(15);
  const [serviceHours, setServiceHours] = useState(3);
  const [additionalCosts, setAdditionalCosts] = useState(0);
  const [wastageAllowance, setWastageAllowance] = useState(8);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<BattleOption[]>(createEmptyOptions());
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
          idea: battleIdea,
          maxPortions,
          availableHours,
          foodCostPct,
          minBookings,
          additionalCosts,
          staffingCostPerHour,
          serviceHours,
          allowReservation,
          allowPreorder,
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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function startManualBattle() {
    setMode("manual");
    setQuestion("");
    setOptions(createEmptyOptions());
    setWarnings([]);
    setWarningsAcknowledged(false);
    setStep(2);
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
          allowReservation,
          allowPreorder,
          unlockThreshold: 16,
          unlockBonus: "free cardamom cream",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");

      router.push(`/dashboard/battles/${data.battle.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  function updateOption(index: number, field: keyof BattleOption, value: string | number) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    );
  }

  function addOption() {
    setOptions((prev) => [...prev, createEmptyOption(prev.length)]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  const canPublish =
    !loading &&
    question.trim().length > 0 &&
    options.length >= 3 &&
    options.every((opt) => Boolean(opt.name.trim() && opt.description.trim() && opt.price > 0)) &&
    (warnings.length === 0 || warningsAcknowledged);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap gap-2">
        {[1, 2].map((s) => (
          <Badge key={s} variant={step === s ? "default" : "outline"}>
            Step {s}
          </Badge>
        ))}
        <Badge variant={mode === "ai" ? "secondary" : "outline"}>
          {mode === "ai" ? "AI draft" : "Manual build"}
        </Badge>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Choose how to build</CardTitle>
              <CardDescription>
                Use AI to draft the battle from a natural-language idea, or skip it and build the
                battle manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={mode === "ai" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setMode("ai")}
                >
                  Use AI
                </Button>
                <Button
                  type="button"
                  variant={mode === "manual" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setMode("manual")}
                >
                  Build manually
                </Button>
              </div>

              {mode === "ai" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="battleIdea">What should we test?</Label>
                    <Textarea
                      id="battleIdea"
                      value={battleIdea}
                      onChange={(event) => setBattleIdea(event.target.value)}
                      placeholder="Example: Create two menu concepts for Friday lunch using our chicken, bread and salad. One should be lighter and one should feel more premium."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will turn your idea into a battle question and four menu options.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxPortions">Max portions</Label>
                      <Input
                        id="maxPortions"
                        type="number"
                        value={maxPortions}
                        onChange={(event) => setMaxPortions(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minBookings">Min bookings to run</Label>
                      <Input
                        id="minBookings"
                        type="number"
                        value={minBookings}
                        onChange={(event) => setMinBookings(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foodCostPct">Food cost %</Label>
                      <Input
                        id="foodCostPct"
                        type="number"
                        value={foodCostPct}
                        onChange={(event) => setFoodCostPct(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffingCostPerHour">Staffing cost per hour (£)</Label>
                      <Input
                        id="staffingCostPerHour"
                        type="number"
                        value={staffingCostPerHour}
                        onChange={(event) => setStaffingCostPerHour(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceHours">Service hours</Label>
                      <Input
                        id="serviceHours"
                        type="number"
                        step="0.5"
                        value={serviceHours}
                        onChange={(event) => setServiceHours(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalCosts">Other fixed costs (£)</Label>
                      <Input
                        id="additionalCosts"
                        type="number"
                        value={additionalCosts}
                        onChange={(event) => setAdditionalCosts(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wastageAllowance">Wastage allowance (£)</Label>
                      <Input
                        id="wastageAllowance"
                        type="number"
                        value={wastageAllowance}
                        onChange={(event) => setWastageAllowance(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availableHours">Available hours</Label>
                    <Input
                      id="availableHours"
                      value={availableHours}
                      onChange={(event) => setAvailableHours(event.target.value)}
                    />
                  </div>

                  <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 sm:grid-cols-2">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={allowReservation}
                        onChange={(event) => setAllowReservation(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-foreground">Enable reservations</span>
                        <span className="block text-muted-foreground">
                          Show the arrival time step on the public battle page.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={allowPreorder}
                        onChange={(event) => setAllowPreorder(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-foreground">Enable preorder checkout</span>
                        <span className="block text-muted-foreground">
                          Show the deposit step after contact.
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={generateBattle} disabled={loading}>
                      {loading ? "Generating..." : "Generate with AI"}
                    </Button>
                    <Button type="button" variant="outline" onClick={startManualBattle}>
                      Skip AI and build manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-7 text-muted-foreground">
                    You can build the battle manually from the next screen. AI stays optional, so
                    you can start from scratch whenever you want.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="manualMaxPortions">Max portions</Label>
                      <Input
                        id="manualMaxPortions"
                        type="number"
                        value={maxPortions}
                        onChange={(event) => setMaxPortions(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualMinBookings">Min bookings to run</Label>
                      <Input
                        id="manualMinBookings"
                        type="number"
                        value={minBookings}
                        onChange={(event) => setMinBookings(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualFoodCostPct">Food cost %</Label>
                      <Input
                        id="manualFoodCostPct"
                        type="number"
                        value={foodCostPct}
                        onChange={(event) => setFoodCostPct(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualStaffingCost">Staffing cost per hour (£)</Label>
                      <Input
                        id="manualStaffingCost"
                        type="number"
                        value={staffingCostPerHour}
                        onChange={(event) => setStaffingCostPerHour(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="manualAvailableHours">Available hours</Label>
                      <Input
                        id="manualAvailableHours"
                        value={availableHours}
                        onChange={(event) => setAvailableHours(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualWastageAllowance">Wastage allowance (£)</Label>
                      <Input
                        id="manualWastageAllowance"
                        type="number"
                        value={wastageAllowance}
                        onChange={(event) => setWastageAllowance(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 sm:grid-cols-2">
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={allowReservation}
                        onChange={(event) => setAllowReservation(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-foreground">Enable reservations</span>
                        <span className="block text-muted-foreground">
                          Show the arrival time step on the public battle page.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={allowPreorder}
                        onChange={(event) => setAllowPreorder(event.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-foreground">Enable preorder checkout</span>
                        <span className="block text-muted-foreground">
                          Show the deposit step after contact.
                        </span>
                      </span>
                    </label>
                  </div>

                  <Button type="button" onClick={startManualBattle}>
                    Open manual editor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Manual creation</CardTitle>
              <CardDescription>
                Build from scratch at any time. AI just fills this editor when you ask it to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Pick manual mode.</p>
              <p>2. Enter your question, dates, and menu options in the editor.</p>
              <p>3. Add or remove options until the battle feels right.</p>
              <p>4. Publish when everything is ready.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Battle editor</CardTitle>
            <CardDescription>
              {mode === "ai"
                ? "Review the AI draft, edit it, or add more options before publishing."
                : "Fill out your manual battle, add options, then publish when ready."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Battle question</Label>
              <Input
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Which special should headline this week's menu push?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deadline">Decision deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service day</Label>
                <Input
                  id="serviceDate"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceWindow">Service window</Label>
              <Input
                id="serviceWindow"
                value={serviceWindow}
                onChange={(event) => setServiceWindow(event.target.value)}
              />
            </div>

            <div className="space-y-4">
              {options.map((opt, index) => (
                <div key={opt.id} className="rounded-lg border border-border/70 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Option {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        Edit the name, description, price and color.
                      </p>
                    </div>
                    {options.length > 3 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.imageUrl}
                      alt={opt.name || `Option ${index + 1}`}
                      className="h-36 w-full rounded-md object-cover"
                    />
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`option-name-${opt.id}`}>Team name</Label>
                    <Input
                      id={`option-name-${opt.id}`}
                      value={opt.name}
                      onChange={(event) => updateOption(index, "name", event.target.value)}
                      placeholder="e.g. Sunday Roast Special"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`option-description-${opt.id}`}>Description</Label>
                    <Textarea
                      id={`option-description-${opt.id}`}
                      value={opt.description}
                      onChange={(event) => updateOption(index, "description", event.target.value)}
                      placeholder="Short, appetising description of the offer"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`option-price-${opt.id}`}>Price (£)</Label>
                      <Input
                        id={`option-price-${opt.id}`}
                        type="number"
                        step="0.5"
                        value={opt.price}
                        onChange={(event) => updateOption(index, "price", Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`option-color-${opt.id}`}>Color</Label>
                      <Input
                        id={`option-color-${opt.id}`}
                        type="color"
                        value={opt.teamColor}
                        onChange={(event) => updateOption(index, "teamColor", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={addOption}>
                Add option
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>

            {warnings.length > 0 && (
              <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Feasibility warnings
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 dark:text-amber-300">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={warningsAcknowledged}
                    onChange={(event) => setWarningsAcknowledged(event.target.checked)}
                  />
                  I have reviewed these warnings
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={publishBattle}
                disabled={!canPublish}
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
