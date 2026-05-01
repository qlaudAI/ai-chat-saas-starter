// Creates a Stripe Checkout session for the signed-in user. The
// completed checkout fires `checkout.session.completed` to our
// webhook (see api/webhooks/stripe/route.ts), which raises the
// user's qlaud cap.

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return new Response("unauthorized", { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO!, quantity: 1 }],
    customer_email: email,
    client_reference_id: userId,
    metadata: { user_id: userId },
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/pricing`,
  });

  return Response.json({ url: session.url });
}
