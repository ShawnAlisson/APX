import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  await deleteSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieOptions(new Date(0), ""));
  return response;
}
