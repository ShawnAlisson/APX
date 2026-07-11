import { NextResponse } from "next/server";
import { loginWithEmailPassword, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const { user, session } = await loginWithEmailPassword({
      email: body.email,
      password: body.password,
    });

    const response = NextResponse.json({ user });
    response.cookies.set(sessionCookieOptions(session.expiresAt, session.token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}
