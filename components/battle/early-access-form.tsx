"use client";

import type React from "react";
import { useState } from "react";

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "landing",
          businessType: "local business",
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to join");
      }

      setDone(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[26px] border border-border/70 bg-card p-6 shadow-sm backdrop-blur">
        <h2 className="text-xl font-semibold">You&apos;re on the list!</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We&apos;ll send product updates and early access when it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-border/70 bg-card p-6 shadow-sm backdrop-blur">
      <h2 className="text-xl font-semibold">Join the early access list.</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Be among the first local businesses to use customer insight to test ideas and uncover new
        opportunities for growth.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <label htmlFor="early-access-email" className="mb-2 block text-sm font-semibold">
          Email address
        </label>
        <input
          id="early-access-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-border/70 bg-background px-4 py-4 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Submitting..." : "Get Early Access"}
        </button>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </form>

      <p className="mt-4 text-sm text-muted-foreground">No spam. Just product updates and early access.</p>
    </div>
  );
}
