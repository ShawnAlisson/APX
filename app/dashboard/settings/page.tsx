import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId } from "@/lib/battles";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/logout-button";
import ProfileSettingsForm from "@/components/business/profile-settings-form";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getBusinessByOwnerId(user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between rounded-lg border border-border/70 bg-card/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Owner profile</p>
            <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>
        <ProfileSettingsForm business={business} />
      </div>
    </main>
  );
}
