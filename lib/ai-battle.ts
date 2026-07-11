import { chatWithOpenRouter } from "@/lib/openrouter";
import type { BattleOption } from "@/lib/battle-types";

export type BattleSetupInput = {
  ingredients: string;
  maxPortions: number;
  availableHours: string;
  targetMarginPct: number;
  minBookings: number;
  additionalCosts: number;
  staffingCost: number;
};

export type BattleSetupResult = {
  question: string;
  options: BattleOption[];
  warnings: string[];
};

const FALLBACK_RESULT: BattleSetupResult = {
  question: "Should we open afternoons with sweet treats or savoury plates?",
  options: [
    {
      id: "sweet",
      name: "Team Sweet",
      description: "Coffee + cake slice",
      price: 6,
      teamColor: "#e8b4b8",
      risk: "low",
    },
    {
      id: "savoury",
      name: "Team Savoury",
      description: "Half sandwich, soup & drink",
      price: 8,
      teamColor: "#9caf88",
      risk: "medium",
    },
  ],
  warnings: [
    "Savoury margin may be below your target — verify ingredient costs.",
    "Afternoon staffing assumed at 1 cook after 2 PM.",
  ],
};

function parseJsonFromContent(content: string): BattleSetupResult | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      question?: string;
      options?: Array<{
        name: string;
        description: string;
        price: number;
        teamColor?: string;
        risk?: string;
      }>;
      warnings?: string[];
    };

    if (!parsed.question || !parsed.options || parsed.options.length < 2) return null;

    return {
      question: parsed.question,
      options: parsed.options.slice(0, 2).map((opt, i) => ({
        id: `option-${i}`,
        name: opt.name,
        description: opt.description,
        price: opt.price,
        teamColor: opt.teamColor ?? (i === 0 ? "#e8b4b8" : "#9caf88"),
        risk: (opt.risk as BattleOption["risk"]) ?? "medium",
      })),
      warnings: parsed.warnings ?? [],
    };
  } catch {
    return null;
  }
}

export async function generateBattleSetup(input: BattleSetupInput): Promise<BattleSetupResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return FALLBACK_RESULT;
  }

  const systemPrompt = `You are a restaurant demand-validation assistant. Generate exactly two competing menu battle options based on owner constraints. Return ONLY valid JSON with this shape:
{
  "question": "clear business question the battle answers",
  "options": [
    { "name": "Team Name", "description": "offer details", "price": 6.5, "teamColor": "#hex", "risk": "low|medium|high" }
  ],
  "warnings": ["feasibility warning 1", "warning 2"]
}
Both options must be operationally feasible with listed ingredients. Prices in GBP.`;

  const userPrompt = `Constraints:
- Ingredients: ${input.ingredients}
- Max portions: ${input.maxPortions}
- Available hours: ${input.availableHours}
- Target margin: ${input.targetMarginPct}%
- Min bookings to run: ${input.minBookings}
- Additional costs: £${input.additionalCosts}
- Staffing cost: £${input.staffingCost}

Create two realistic afternoon café battle options.`;

  try {
    const result = await chatWithOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5 },
    );

    return parseJsonFromContent(result.content) ?? FALLBACK_RESULT;
  } catch {
    return FALLBACK_RESULT;
  }
}
