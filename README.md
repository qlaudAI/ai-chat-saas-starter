# ai-chat-saas-starter

A production-ready, billable AI chat app you can clone and ship in an afternoon.

```
[ Clerk auth ] → [ Stripe billing ] → [ qlaud per-user keys ] → [ Claude / GPT ]
```

What you get out of the box:

- **Sign up & login** via Clerk
- **Streaming chat** with persisted threads (no DB to manage — qlaud holds history)
- **Per-user spend caps** enforced at the gateway (free tier $2, paid $50)
- **Stripe subscription checkout** with webhook → cap upgrade
- **Usage dashboard** (spend, by-model breakdown, plan)
- ~600 lines of code total. No mocks. No `// TODO`s.

Built on [qlaud](https://qlaud.ai) — the managed AI stack (gateway + threads + tools + per-user billing).

---

## Deploy to Vercel — one click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FqlaudAI%2Fai-chat-saas-starter&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,CLERK_WEBHOOK_SECRET,QLAUD_MASTER_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,STRIPE_PRICE_ID_PRO,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,NEXT_PUBLIC_APP_URL&envDescription=Get%20Clerk%20%2B%20qlaud%20%2B%20Stripe%20keys%20before%20clicking%20deploy.&envLink=https%3A%2F%2Fgithub.com%2FqlaudAI%2Fai-chat-saas-starter%23configure-the-3-services&project-name=ai-chat-saas&repository-name=ai-chat-saas)

Vercel will ask for the env vars below. Get them all set up first (15 min), then click deploy. After deploy, point your Clerk + Stripe webhooks at the live URL — see [Post-deploy webhook setup](#post-deploy-webhook-setup).

## Quickstart (local)

```bash
git clone https://github.com/qlaudAI/ai-chat-saas-starter
cd ai-chat-saas-starter
pnpm install
cp .env.example .env.local
# fill in the keys (see below)
pnpm dev
```

Open <http://localhost:3000>, sign up, chat. That's it.

## Configure the 3 services

### 1. Clerk (auth)

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `Secret key` → `CLERK_SECRET_KEY`.
3. Webhooks → Add Endpoint → `https://<your-host>/api/webhooks/clerk`, subscribe to `user.created`. Copy signing secret → `CLERK_WEBHOOK_SECRET`.

### 2. qlaud (LLM gateway + per-user billing)

1. Create a master key at [qlaud.ai/keys](https://qlaud.ai/keys) (scope: `master`).
2. Paste it as `QLAUD_MASTER_KEY` in `.env.local`.

That's it — qlaud handles per-user keys, threads, tools, and spend tracking. The Clerk webhook (`/api/webhooks/clerk`) auto-mints a per-user qlaud key with a $2 cap on signup.

### 3. Stripe (billing)

1. Create a Product at [dashboard.stripe.com/products](https://dashboard.stripe.com/products) — recurring, $15/mo (or your price). Copy the Price ID → `STRIPE_PRICE_ID_PRO`.
2. Webhooks → Add Endpoint → `https://<your-host>/api/webhooks/stripe`, subscribe to `checkout.session.completed`. Copy signing secret → `STRIPE_WEBHOOK_SECRET`.
3. Copy your publishable + secret keys → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.

---

## Architecture

```
Clerk webhook (user.created) ──→ mint qlaud key ($2 cap) ──→ stash in privateMetadata
                                          │
                                          ▼
User chats ──→ /api/chat ──→ qlaud Threads API ──→ stream back to client
                                          │
                                          ▼
            (qlaud auto-rejects with 402 when user hits cap)

Stripe webhook (checkout.session.completed) ──→ updateUserCap($50) ──→ done
```

### Why no database?

For v0, we stash everything we need on the user record:

- `privateMetadata.qlaud_key_id` / `qlaud_key_secret` — the per-user qlaud key
- `privateMetadata.plan` — `"free"` or `"pro"`
- `privateMetadata.stripe_customer_id` — for billing portal links
- `publicMetadata.cap_usd` — user-visible cap (synced when plan changes)
- `publicMetadata.current_thread_id` — last active conversation

When you outgrow that (you'll know — admin queries, multi-thread sidebars), drop in a real DB. The split is contained to [src/lib/user-metadata.ts](src/lib/user-metadata.ts).

---

## Post-deploy webhook setup

The webhook URLs need the live domain, so you can't fully configure them until *after* the first deploy. Once Vercel hands you a URL like `https://ai-chat-saas-xxxx.vercel.app`:

1. **Clerk** → Webhooks → Edit your endpoint → set URL to `https://<your-vercel-url>/api/webhooks/clerk`. Subscribe to `user.created`. Copy the signing secret into the `CLERK_WEBHOOK_SECRET` env var on Vercel and redeploy.
2. **Stripe** → Webhooks → Edit endpoint → set URL to `https://<your-vercel-url>/api/webhooks/stripe`. Subscribe to `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel and redeploy.
3. **Vercel env** → set `NEXT_PUBLIC_APP_URL` to your live URL (used as the Stripe checkout redirect target).

Test the flow: sign up a fresh user, watch the Clerk webhook fire (Clerk dashboard shows the call log), confirm a qlaud key was minted (qlaud.ai/keys), then chat. Then click upgrade, complete a Stripe test card, confirm cap raised on the account page.

## Custom domain on Vercel

Adding a custom domain is two clicks in the Vercel dashboard. After it propagates, update the webhook URLs to use the custom domain (Clerk + Stripe both need to know the new origin) and bump `NEXT_PUBLIC_APP_URL`.

---

## Customizing

| Want to | Edit |
|---|---|
| Change the model | [src/app/api/chat/route.ts](src/app/api/chat/route.ts) → `model: "claude-haiku-4-5"` |
| Change tier caps | [src/app/api/webhooks/clerk/route.ts](src/app/api/webhooks/clerk/route.ts) `FREE_TIER_CAP_USD`, [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts) `PAID_TIER_CAP_USD` |
| Add a 3rd tier | Add a Stripe Price + handle it in the webhook |
| Add tools (web-search, code-exec) | Set them up in qlaud → flip `tools_mode: "tenant"` in [lib/qlaud.ts](src/lib/qlaud.ts) — already on. |
| Use a real DB | Replace the helpers in [src/lib/user-metadata.ts](src/lib/user-metadata.ts) |

---

## Sister projects

- **[discord-ai-bot-template](https://github.com/qlaudAI/discord-ai-bot-template)** — same per-user billing pattern, but a Discord bot. Cloudflare Worker, no infra.
- **[ai-support-widget](https://github.com/qlaudAI/ai-support-widget)** — embeddable chat widget for any website. ~5KB JS.

---

## License

MIT
