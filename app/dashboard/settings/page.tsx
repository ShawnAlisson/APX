import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId } from "@/lib/battles";
import { Button } from "@/components/ui/button";
import ProfileSettingsForm from "@/components/business/profile-settings-form";

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getBusinessByOwnerId(user.id);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-foreground">Owner profile</p>
        <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
      <ProfileSettingsForm business={business} />
    </section>
  );
}
