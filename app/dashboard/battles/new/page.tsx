import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId } from "@/lib/battles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BattleWizard from "@/components/battle/battle-wizard";
import LogoutButton from "@/components/logout-button";

export default async function NewBattlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessByOwnerId(user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Create a new battle</p>
            <p className="text-xs text-muted-foreground">Use your saved business profile details</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">Profile settings</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>
        {business ? (
          <BattleWizard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Set up your business profile first</CardTitle>
              <CardDescription>
                Add your business name and URL in profile settings before publishing battles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/settings">Open profile settings</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
