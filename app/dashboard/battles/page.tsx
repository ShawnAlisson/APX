import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattleDashboard, getBattlesByOwner } from "@/lib/battles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BattlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const battles = await getBattlesByOwner(user.id);
  const dashboards = await Promise.all(
    battles.map(async (battle) => getBattleDashboard(battle.id, user.id)),
  );
  const entries = dashboards.filter(Boolean);

  const liveCount = battles.filter((battle) => battle.status === "live").length;
  const closedCount = battles.filter(
    (battle) => battle.status === "closed",
  ).length;
  const failedCount = battles.filter(
    (battle) => battle.status === "failed",
  ).length;
  const totalResponses = entries.reduce(
    (sum, entry) => sum + (entry?.totalResponses ?? 0),
    0,
  );

  return (
    <section className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All battles</h1>
          <p className="text-sm text-muted-foreground">
            Every battle in one place, with the latest response data beside it.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/battles/new">Create battle</Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>Total battles</CardDescription>
            <CardTitle className="text-3xl">{battles.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>Live</CardDescription>
            <CardTitle className="text-3xl">{liveCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>Closed</CardDescription>
            <CardTitle className="text-3xl">{closedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>Responses</CardDescription>
            <CardTitle className="text-3xl">{totalResponses}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl">{failedCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {battles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No battles yet</CardTitle>
            <CardDescription>
              Create your first battle to start collecting votes and bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/battles/new">Create battle</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            if (!entry) return null;

            return (
              <Card
                key={entry.battle.id}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        entry.battle.status === "live" ? "default" : "outline"
                      }
                    >
                      {entry.battle.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      /b/{entry.battle.shortCode}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {entry.battle.question}
                  </CardTitle>
                  <CardDescription>
                    {entry.battle.serviceDate} · {entry.battle.serviceWindow}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Responses
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {entry.totalResponses}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Leading
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {entry.battle.options.find(
                          (opt) => opt.id === entry.breakEven.leadingOptionId,
                        )?.name ?? "None"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.battle.options.map((opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex max-w-[11rem] items-center truncate rounded-full border border-border/70 px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${opt.teamColor}33`,
                          color: opt.teamColor,
                        }}
                        title={opt.name}
                      >
                        {opt.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex gap-2 pt-2">
                    <Button asChild className="flex-1" variant="outline">
                      <Link href={`/dashboard/battles/${entry.battle.id}`}>
                        View dashboard
                      </Link>
                    </Button>
                    {(entry.battle.status === "closed" ||
                      entry.battle.status === "failed") && (
                      <Button asChild className="flex-1" variant="ghost">
                        <Link href={`/b/${entry.battle.shortCode}/result`}>
                          Result
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </section>
  );
}
