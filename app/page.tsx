import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stack = [
  {
    title: "MongoDB",
    description: "Shared connection helper, users collection, sessions collection, TTL cleanup.",
  },
  {
    title: "Auth",
    description: "Email/password registration, login, and HTTP-only session cookies.",
  },
  {
    title: "OpenRouter",
    description: "Server-side chat connector with optional site and app headers.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
              A
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">APX</p>
              <p className="text-xs text-muted-foreground">MongoDB, auth, OpenRouter</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Sign in"}</Link>
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 pb-0">
              <Badge variant="secondary" className="w-fit">
                Next.js 16 starter
              </Badge>
              <CardTitle className="max-w-3xl text-4xl sm:text-6xl">
                A clean starting point for MongoDB, auth, and OpenRouter.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 sm:text-lg">
                The app is wired for a real backend flow instead of placeholder screens. Register
                or log in, then hit the protected dashboard to test the OpenRouter connector.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary" className="border border-border">
                  <Link href="/login">{user ? "Switch account" : "Get started"}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Session status</CardTitle>
              <CardDescription>
                {user
                  ? `Signed in as ${user.email}.`
                  : "No active session detected."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>{user ? "The session cookie is active and the dashboard is available." : "Use the login page to create an account or sign in."}</p>
              <div className="rounded-lg border border-border bg-muted p-4">
                <p className="font-medium text-foreground">Environment</p>
                <ul className="mt-2 space-y-2">
                  <li>MONGODB_URI for the database connection.</li>
                  <li>OPENROUTER_API_KEY and OPENROUTER_MODEL for AI requests.</li>
                  <li>OPENROUTER_SITE_URL and OPENROUTER_APP_NAME are optional.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stack.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Core
                </Badge>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
