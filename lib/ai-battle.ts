import { chatWithOpenRouter } from "@/lib/openrouter";
import type { BattleOption } from "@/lib/battle-types";
import { normalizeBattleOptions } from "@/lib/food-option-catalog";

export type BattleSetupInput = {
  maxPortions: number;
  availableHours: string;
  foodCostPct: number;
  minBookings: number;
  additionalCosts: number;
  staffingCostPerHour: number;
  serviceHours: number;
};

export type BattleSetupResult = {
  question: string;
  options: BattleOption[];
  warnings: string[];
};

const FALLBACK_RESULT: BattleSetupResult = {
  question: "Which specials should headline this week's menu push?",
  options: [
    {
      id: "option-0",
      name: "Berry Pancake Stack",
      description: "Warm buttermilk pancakes with mascarpone cream and roasted strawberries",
      price: 10,
      teamColor: "#E77C8E",
      risk: "low",
    },
    {
      id: "option-1",
      name: "Lotus Cheesecake Shake",
      description: "Loaded biscoff cheesecake milkshake with whipped vanilla cream",
      price: 8.5,
      teamColor: "#D39A52",
      risk: "medium",
    },
    {
      id: "option-2",
      name: "Parmesan Chicken Pasta Bake",
      description: "Creamy chicken rigatoni baked with mozzarella and garlic crumb",
      price: 12.5,
      teamColor: "#C85E41",
      risk: "medium",
    },
    {
      id: "option-3",
      name: "Smash Burger & Loaded Fries",
      description: "Double smashed beef burger with burger sauce and skin-on fries",
      price: 13.5,
      teamColor: "#7A5A43",
      risk: "medium",
    },
  ],
  warnings: [
    "Check that your staffing plan covers the peak rush if more than one special sells strongly.",
    "Confirm your food-cost target still holds once toppings, packaging, and waste are included.",
  ],
};

const OPTION_COLORS = ["#E77C8E", "#D39A52", "#C85E41", "#7A5A43"];

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
        imageUrl?: string;
        risk?: string;
      }>;
      warnings?: string[];
    };

    if (!parsed.question || !parsed.options || parsed.options.length < 2) return null;

    return {
      question: parsed.question,
      options: normalizeBattleOptions(parsed.options.slice(0, 4).map((opt, i) => ({
        id: `option-${i}`,
        name: opt.name,
        description: opt.description,
        price: opt.price,
        teamColor: opt.teamColor ?? OPTION_COLORS[i % OPTION_COLORS.length],
        imageUrl: opt.imageUrl,
        risk: (opt.risk as BattleOption["risk"]) ?? "medium",
      }))),
      warnings: parsed.warnings ?? [],
    };
  } catch {
    return null;
  }
}

export async function generateBattleSetup(input: BattleSetupInput): Promise<BattleSetupResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return { ...FALLBACK_RESULT, options: normalizeBattleOptions(FALLBACK_RESULT.options) };
  }

  const systemPrompt = `You are a restaurant demand-validation assistant. Generate exactly 4 food-forward menu special options based on owner constraints. The options should feel like appetising cafe or dessert specials, with a mix of savoury plates and sweets when suitable. Return ONLY valid JSON with this shape:
{
  "question": "clear business question the battle answers",
  "options": [
    { "name": "Special Name", "description": "offer details", "price": 6.5, "teamColor": "#hex", "risk": "low|medium|high" }
  ],
  "warnings": ["feasibility warning 1", "warning 2"]
}
All options must be operationally feasible, feel like real menu specials, and use prices in GBP.`;

  const userPrompt = `Constraints:
- Max portions: ${input.maxPortions}
- Available hours: ${input.availableHours}
- Food cost target: ${input.foodCostPct}%
- Min bookings to run: ${input.minBookings}
- Additional costs: £${input.additionalCosts}
- Staffing cost per hour: £${input.staffingCostPerHour}
- Service hours: ${input.serviceHours}

Create 4 realistic specials for one campaign. Make at least 2 sweet options if the concept allows it.`;

  try {
    const result = await chatWithOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5 },
    );

    return parseJsonFromContent(result.content) ?? { ...FALLBACK_RESULT, options: normalizeBattleOptions(FALLBACK_RESULT.options) };
  } catch {
    return { ...FALLBACK_RESULT, options: normalizeBattleOptions(FALLBACK_RESULT.options) };
  }
}
