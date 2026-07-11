"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { name } : {}),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
            Session entry
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Sign in to the Mongo-backed starter and test the OpenRouter connector.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
            This starter uses opaque session cookies, a shared MongoDB driver, and a tiny API
            surface so you can move fast without guessing where the pieces live.
          </p>

          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="font-medium text-foreground">Login</p>
              <p className="mt-1">Create an account, then sign back in with the same email.</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="font-medium text-foreground">Protected chat</p>
              <p className="mt-1">The dashboard only loads when a valid session cookie exists.</p>
            </div>
          </div>

          <Link
            href="/"
            className="w-fit rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-surface-strong"
          >
            Back home
          </Link>
        </section>

        <section className="rounded-[2rem] border border-border bg-surface-strong p-6 shadow-2xl shadow-black/30">
          <div className="flex gap-2 rounded-full border border-border bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-accent text-slate-950" : "text-muted hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-accent text-slate-950"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {mode === "register" ? (
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60"
                  placeholder="Avery"
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent/60"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
            </button>

            {error ? (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
