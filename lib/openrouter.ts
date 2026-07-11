export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterOptions = {
  model?: string;
  temperature?: number;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function getOpenRouterHeaders() {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
    "Content-Type": "application/json",
  };

  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const appName = process.env.OPENROUTER_APP_NAME;

  if (siteUrl) {
    headers["HTTP-Referer"] = siteUrl;
  }

  if (appName) {
    headers["X-Title"] = appName;
  }

  return headers;
}

export async function chatWithOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {},
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return { content, model, raw: data };
}
