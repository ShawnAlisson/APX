import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId, updateBusiness } from "@/lib/battles";

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

    const business = await getBusinessByOwnerId(user.id);
    return NextResponse.json({ business });
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
      name?: string;
      websiteUrl?: string;
      googleReviewUrl?: string;
    };

    if (!body.name?.trim() || !body.websiteUrl?.trim()) {
      return NextResponse.json(
        { error: "Business name and business URL are required." },
        { status: 400 },
      );
    }

    const business = await updateBusiness(user.id, {
      name: body.name.trim(),
      websiteUrl: body.websiteUrl?.trim() || undefined,
      googleReviewUrl: body.googleReviewUrl?.trim() || undefined,
    });

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
