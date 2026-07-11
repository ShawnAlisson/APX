"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WaitlistFormProps = {
  initialCount?: number;
};

export default function WaitlistForm({ initialCount = 0 }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("café");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, businessType, source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      setCount(data.count);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardContent className="pt-6 text-center">
          <p className="font-semibold text-foreground">You&apos;re on the list!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {count} businesses have joined the waitlist.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Join the business waitlist</CardTitle>
        <CardDescription>
          First battle free. {count > 0 && `${count} businesses already signed up.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="wl-email">Business email</Label>
            <Input
              id="wl-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@cafe.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-name">Your name (optional)</Label>
            <Input
              id="wl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wl-type">Business type</Label>
            <Input
              id="wl-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="café, pub, salon..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join waitlist — first battle free"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
