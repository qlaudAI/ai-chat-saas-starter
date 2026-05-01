// Stripe → us. Fires on successful checkout. We bump the user's qlaud
// cap to the paid-tier limit.
//
// Configure in Stripe → Webhooks → endpoint at
// `https://<your-host>/api/webhooks/stripe`, subscribed to
// `checkout.session.completed`.

import Stripe from "stripe";
import { updateUserCap } from "@/lib/qlaud";
import { getUserPrivate, setUserPrivate, setUserPublic } from "@/lib/user-metadata";

const PAID_TIER_CAP_USD = 50;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("missing", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      secret,
      300,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    if (!userId) return new Response("no user_id", { status: 400 });

    // Pull this user's qlaud key id from Clerk metadata.
    const meta = await getUserPrivate(userId);
    if (!meta.qlaud_key_id) return new Response("no qlaud key on user", { status: 400 });

    // Bump the cap.
    await updateUserCap(meta.qlaud_key_id, PAID_TIER_CAP_USD);

    await setUserPrivate(userId, {
      plan: "pro",
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : undefined,
    });
    await setUserPublic(userId, { cap_usd: PAID_TIER_CAP_USD });

    return Response.json({ ok: true, upgraded: userId });
  }

  return Response.json({ ok: true, ignored: event.type });
}
