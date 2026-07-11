import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

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
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-surface-strong px-6 py-10 shadow-2xl shadow-black/25 sm:px-10 sm:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              Next.js 16 starter
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              A clean starting point for MongoDB, auth, and OpenRouter.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              The app is wired for a real backend flow instead of placeholder screens. Register or
              log in, then hit the protected dashboard to test the OpenRouter connector.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
            >
              {user ? "Switch account" : "Get started"}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-surface"
            >
              Open dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stack.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-border bg-surface p-6"
            >
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-accent-warm">
                Core
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[2rem] border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-foreground">Session status</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {user
                ? `Signed in as ${user.email}. The session cookie is active and the dashboard is available.`
                : "No active session detected. Use the login page to create an account or sign in."}
            </p>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-foreground">Environment</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <span className="font-medium text-foreground">MONGODB_URI</span> for the database
                connection.
              </li>
              <li>
                <span className="font-medium text-foreground">OPENROUTER_API_KEY</span> and{" "}
                <span className="font-medium text-foreground">OPENROUTER_MODEL</span> for AI
                requests.
              </li>
              <li>
                <span className="font-medium text-foreground">OPENROUTER_SITE_URL</span> and{" "}
                <span className="font-medium text-foreground">OPENROUTER_APP_NAME</span> are
                optional but recommended.
              </li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
