import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateBattleSetup } from "@/lib/ai-battle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as {
      ingredients?: string;
      maxPortions?: number;
      availableHours?: string;
      targetMarginPct?: number;
      minBookings?: number;
      additionalCosts?: number;
      staffingCost?: number;
    };

    const result = await generateBattleSetup({
      ingredients: body.ingredients ?? "bread, eggs, chicken, cheese, coffee, tea, cakes",
      maxPortions: body.maxPortions ?? 20,
      availableHours: body.availableHours ?? "3 PM - 5 PM",
      targetMarginPct: body.targetMarginPct ?? 30,
      minBookings: body.minBookings ?? 12,
      additionalCosts: body.additionalCosts ?? 0,
      staffingCost: body.staffingCost ?? 45,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
