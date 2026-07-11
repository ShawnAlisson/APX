"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileSettingsFormProps = {
  business?: {
    name?: string;
    websiteUrl?: string;
    googleReviewUrl?: string;
  } | null;
};

export default function ProfileSettingsForm({ business }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(business?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business?.websiteUrl ?? "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(business?.googleReviewUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, websiteUrl, googleReviewUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");

      setSuccess("Profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile settings</CardTitle>
        <CardDescription>
          Your business name and site URL live here and are reused for every battle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
            {success}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business name</Label>
          <Input
            id="businessName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. APX Kitchen"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Business URL</Label>
          <Input
            id="websiteUrl"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://apx-phi.vercel.app"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="googleReviewUrl">Google review URL (optional)</Label>
          <Input
            id="googleReviewUrl"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/..."
          />
        </div>
        <Button onClick={handleSubmit} disabled={saving || !name.trim() || !websiteUrl.trim()}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
