import { NextResponse } from "next/server";
import { upsertResponse } from "@/lib/battles";
import type { CommitmentLevel } from "@/lib/battle-types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      optionId: string;
      commitmentLevel: CommitmentLevel;
      email?: string;
      phone?: string;
      preferredTime?: string;
      depositAmount?: number;
      molliePaymentId?: string;
      sessionToken?: string;
      reviewClaimed?: boolean;
    };

    if (!body.optionId || !body.commitmentLevel) {
      return NextResponse.json({ error: "optionId and commitmentLevel are required." }, { status: 400 });
    }

    const response = await upsertResponse({
      battleId: id,
      optionId: body.optionId,
      commitmentLevel: body.commitmentLevel,
      email: body.email,
      phone: body.phone,
      preferredTime: body.preferredTime,
      depositAmount: body.depositAmount,
      molliePaymentId: body.molliePaymentId,
      sessionToken: body.sessionToken,
      reviewClaimed: body.reviewClaimed,
    });

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
