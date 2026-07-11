import Link from "next/link";

const templates = [
  {
    title: "Split hero",
    href: "/mockups/template-1.html",
    description: "Classic SaaS-style lead gen with a strong hero and a right-side form.",
  },
  {
    title: "Proof first",
    href: "/mockups/template-2.html",
    description: "Centered headline, proof strips, and a story-led signup path.",
  },
  {
    title: "Minimal lead gen",
    href: "/mockups/template-3.html",
    description: "Simple, editorial, and focused on one clear conversion action.",
  },
  {
    title: "Minimal lead gen v2",
    href: "/mockups/template-3-v2.html",
    description: "Mockup 3 refreshed with mockup 2's palette and tighter hierarchy.",
  },
];

export default function MockupsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Landing page mockups
          </p>
          <h1 className="mt-2 text-3xl font-bold">Three conversion-oriented layouts</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Open any template directly in the browser, or use the gallery below to compare the
            three approaches side by side.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <article key={template.title} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{template.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
              <Link
                href={template.href}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Open template
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {templates.map((template) => (
            <div key={template.title} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border/70 px-4 py-3">
                <p className="text-sm font-semibold">{template.title}</p>
                <p className="text-xs text-muted-foreground">{template.href}</p>
              </div>
              <iframe
                title={template.title}
                src={template.href}
                className="h-[900px] w-full bg-background"
                loading="lazy"
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
