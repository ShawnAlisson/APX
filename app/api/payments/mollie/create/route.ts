import { NextResponse } from "next/server";
import { upsertResponse } from "@/lib/battles";
import {
  createDepositPayment,
  getDepositAmount,
  isMollieConfigured,
} from "@/lib/mollie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isMollieConfigured()) {
      return NextResponse.json({ error: "Mollie is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as {
      battleId: string;
      optionId: string;
      sessionToken?: string;
      redirectUrl: string;
    };

    if (!body.battleId || !body.optionId || !body.redirectUrl) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const response = await upsertResponse({
      battleId: body.battleId,
      optionId: body.optionId,
      commitmentLevel: "reserved",
      sessionToken: body.sessionToken,
    });

    const origin = new URL(request.url).origin;
    const webhookUrl = `${origin}/api/payments/mollie/webhook`;

    const payment = await createDepositPayment({
      battleId: body.battleId,
      responseId: response.id as string,
      redirectUrl: body.redirectUrl,
      webhookUrl,
      description: "MenuBattle £1 deposit (credited off your order)",
    });

    await upsertResponse({
      battleId: body.battleId,
      optionId: body.optionId,
      commitmentLevel: "reserved",
      sessionToken: response.sessionToken,
      molliePaymentId: payment.paymentId,
    });

    return NextResponse.json({
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
      depositAmount: getDepositAmount(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
