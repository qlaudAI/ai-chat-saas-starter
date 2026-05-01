"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

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
    cta: "Upgrade",
    disabled: false,
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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-center text-4xl font-bold tracking-tight">Pricing</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Both tiers include a hard spending cap. No surprise bills.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-border bg-card p-8"
          >
            <div className="text-xl font-semibold">{t.name}</div>
            <div className="mt-2 text-4xl font-bold">
              {t.price}
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{t.cap}</div>
            <ul className="mt-6 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={t.disabled ? undefined : upgrade}
              disabled={t.disabled || busy}
              className={`mt-6 w-full rounded-md px-4 py-2 font-medium ${
                t.disabled
                  ? "border border-border text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              } disabled:opacity-50`}
            >
              {busy && !t.disabled ? "Redirecting…" : t.cta}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
