import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { seedDemoBattle } from "@/lib/battles";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const battle = await seedDemoBattle(user.id);
    return NextResponse.json({ battle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
