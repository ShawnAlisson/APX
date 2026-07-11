import Link from "next/link";
import { redirect } from "next/navigation";
import ChatPanel from "@/components/chat-panel";
import LogoutButton from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
              A
            </div>
            <div className="grid">
              <p className="text-sm font-semibold leading-none">Dashboard</p>
              <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <Badge className="w-fit">Session</Badge>
              <CardTitle className="text-2xl">
                Welcome back{user.name ? `, ${user.name}` : ""}.
              </CardTitle>
              <CardDescription>
                MongoDB, auth, and OpenRouter are all wired and ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">MongoDB:</span> users and sessions
                are stored in dedicated collections with TTL cleanup for expired sessions.
              </p>
              <p>
                <span className="font-medium text-foreground">Auth:</span> register and login
                endpoints issue opaque, HTTP-only cookies.
              </p>
              <p>
                <span className="font-medium text-foreground">OpenRouter:</span> the chat panel
                calls the server route so your API key stays off the client.
              </p>
            </CardContent>
          </Card>

          <ChatPanel />
        </section>
      </div>
    </main>
  );
}
