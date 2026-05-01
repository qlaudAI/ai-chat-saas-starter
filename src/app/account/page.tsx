// Usage + plan page. Reads the qlaud spend rollup server-side
// (the master key never crosses the wire) and renders it.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserUsage } from "@/lib/qlaud";
import { getUserPrivate, getUserPublic } from "@/lib/user-metadata";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const priv = await getUserPrivate(userId);
  const pub = await getUserPublic(userId);

  if (!priv.qlaud_key_id) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-4 text-muted-foreground">
          We haven&apos;t minted a qlaud key for you yet — the Clerk webhook
          may not be configured. See the README for setup.
        </p>
      </main>
    );
  }

  const usage = await getUserUsage(priv.qlaud_key_id);
  const pct =
    usage.cap_usd && usage.cap_usd > 0
      ? Math.min(100, (usage.spent_usd / usage.cap_usd) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Account</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        Plan: <span className="font-medium">{priv.plan ?? "free"}</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-muted-foreground">Usage this period</div>
          <div className="text-sm">
            ${usage.spent_usd.toFixed(4)} / $
            {(usage.cap_usd ?? pub.cap_usd ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct >= 80 && (
          <div className="mt-3 text-xs text-primary">
            You&apos;re approaching your cap.{" "}
            <a href="/pricing" className="underline">
              Upgrade
            </a>{" "}
            to keep chatting without interruption.
          </div>
        )}
      </div>

      {usage.by_model.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="text-sm font-medium">By model</div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {usage.by_model.map((m) => (
                <tr key={m.model} className="border-t border-border">
                  <td className="py-2">{m.model}</td>
                  <td className="py-2 text-right tabular-nums">
                    ${m.cost_usd.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <a
          href="/chat"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Back to chat
        </a>
        {priv.plan !== "pro" && (
          <a
            href="/pricing"
            className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary"
          >
            Upgrade
          </a>
        )}
      </div>
    </main>
  );
}
