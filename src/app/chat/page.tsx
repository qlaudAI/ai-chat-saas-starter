"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useRef } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [capHit, setCapHit] = useState(false);
  const threadIdRef = useRef<string | null>(null);

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }, { role: "assistant", text: "" }]);
    setBusy(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: userMsg, threadId: threadIdRef.current }),
    });

    threadIdRef.current = res.headers.get("x-thread-id") ?? threadIdRef.current;

    if (res.status === 402) {
      setCapHit(true);
      setMessages((m) => {
        const out = [...m];
        out[out.length - 1] = {
          role: "assistant",
          text: "💳 You've hit your spending cap. Upgrade to keep chatting.",
        };
        return out;
      });
      setBusy(false);
      return;
    }

    if (!res.ok || !res.body) {
      setMessages((m) => {
        const out = [...m];
        out[out.length - 1] = { role: "assistant", text: `Error ${res.status}` };
        return out;
      });
      setBusy(false);
      return;
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let acc = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      // Anthropic-shape SSE — naive extraction of text deltas.
      const matches = acc.matchAll(/"delta":\s*\{"type":"text_delta","text":"([^"]*)"\}/g);
      let combined = "";
      for (const m of matches) combined += m[1].replace(/\\n/g, "\n");
      setMessages((m) => {
        const out = [...m];
        out[out.length - 1] = { role: "assistant", text: combined };
        return out;
      });
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <div className="text-xs text-muted-foreground">
            Signed in as {user?.primaryEmailAddress?.emailAddress}
          </div>
        </div>
        <a
          href="/account"
          className="rounded border border-border px-3 py-1 text-sm hover:border-primary"
        >
          Account
        </a>
      </header>

      <div className="my-4 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Say something to start the conversation.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-2xl rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-card border border-border"
            }`}
          >
            <div className="whitespace-pre-wrap text-sm">
              {m.text || (m.role === "assistant" && busy ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {capHit && (
        <div className="mb-3 rounded border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          You hit your free-tier cap.{" "}
          <a href="/pricing" className="underline">
            Upgrade
          </a>{" "}
          to keep chatting.
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-md border border-border bg-background px-4 py-2"
          disabled={busy}
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
