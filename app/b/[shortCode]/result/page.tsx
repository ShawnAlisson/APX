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
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf6f1] p-6 text-center">
        <p className="text-sm text-muted-foreground">{battle.business?.name}</p>
        <h1 className="text-2xl font-bold text-[#3d2914]">Battle did not reach minimum bookings</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Neither team hit the {battle.minBookings} booking minimum. Your £1 deposit becomes café
          credit. Try next week&apos;s battle.
        </p>
        <Button asChild variant="outline">
          <Link href={`/b/${shortCode}`}>Back to battle</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#faf6f1] p-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{battle.business?.name}</p>
        <h1 className="mt-2 text-3xl font-bold text-[#3d2914]">
          {winner?.name ?? "Winner"} wins!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Show this page {battle.serviceDate} {battle.serviceWindow}
        </p>
      </div>

      <Card className="w-full max-w-md border-0 shadow-md" style={{ borderTopColor: winner?.teamColor, borderTopWidth: 4 }}>
        <CardHeader>
          <CardTitle style={{ color: winner?.teamColor }}>{winner?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{winner?.description} — £{winner?.price.toFixed(2)}</p>
          <p className="rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-950/30 dark:text-green-300">
            <strong>Winner backers:</strong> Your £1 is credited off your order. See you{" "}
            {battle.serviceDate}!
          </p>
          {loser && (
            <p className="rounded-lg bg-muted p-3 text-muted-foreground">
              <strong>{loser.name} backers:</strong> Your team didn&apos;t win. Your £1 deposit
              becomes café credit. Try next week&apos;s battle.
            </p>
          )}
        </CardContent>
      </Card>

      <Button asChild>
        <Link href={`/b/${shortCode}`}>View battle page</Link>
      </Button>
    </main>
  );
}
