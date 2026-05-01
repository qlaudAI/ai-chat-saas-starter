// Stash + retrieve a user's qlaud key + plan in Clerk's user metadata.
// This lets us avoid running our own database for v0 — Clerk's
// publicMetadata + privateMetadata are durable per-user and queryable
// by user_id. When you outgrow this (probably around 10K users), swap
// in Postgres / Turso / D1 — same shape, different storage.

import { clerkClient } from "@clerk/nextjs/server";

export type UserPrivate = {
  qlaud_key_id?: string;
  qlaud_key_secret?: string; // private metadata is server-only readable
  plan?: "free" | "pro";
  stripe_customer_id?: string;
};

export type UserPublic = {
  // Anything we want exposed to the browser session safely.
  cap_usd?: number;
  current_thread_id?: string;
};

export async function getUserPrivate(userId: string): Promise<UserPrivate> {
  const cc = await clerkClient();
  const u = await cc.users.getUser(userId);
  return (u.privateMetadata ?? {}) as UserPrivate;
}

export async function getUserPublic(userId: string): Promise<UserPublic> {
  const cc = await clerkClient();
  const u = await cc.users.getUser(userId);
  return (u.publicMetadata ?? {}) as UserPublic;
}

export async function setUserPrivate(
  userId: string,
  patch: Partial<UserPrivate>,
): Promise<void> {
  const cc = await clerkClient();
  const cur = await getUserPrivate(userId);
  await cc.users.updateUser(userId, {
    privateMetadata: { ...cur, ...patch },
  });
}

export async function setUserPublic(
  userId: string,
  patch: Partial<UserPublic>,
): Promise<void> {
  const cc = await clerkClient();
  const cur = await getUserPublic(userId);
  await cc.users.updateUser(userId, {
    publicMetadata: { ...cur, ...patch },
  });
}
