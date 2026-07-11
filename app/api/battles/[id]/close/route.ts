import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { closeBattle } from "@/lib/battles";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { id } = await context.params;
    const battle = await closeBattle(id, user.id);

    if (!battle) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    return NextResponse.json({ battle });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
