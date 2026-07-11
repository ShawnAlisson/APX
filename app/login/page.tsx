"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="grid gap-6">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Back home</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            <BadgeRow>
              <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Owner login
              </span>
            </BadgeRow>
            <h1 className="max-w-2xl text-4xl font-semibold text-foreground sm:text-5xl">
              Run menu experiments for your business
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Create battles, share QR codes, and see live demand with break-even math.
              Customers join via public links — no account needed.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              {
                title: "First battle free",
                body: "Register, create your battle, and publish in minutes.",
              },
              {
                title: "Live dashboard",
                body: "Track votes, reservations, deposits, and get a proceed/modify/cancel verdict.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader className="space-y-3">
            <BadgeRow>
              <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold">
                Auth form
              </span>
            </BadgeRow>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Use the same email for sign in or registration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex rounded-lg border border-border bg-muted p-1">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("login")}
              >
                Login
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("register")}
              >
                Register
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {mode === "register" ? (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Avery"
                  />
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="mt-1 w-full">
                {isLoading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
              </Button>

              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function BadgeRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
