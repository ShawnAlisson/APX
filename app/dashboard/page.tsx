import Link from "next/link";
import { redirect } from "next/navigation";
import ChatPanel from "@/components/chat-panel";
import LogoutButton from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-border bg-surface-strong p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome back{user.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-surface"
            >
              Home
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4 rounded-[2rem] border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-foreground">Stack summary</h2>
            <div className="grid gap-3 text-sm text-muted">
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
            </div>
          </div>

          <ChatPanel />
        </section>
      </div>
    </main>
  );
}
