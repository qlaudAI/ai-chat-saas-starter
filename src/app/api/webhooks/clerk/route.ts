// Clerk → us. Fires when a user is created. We mint a qlaud key with
// the free-tier cap and stash it in the user's privateMetadata.
//
// Configure in Clerk dashboard → Webhooks → endpoint pointing at
// `https://<your-host>/api/webhooks/clerk`, subscribed to `user.created`.

import { Webhook } from "svix";
import { mintUserKey } from "@/lib/qlaud";
import { setUserPrivate, setUserPublic } from "@/lib/user-metadata";

const FREE_TIER_CAP_USD = 2;

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response("server misconfigured", { status: 503 });

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("missing svix headers", { status: 400 });
  }

  const body = await req.text();
  let event: { type: string; data: { id: string; email_addresses: Array<{ email_address: string }> } };
  try {
    event = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  if (event.type === "user.created") {
    const userId = event.data.id;
    const email = event.data.email_addresses[0]?.email_address ?? "";

    // Mint their qlaud key with the free-tier cap.
    const key = await mintUserKey({ userId, email, capUsd: FREE_TIER_CAP_USD });

    await setUserPrivate(userId, {
      qlaud_key_id: key.id,
      qlaud_key_secret: key.secret,
      plan: "free",
    });
    await setUserPublic(userId, { cap_usd: FREE_TIER_CAP_USD });

    return Response.json({ ok: true, minted: key.id });
  }

  return Response.json({ ok: true, ignored: event.type });
}
