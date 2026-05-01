// Server-side qlaud client — wraps the four endpoints this app uses.
//
// Why no SDK: qlaud's HTTP API is small enough that raw fetch is
// cleaner than a client lib. Drop in the @qlaud/sdk if/when one ships
// with edge-runtime support.
//
// All routes accept the master key for admin operations (mint, list,
// usage) and per-user keys for inference (chat, threads). Be careful
// to use the right one — leaking the master key into a client-side
// request would be a serious bug.

const QLAUD_BASE = "https://api.qlaud.ai";
const MASTER_KEY = process.env.QLAUD_MASTER_KEY!;

export type MintedKey = {
  id: string;
  secret: string;
  name: string;
  scope: "standard" | "admin";
  max_spend_usd: number | null;
  created_at: number;
};

export type Thread = {
  id: string;
  end_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: number;
};

/** Mint a per-user qlaud key with a hard spending cap. Call this once
 *  per signup (in the Clerk webhook). Store the returned `secret` on
 *  the user — qlaud will never return it again. */
export async function mintUserKey(opts: {
  userId: string;
  email: string;
  capUsd: number;
}): Promise<MintedKey> {
  const res = await fetch(`${QLAUD_BASE}/v1/keys`, {
    method: "POST",
    headers: {
      "x-api-key": MASTER_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: `user_${opts.userId}_${opts.email}`,
      scope: "standard",
      max_spend_usd: opts.capUsd,
    }),
  });
  if (!res.ok) {
    throw new Error(`qlaud /v1/keys ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as MintedKey;
}

/** Bump (or lower) a user's spend cap. Used when they upgrade to a
 *  paid tier — Stripe webhook fires, we patch the cap up. */
export async function updateUserCap(
  qlaudKeyId: string,
  newCapUsd: number,
): Promise<void> {
  const res = await fetch(`${QLAUD_BASE}/v1/keys/${qlaudKeyId}`, {
    method: "PATCH",
    headers: {
      "x-api-key": MASTER_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ max_spend_usd: newCapUsd }),
  });
  if (!res.ok) {
    throw new Error(`qlaud /v1/keys/:id PATCH ${res.status}: ${await res.text()}`);
  }
}

/** Get a user's spend rollup (used for the in-app usage page + admin). */
export async function getUserUsage(
  qlaudKeyId: string,
): Promise<{
  spent_usd: number;
  cap_usd: number | null;
  by_model: Array<{ model: string; cost_usd: number }>;
}> {
  const res = await fetch(`${QLAUD_BASE}/v1/keys/${qlaudKeyId}/usage`, {
    headers: { "x-api-key": MASTER_KEY },
  });
  if (!res.ok) throw new Error(`qlaud usage ${res.status}`);
  const body = (await res.json()) as {
    cost_micros?: number;
    cap_micros?: number | null;
    by_model?: Array<{ model: string; cost_micros: number }>;
  };
  return {
    spent_usd: (body.cost_micros ?? 0) / 1_000_000,
    cap_usd:
      body.cap_micros != null ? body.cap_micros / 1_000_000 : null,
    by_model: (body.by_model ?? []).map((m) => ({
      model: m.model,
      cost_usd: m.cost_micros / 1_000_000,
    })),
  };
}

/** Create a thread for a user. Each user can have many threads
 *  (one per conversation), all scoped by end_user_id so qlaud's
 *  search + analytics partition correctly. */
export async function createThread(
  userQlaudKey: string,
  endUserId: string,
  metadata?: Record<string, unknown>,
): Promise<Thread> {
  const res = await fetch(`${QLAUD_BASE}/v1/threads`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${userQlaudKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ end_user_id: endUserId, metadata }),
  });
  if (!res.ok) throw new Error(`qlaud threads ${res.status}`);
  return (await res.json()) as Thread;
}

/** Stream a chat turn through qlaud. Returns the upstream Response so
 *  the caller can pipe it directly back to the client. qlaud loads
 *  prior history server-side — we just send the new user message. */
export async function streamMessage(opts: {
  userQlaudKey: string;
  threadId: string;
  model: string;
  userMessage: string;
  toolsMode?: "dynamic" | "tenant" | "explicit";
}): Promise<Response> {
  return fetch(
    `${QLAUD_BASE}/v1/threads/${opts.threadId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${opts.userQlaudKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 2048,
        stream: true,
        content: [{ type: "text", text: opts.userMessage }],
        tools_mode: opts.toolsMode ?? "tenant",
      }),
    },
  );
}

/** List a user's threads (for the conversation sidebar). */
export async function listUserThreads(
  userQlaudKey: string,
  endUserId: string,
): Promise<Thread[]> {
  const res = await fetch(
    `${QLAUD_BASE}/v1/threads?end_user_id=${encodeURIComponent(endUserId)}&limit=50`,
    { headers: { authorization: `Bearer ${userQlaudKey}` } },
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: Thread[] };
  return body.data ?? [];
}
