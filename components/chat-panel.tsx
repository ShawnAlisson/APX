"use client";

import type React from "react";
import { useState } from "react";

export default function ChatPanel() {
  const [message, setMessage] = useState("Write a one-sentence product tagline for APX.");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed.");
      }

      setReply(data.reply ?? "");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-border bg-surface p-5">
      <div className="grid gap-2">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          OpenRouter prompt
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="min-h-32 rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Generating..." : "Send to OpenRouter"}
      </button>

      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {reply ? (
        <div className="grid gap-2 rounded-2xl border border-border bg-surface-strong px-4 py-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Response</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{reply}</p>
        </div>
      ) : null}
    </form>
  );
}
