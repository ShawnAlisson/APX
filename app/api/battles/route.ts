import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createBattle,
  getBattlesByOwner,
  getBusinessByOwnerId,
} from "@/lib/battles";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const battles = await getBattlesByOwner(user.id);
    return NextResponse.json({ battles });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as {
      question: string;
      deadline: string;
      serviceDate: string;
      serviceWindow: string;
      maxCapacity: number;
      minBookings: number;
      additionalCosts: number;
      foodCostPct: number;
      staffingCost: number;
      wastageAllowance: number;
      options: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        teamColor: string;
        imageUrl?: string;
        risk?: string;
      }>;
      allowReservation?: boolean;
      allowPreorder?: boolean;
      unlockThreshold?: number;
      unlockBonus?: string;
    };

    if (!body.question || !body.options || body.options.length < 3) {
      return NextResponse.json(
        { error: "Battle requires a question and at least three options." },
        { status: 400 },
      );
    }

    const business = await getBusinessByOwnerId(user.id);
    if (!business) {
      return NextResponse.json(
        { error: "Please save your business name and URL in profile settings first." },
        { status: 400 },
      );
    }

    const battle = await createBattle({
      ownerId: user.id,
      businessId: business.id,
      question: body.question,
      deadline: body.deadline,
      serviceDate: body.serviceDate,
      serviceWindow: body.serviceWindow,
      maxCapacity: body.maxCapacity,
      minBookings: body.minBookings,
      additionalCosts: body.additionalCosts,
      foodCostPct: body.foodCostPct,
      staffingCost: body.staffingCost,
      wastageAllowance: body.wastageAllowance,
      options: body.options.map((o) => ({
        ...o,
        risk: o.risk as "low" | "medium" | "high" | undefined,
      })),
      allowReservation: body.allowReservation,
      allowPreorder: body.allowPreorder,
      unlockThreshold: body.unlockThreshold,
      unlockBonus: body.unlockBonus,
      status: "live",
    });

    return NextResponse.json({ battle }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
