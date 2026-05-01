// Usage + plan page. Reads the qlaud spend rollup server-side
// (the master key never crosses the wire) and renders it.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getUserUsage } from "@/lib/qlaud";
import { getUserPrivate, getUserPublic } from "@/lib/user-metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const priv = await getUserPrivate(userId);
  const pub = await getUserPublic(userId);

  if (!priv.qlaud_key_id) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-4 text-muted-foreground">
          We haven&apos;t minted a qlaud key for you yet — the Clerk webhook
          may not be configured. See the README for setup.
        </p>
      </main>
    );
  }

  const usage = await getUserUsage(priv.qlaud_key_id);
  const cap = usage.cap_usd ?? pub.cap_usd ?? 0;
  const pct = cap > 0 ? Math.min(100, (usage.spent_usd / cap) * 100) : 0;
  const plan = priv.plan ?? "free";

  return (
    <main className="mx-auto max-w-2xl px-6 pb-20 pt-10">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/chat">
            <ArrowLeft className="h-4 w-4" /> Back to chat
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usage rollup powered by qlaud.
          </p>
        </div>
        <Badge
          variant={plan === "pro" ? "default" : "soft"}
          className="capitalize"
        >
          {plan}
        </Badge>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-baseline justify-between">
            <CardTitle>Usage this period</CardTitle>
            <span className="text-sm tabular-nums text-muted-foreground">
              ${usage.spent_usd.toFixed(4)} / ${cap.toFixed(2)}
            </span>
          </div>
          <CardDescription>
            Hard cap enforced at the gateway. You&apos;ll never be charged
            more than your cap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
          {pct >= 80 && plan !== "pro" && (
            <p className="mt-3 text-xs text-primary">
              You&apos;re approaching your cap.{" "}
              <Link href="/pricing" className="font-medium underline">
                Upgrade
              </Link>{" "}
              to keep chatting without interruption.
            </p>
          )}
        </CardContent>
      </Card>

      {usage.by_model.length > 0 && (
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle>By model</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-0">
              {usage.by_model.map((m, i) => (
                <li key={m.model}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.model}
                    </span>
                    <span className="text-sm tabular-nums">
                      ${m.cost_usd.toFixed(4)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/chat">Back to chat</Link>
        </Button>
        {plan !== "pro" && (
          <Button asChild variant="outline">
            <Link href="/pricing">
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </main>
  );
}
