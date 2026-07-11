import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import BattleWizard from "@/components/battle/battle-wizard";
import LogoutButton from "@/components/logout-button";

export default async function NewBattlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#faf6f1] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between rounded-lg border bg-white/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#3d2914]">MenuBattle</p>
            <p className="text-xs text-muted-foreground">Create a new battle</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>
        <BattleWizard />
      </div>
    </main>
  );
}
