import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBattleByShortCode } from "@/lib/battles";

type PageProps = {
  params: Promise<{ shortCode: string }>;
};

export default async function BattleResultPage({ params }: PageProps) {
  const { shortCode } = await params;
  const battle = await getBattleByShortCode(shortCode);

  if (!battle) {
    notFound();
  }

  const winner = battle.options.find((o) => o.id === battle.winnerOptionId);
  const loser = battle.options.find((o) => o.id !== battle.winnerOptionId);

  if (battle.status === "failed") {
    return (
      <main className="demo-page flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.28em] text-white/55">{battle.business?.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          This service did not reach the booking threshold.
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
          Neither team hit the {battle.minBookings} booking minimum. Your £1 deposit becomes café
          credit. Try next week&apos;s battle.
        </p>
        <Button asChild className="rounded-full bg-white px-6 text-black hover:bg-white/90">
          <Link href={`/b/${shortCode}`}>Back to battle</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="demo-page relative flex min-h-screen items-center justify-center overflow-hidden p-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-16 h-56 w-56 rounded-full bg-[#d38b4d]/20 blur-3xl" />
        <div className="absolute right-[-6%] top-24 h-72 w-72 rounded-full bg-[#f6d6b8]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_380px]">
        <section className="demo-panel overflow-hidden rounded-[32px]">
          <div className="relative">
            {winner?.imageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={winner.imageUrl}
                  alt={winner.name}
                  className="h-[340px] w-full object-cover sm:h-[420px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120d0d] via-black/30 to-transparent" />
              </>
            )}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="demo-on-image-soft text-sm uppercase tracking-[0.3em]">
                {battle.business?.name}
              </p>
              <h1 className="demo-on-image mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
                {winner?.name ?? "Winner"} wins.
              </h1>
              <p className="demo-on-image-muted mt-4 max-w-2xl text-sm leading-7 sm:text-base">
                The crowd picked {winner?.description?.toLowerCase() ?? "the winning dish"}.
                Show this page on {battle.serviceDate} during {battle.serviceWindow}.
              </p>
            </div>
          </div>
        </section>

        <Card className="demo-panel self-center rounded-[32px] border-0 text-white shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold" style={{ color: winner?.teamColor }}>
              Service summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="demo-panel-soft rounded-[22px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Winning dish</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {winner?.name} · £{winner?.price.toFixed(2)}
              </p>
              <p className="mt-2 leading-6 text-white/68">{winner?.description}</p>
            </div>

            <p className="rounded-[22px] bg-emerald-500/14 p-4 leading-6 text-emerald-100">
              <strong>Winner backers:</strong> your £1 is credited off your order. See you{" "}
              {battle.serviceDate}.
            </p>

            {loser && (
              <p className="rounded-[22px] bg-white/6 p-4 leading-6 text-white/70">
                <strong>{loser.name} backers:</strong> your £1 deposit becomes café credit for the
                next service.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <Link href={`/b/${shortCode}`}>View battle page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
