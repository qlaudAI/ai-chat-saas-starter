"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cap: "$2 / mo of model usage",
    features: [
      "Persisted chat history",
      "Streaming responses",
      "Hard spend cap (no surprise bills)",
    ],
    cta: "Current plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$15",
    cap: "$50 / mo of model usage",
    features: [
      "Everything in Free",
      "Priority models (Sonnet, GPT-4)",
      "Higher spend cap",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
    highlighted: true,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    if (!isSignedIn) {
      window.location.href = "/sign-up?redirect_url=/pricing";
      return;
    }
    setBusy(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const body = (await res.json()) as { url?: string };
    if (body.url) window.location.href = body.url;
    else setBusy(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <div className="mb-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple, capped pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Both tiers include a hard spending cap enforced at the gateway.
          No surprise bills, ever.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {TIERS.map((t) => (
          <Card
            key={t.name}
            className={
              t.highlighted
                ? "relative border-foreground/20 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_24px_48px_rgba(0,0,0,0.08)]"
                : ""
            }
          >
            {t.highlighted && (
              <Badge
                variant="default"
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 shadow-sm"
              >
                Recommended
              </Badge>
            )}
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-baseline justify-between">
                <CardTitle className="text-lg">{t.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight">
                  {t.price}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <CardDescription>{t.cap}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={t.disabled ? undefined : upgrade}
                disabled={t.disabled || busy}
                variant={t.highlighted ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                {busy && !t.disabled ? "Redirecting…" : t.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Cancel anytime. Powered by Stripe. Hard caps enforced by qlaud — your
        cap is the maximum you&apos;ll ever be billed.
      </p>
    </main>
  );
}
