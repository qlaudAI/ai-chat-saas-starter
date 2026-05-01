// Server-side chat endpoint — proxies the client's message through
// qlaud's Threads API and pipes the SSE response straight back.
// The user's qlaud key never reaches the browser; we look it up
// server-side from Clerk metadata.

import { auth } from "@clerk/nextjs/server";
import { createThread, streamMessage } from "@/lib/qlaud";
import { getUserPrivate, getUserPublic, setUserPublic } from "@/lib/user-metadata";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return new Response("unauthorized", { status: 401 });

  const body = (await req.json()) as { message: string; threadId?: string };
  if (!body.message) return new Response("missing message", { status: 400 });

  const priv = await getUserPrivate(userId);
  if (!priv.qlaud_key_secret) {
    return new Response("user has no qlaud key — Clerk webhook didn't fire?", {
      status: 503,
    });
  }

  // Reuse the active thread, or create one if this is the first turn.
  let threadId = body.threadId;
  if (!threadId) {
    const pub = await getUserPublic(userId);
    threadId = pub.current_thread_id;
  }
  if (!threadId) {
    const thread = await createThread(priv.qlaud_key_secret, userId);
    threadId = thread.id;
    await setUserPublic(userId, { current_thread_id: threadId });
  }

  const upstream = await streamMessage({
    userQlaudKey: priv.qlaud_key_secret,
    threadId,
    model: "claude-haiku-4-5",
    userMessage: body.message,
  });

  // Forward status (so 402 reaches the client cleanly when cap is hit).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "text/event-stream",
      "x-thread-id": threadId,
    },
  });
}
