import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessByOwnerId } from "@/lib/battles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BattleWizard from "@/components/battle/battle-wizard";

export default async function NewBattlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessByOwnerId(user.id);

  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Create a new battle</CardTitle>
          <CardDescription>
            Describe the idea in plain English for AI, or switch to manual mode and build from
            scratch.
          </CardDescription>
        </CardHeader>
      </Card>
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
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Open profile settings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
