import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  MessageSquare,
  CreditCard,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-grid" />

      <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              ai-chat-saas
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a
                href="https://github.com/qlaudAI/ai-chat-saas-starter"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </Button>
            <Button asChild size="sm" className="ml-1">
              <Link href="/sign-up">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="soft"
            className="mb-6 px-3 py-1 text-[11px] uppercase tracking-wider"
          >
            Built on qlaud
          </Badge>
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            A paid AI chat app that{" "}
            <span className="text-primary">bills per user.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
            Clone, set 3 env vars, ship. You get sign-up, Stripe billing,
            persisted threads, hard per-user spending caps, and a usage
            dashboard. ~600 lines, no mocks, no <code>// TODO</code>s.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Free tier $2 cap · No credit card · Upgrade anytime
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Gauge className="h-5 w-5" />}
            title="Per-user spending caps"
            body="Hard caps enforced at the gateway. One bad-actor user can't burn your wallet."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5" />}
            title="Persisted threads"
            body="Conversation history lives server-side. Refresh, switch devices — it's there."
          />
          <Feature
            icon={<CreditCard className="h-5 w-5" />}
            title="Stripe billing on rails"
            body="Free tier with cap → upgrade button → Stripe checkout → cap raised. ~30 LOC."
          />
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <div>
            Built with{" "}
            <a
              className="underline-offset-4 hover:text-foreground hover:underline"
              href="https://qlaud.ai"
            >
              qlaud
            </a>
            ,{" "}
            <a
              className="underline-offset-4 hover:text-foreground hover:underline"
              href="https://clerk.com"
            >
              Clerk
            </a>
            , and{" "}
            <a
              className="underline-offset-4 hover:text-foreground hover:underline"
              href="https://stripe.com"
            >
              Stripe
            </a>
            .
          </div>
          <div>MIT licensed · qlaudAI/ai-chat-saas-starter</div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)]">
      <CardHeader className="space-y-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="leading-relaxed">{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}
