import { NextResponse } from "next/server";
import { addToWaitlist, getWaitlistCount } from "@/lib/battles";

export const runtime = "nodejs";

export async function GET() {
  try {
    const count = await getWaitlistCount();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      businessType?: string;
      name?: string;
      source?: string;
    };

    if (!body.email?.trim() || !body.email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const result = await addToWaitlist({
      email: body.email,
      businessType: body.businessType,
      name: body.name,
      source: body.source,
    });

    const count = await getWaitlistCount();
    return NextResponse.json({ ...result, count }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
