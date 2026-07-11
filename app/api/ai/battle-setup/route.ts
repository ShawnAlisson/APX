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
      idea?: string;
      maxPortions?: number;
      availableHours?: string;
      foodCostPct?: number;
      minBookings?: number;
      additionalCosts?: number;
      staffingCostPerHour?: number;
      serviceHours?: number;
    };

    const result = await generateBattleSetup({
      idea: body.idea ?? "",
      maxPortions: body.maxPortions ?? 20,
      availableHours: body.availableHours ?? "3 PM - 5 PM",
      foodCostPct: body.foodCostPct ?? 30,
      minBookings: body.minBookings ?? 12,
      additionalCosts: body.additionalCosts ?? 0,
      staffingCostPerHour: body.staffingCostPerHour ?? 15,
      serviceHours: body.serviceHours ?? 3,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
