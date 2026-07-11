"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>OpenRouter prompt</CardTitle>
        <CardDescription>Try a quick message to verify the connector is live.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Prompt</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Send to OpenRouter"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Model selected from <code className="rounded bg-muted px-1.5 py-0.5 text-xs">OPENROUTER_MODEL</code>.
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {reply ? (
            <div className="grid gap-2 rounded-md border border-border bg-muted px-4 py-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Response</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{reply}</p>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
