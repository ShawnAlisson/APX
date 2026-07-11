import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBattleDashboard } from "@/lib/battles";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { id } = await context.params;
    const dashboard = await getBattleDashboard(id, user.id);

    if (!dashboard) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
