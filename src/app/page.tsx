import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> AI Chat SaaS Starter
      </div>
      <h1 className="mt-6 text-5xl font-bold tracking-tight">
        A paid AI chat app
        <br />
        <span className="text-primary">that bills per user.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Clone, set 2 env vars, ship. You get sign-up + Stripe + persisted
        threads + per-user spending caps + an admin dashboard. Built on{" "}
        <a href="https://qlaud.ai" className="text-primary underline">
          qlaud
        </a>
        .
      </p>
      <div className="mt-10 flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          Get started — free
        </Link>
        <Link
          href="/pricing"
          className="rounded-md border border-border px-6 py-3 font-medium hover:border-primary"
        >
          See pricing
        </Link>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        <Feature
          title="Per-user spending caps"
          body="Hard caps enforced at the gateway. One bad-actor user can't burn your wallet."
        />
        <Feature
          title="Persisted threads"
          body="Conversation history lives server-side. Refresh, switch devices — it's there."
        />
        <Feature
          title="Stripe billing on rails"
          body="Free tier with cap → upgrade button → Stripe checkout → cap raised. ~30 lines."
        />
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
