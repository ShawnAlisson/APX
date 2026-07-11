import { getWaitlistCount } from "@/lib/battles";
import EarlyAccessForm from "@/components/battle/early-access-form";

const highlights = [
  {
    title: "Find out what customers are ready to buy",
    description: "Build offers around clear demand signals instead of assumptions.",
  },
  {
    title: "Identify the best days, times and offers",
    description: "Choose launch windows and promotions with more confidence.",
  },
  {
    title: "Turn feedback into better business decisions",
    description: "Use what people actually want to shape your next test.",
  },
];

const bullets = [
  {
    title: "Find out what customers are ready to buy",
    description: "Go straight to the offers that already have demand behind them.",
  },
  {
    title: "Identify the best days, times and offers",
    description: "Use interest signals to decide when to launch, schedule or promote.",
  },
  {
    title: "Turn feedback into better business decisions",
    description: "Spend less on guesswork and more on the ideas that can pay back.",
  },
];

export default async function Home() {
  const waitlistCount = await getWaitlistCount().catch(() => 0);

  return (
    <main className="min-h-screen bg-background px-4 py-7 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="font-semibold tracking-tight">MenuBattle</div>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground">
            Proof-first minimal v2
          </span>
        </header>

        <section className="mx-auto max-w-4xl text-center">
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Stop guessing. Your customers already know how your business could grow.
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            Test new menus, events, services and opening hours before you commit time and money.
            Ask your customers what they want, measure genuine demand and discover which ideas are
            most likely to bring in more revenue.
          </p>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-[20px] border border-border/70 bg-card p-5 text-left shadow-sm">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </section>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[26px] border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-left text-xl font-semibold leading-8 sm:text-[1.35rem]">
              Be among the first local businesses to use customer insight to test ideas and uncover
              new opportunities for growth.
            </h2>
            <p className="mt-3 text-left text-sm leading-7 text-muted-foreground sm:text-base">
              This version keeps the message focused and removes the extra badges, so the page feels
              cleaner while still driving the same conversion action.
            </p>

            <div className="mt-6 grid gap-3">
              {bullets.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-left"
                >
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside>
            <EarlyAccessForm />
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="font-semibold">Test new ideas</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Menus, events, services and opening hours.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="font-semibold">Learn faster</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Measure genuine demand before you spend.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <p className="font-semibold">{waitlistCount} businesses on the waitlist</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Join the early access list and we&apos;ll keep you posted.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
