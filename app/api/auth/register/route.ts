import { NextResponse } from "next/server";
import { registerWithEmailPassword, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const { user, session } = await registerWithEmailPassword({
      email: body.email,
      password: body.password,
      name: body.name,
    });

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(sessionCookieOptions(session.expiresAt, session.token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
