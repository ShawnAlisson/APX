import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattlesByOwner } from "@/lib/battles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/logout-button";
import SeedDemoButton from "@/components/battle/seed-demo-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const battles = await getBattlesByOwner(user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
              M
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">MenuBattle</p>
              <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your battles</h1>
            <p className="text-sm text-muted-foreground">
              Create experiments, share QR codes, track demand.
            </p>
          </div>
          <div className="flex gap-2">
            <SeedDemoButton />
            <Button asChild>
              <Link href="/dashboard/battles/new">Create battle</Link>
            </Button>
          </div>
        </section>

        {battles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No battles yet</CardTitle>
              <CardDescription>
                Create your first battle or load the demo to see MenuBattle in action.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <SeedDemoButton />
              <Button asChild>
                <Link href="/dashboard/battles/new">Create battle</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {battles.map((battle) => (
              <Card key={battle.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={battle.status === "live" ? "default" : "outline"}>
                      {battle.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">/b/{battle.shortCode}</span>
                  </div>
                  <CardTitle className="text-lg leading-snug">{battle.question}</CardTitle>
                  <CardDescription>
                    {battle.serviceDate} · {battle.serviceWindow}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {battle.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="rounded-full px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${opt.teamColor}33`, color: opt.teamColor }}
                      >
                        {opt.name}
                      </span>
                    ))}
                  </div>
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href={`/dashboard/battles/${battle.id}`}>View dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
