import { NextResponse } from "next/server";
import { upsertResponse } from "@/lib/battles";
import { getDepositAmount, getPayment, isMollieConfigured, isPaymentPaid } from "@/lib/mollie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isMollieConfigured()) {
      return NextResponse.json({ error: "Mollie is not configured." }, { status: 503 });
    }

    const body = await request.formData();
    const paymentId = body.get("id")?.toString();

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment id." }, { status: 400 });
    }

    const payment = await getPayment(paymentId);

    if (!isPaymentPaid(payment)) {
      return NextResponse.json({ status: payment.status });
    }

    const metadata = payment.metadata as {
      battleId?: string;
      responseId?: string;
    };

    if (!metadata.battleId) {
      return NextResponse.json({ error: "Invalid payment metadata." }, { status: 400 });
    }

    const responses = await import("@/lib/battles").then((m) =>
      m.getResponsesForBattle(metadata.battleId!),
    );
    const response = responses.find(
      (r) => r._id.toString() === metadata.responseId || r.molliePaymentId === paymentId,
    );

    if (response) {
      await upsertResponse({
        battleId: metadata.battleId,
        optionId: response.optionId,
        commitmentLevel: "deposited",
        sessionToken: response.sessionToken,
        depositAmount: getDepositAmount(),
        molliePaymentId: paymentId,
        email: response.email,
        phone: response.phone,
        preferredTime: response.preferredTime,
      });
    }

    return NextResponse.json({ status: "paid" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
