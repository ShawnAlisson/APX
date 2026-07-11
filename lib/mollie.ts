import createMollieClient, { type Payment } from "@mollie/api-client";

const DEPOSIT_AMOUNT = "1.00";
const DEPOSIT_CURRENCY = "GBP";

export function isMollieConfigured() {
  return Boolean(process.env.MOLLIE_API_KEY);
}

function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("MOLLIE_API_KEY is not configured.");
  }
  return createMollieClient({ apiKey });
}

export async function createDepositPayment(input: {
  battleId: string;
  responseId: string;
  redirectUrl: string;
  webhookUrl: string;
  description: string;
}) {
  const mollie = getMollieClient();

  const payment = await mollie.payments.create({
    amount: { currency: DEPOSIT_CURRENCY, value: DEPOSIT_AMOUNT },
    description: input.description,
    redirectUrl: input.redirectUrl,
    webhookUrl: input.webhookUrl,
    metadata: {
      battleId: input.battleId,
      responseId: input.responseId,
      type: "menubattle_deposit",
    },
  });

  return {
    paymentId: payment.id,
    checkoutUrl: payment.getCheckoutUrl(),
  };
}

export async function getPayment(paymentId: string): Promise<Payment> {
  const mollie = getMollieClient();
  return mollie.payments.get(paymentId);
}

export function isPaymentPaid(payment: Payment) {
  return payment.status === "paid";
}

export function getDepositAmount() {
  return parseFloat(DEPOSIT_AMOUNT);
}
