import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWaitlistCount } from "@/lib/battles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WaitlistForm from "@/components/battle/waitlist-form";

const features = [
  {
    title: "Two realistic offers",
    description:
      "AI generates feasible menu concepts from your ingredients and constraints.",
  },
  {
    title: "Escalating commitment",
    description:
      "Vote → register → reserve → optional £1 deposit. Real demand, not opinions.",
  },
  {
    title: "Break-even math",
    description:
      "Proceed, modify, or cancel — backed by revenue and cost projections.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const waitlistCount = await getWaitlistCount().catch(() => 0);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <header className="flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              M
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                MenuBattle
              </p>
              <p className="text-xs text-muted-foreground">
                Test demand before you cook
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? "Dashboard" : "Owner sign in"}
            </Link>
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <Badge variant="secondary">Gamified demand validation</Badge>
              <h1 className="max-w-2xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Turn menu ideas into paid experiments
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Local businesses test two competing offers. Customers back one
                with escalating commitment. You see break-even math and a clear
                proceed / modify / cancel verdict.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium  shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-white dark:text-black"
              >
                Start your first battle — free
              </Link> */}
              <Button asChild variant="outline">
                <Link href="/b/xK9m2p">Try the demo battle</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
              <p className="text-sm font-medium text-foreground">
                Live demo: Team Sweet vs Team Savoury
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Coffee + cake (£6) vs half sandwich, soup & drink (£8). Thu 3–5
                PM. Scan the QR and back your team.
              </p>
            </div>
          </div>

          <WaitlistForm initialCount={waitlistCount} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <Card key={item.title} className="bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-xl border border-border/70 bg-card/80 p-6 text-center">
          <p className="text-sm text-muted-foreground">Freemium pricing</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            First battle free · then £19/battle
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {waitlistCount} businesses on the waitlist
          </p>
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline">
            Owner login
          </Link>
          {" · "}
          <span>Privacy policy (coming soon)</span>
        </footer>
      </div>
    </main>
  );
}
