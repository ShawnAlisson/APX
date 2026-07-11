import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chatWithOpenRouter } from "@/lib/openrouter";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as {
      message?: string;
      model?: string;
    };

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const result = await chatWithOpenRouter(
      [
        {
          role: "system",
          content: `You are a concise product assistant for ${user.email}.`,
        },
        {
          role: "user",
          content: body.message.trim(),
        },
      ],
      {
        model: body.model,
      },
    );

    return NextResponse.json({
      reply: result.content,
      model: result.model,
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
