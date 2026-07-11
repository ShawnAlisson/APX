import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBattlesByOwner, getOwnerBattleInsight } from "@/lib/battles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SeedDemoButton from "@/components/battle/seed-demo-button";

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="leading-6">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [battles, insight] = await Promise.all([
    getBattlesByOwner(user.id),
    getOwnerBattleInsight(user.id),
  ]);

  const recentBattles = battles.slice(0, 3);

  return (
    <section className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            A quick read on how your battles are doing and what to do next.
          </p>
        </div>
        <div className="flex gap-2">
          <SeedDemoButton />
          <Button asChild variant="outline">
            <Link href="/dashboard/battles/new">Create battle</Link>
          </Button>
        </div>
      </section>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl">AI overview</CardTitle>
              <CardDescription>
                Simple guidance based on every battle you&apos;ve run so far.
              </CardDescription>
            </div>
            <Badge variant="secondary">{battles.length} battles</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-4xl text-sm leading-7 text-foreground">
            {insight.summary}
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            <InsightList
              title="What voters are doing"
              items={insight.voterBehavior}
            />
            <InsightList title="What you should do" items={insight.whatToDo} />
            <InsightList title="Watch out for" items={insight.risks} />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Strongest signal
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {insight.strongestSignal}
            </p>
          </div>
        </CardContent>
      </Card>

      {battles.length === 0 ? (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>No battles yet</CardTitle>
            <CardDescription>
              Create your first battle or load the demo to see MenuBattle in
              action.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <SeedDemoButton />
            <Button asChild variant="outline">
              <Link href="/dashboard/battles/new">Create battle</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent battles
              </h2>
              <p className="text-sm text-muted-foreground">
                A quick look at your latest experiments.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/battles">View all battles</Link>
            </Button>
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentBattles.map((battle) => (
              <Card
                key={battle.id}
                className="flex h-full flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={battle.status === "live" ? "default" : "outline"}
                    >
                      {battle.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      /b/{battle.shortCode}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-snug">
                    {battle.question}
                  </CardTitle>
                  <CardDescription>
                    {battle.serviceDate} · {battle.serviceWindow}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex flex-wrap gap-2">
                    {battle.options.map((opt) => (
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
                  <div className="mt-auto pt-4">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/dashboard/battles/${battle.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </section>
      )}
    </section>
  );
}
