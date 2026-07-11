import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleDashboard } from "@/lib/battles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CloseBattleButton from "@/components/battle/close-battle-button";
import QrDisplay from "@/components/battle/qr-display";
import LogoutButton from "@/components/logout-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

function VerdictBadge({ verdict }: { verdict: string }) {
  const variants: Record<string, string> = {
    proceed: "bg-green-100 text-green-800 border-green-300",
    modify: "bg-amber-100 text-amber-800 border-amber-300",
    cancel: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <span className={`rounded-full border px-4 py-2 text-lg font-bold uppercase ${variants[verdict] ?? ""}`}>
      {verdict}
    </span>
  );
}

export default async function BattleDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const dashboard = await getBattleDashboard(id, user.id);
  if (!dashboard) notFound();

  const { battle, metrics, breakEven, verdict, verdictRationale, totalResponses } = dashboard;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const battleUrl = `${baseUrl}/b/${battle.shortCode}`;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">MenuBattle</p>
            <p className="text-xs text-muted-foreground">{battle.business?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">All battles</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{battle.status}</Badge>
          <Badge variant="secondary">{battle.serviceDate} · {battle.serviceWindow}</Badge>
          <Badge variant="secondary">{totalResponses} responses</Badge>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{battle.question}</h1>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <QrDisplay url={battleUrl} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="break-all text-sm text-muted-foreground">{battleUrl}</p>
                {battle.status === "live" && <CloseBattleButton battleId={battle.id} />}
                {(battle.status === "closed" || battle.status === "failed") && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/b/${battle.shortCode}/result`}>View result page</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {battle.options.map((opt) => {
              const m = metrics.find((x) => x.optionId === opt.id);
              return (
                <Card key={opt.id} style={{ borderLeftColor: opt.teamColor, borderLeftWidth: 4 }}>
                  <CardHeader>
                    <CardTitle className="text-lg" style={{ color: opt.teamColor }}>
                      {opt.name}
                    </CardTitle>
                    <CardDescription>{opt.description} — £{opt.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground">Votes</p>
                        <p className="text-xl font-bold">{m?.votes ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Registered</p>
                        <p className="text-xl font-bold">{m?.registered ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reserved</p>
                        <p className="text-xl font-bold">{m?.reserved ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deposited</p>
                        <p className="text-xl font-bold">{m?.deposited ?? 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">£ committed</span>
                      <span className="font-semibold">£{(m?.revenueCommitted ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Battle Score</span>
                        <span>{m?.battleScore ?? 0}/100</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m?.battleScore ?? 0}%`,
                            backgroundColor: opt.teamColor,
                          }}
                        />
                      </div>
                      <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-muted-foreground">
                        <span>Dep 40%</span>
                        <span>Res 25%</span>
                        <span>Votes 15%</span>
                        <span>Profit 15%</span>
                        <span>Risk 5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Break-even</CardTitle>
              <CardDescription>
                Need {breakEven.bookingsNeeded} bookings to break even
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected revenue</span>
                <span>£{breakEven.expectedRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Food cost</span>
                <span>£{breakEven.foodCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total cost</span>
                <span>£{breakEven.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Projected profit</span>
                <span className={breakEven.profit >= 0 ? "text-green-700" : "text-red-600"}>
                  £{breakEven.profit.toFixed(2)}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min((breakEven.leadingBookings / breakEven.bookingsNeeded) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leading team: {breakEven.leadingBookings} / {breakEven.bookingsNeeded} bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <VerdictBadge verdict={verdict} />
              <p className="text-sm text-muted-foreground">{verdictRationale}</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
