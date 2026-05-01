"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [capHit, setCapHit] = useState(false);
  const threadIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: userMsg },
      { role: "assistant", text: "" },
    ]);
    setBusy(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: userMsg, threadId: threadIdRef.current }),
    });

    threadIdRef.current =
      res.headers.get("x-thread-id") ?? threadIdRef.current;

    if (res.status === 402) {
      setCapHit(true);
      setMessages((m) => {
        const out = [...m];
        out[out.length - 1] = {
          role: "assistant",
          text: "You've hit your spending cap. Upgrade to keep chatting.",
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
      const matches = acc.matchAll(
        /"delta":\s*\{"type":"text_delta","text":"([^"]*)"\}/g,
      );
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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Chat</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/account">Account</Link>
            </Button>
            <UserButton
              appearance={{ elements: { avatarBox: "h-7 w-7" } }}
            />
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
          {empty && (
            <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center animate-fade-in-up">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                How can I help today?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Signed in as {user?.primaryEmailAddress?.emailAddress}
              </p>
              <div className="mt-8 grid w-full gap-2 text-left">
                {[
                  "Explain quantum entanglement to a 12-year-old",
                  "Draft a friendly cold-email to a new prospect",
                  "Write a SQL query to find duplicate rows",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble
              key={i}
              role={m.role}
              text={m.text}
              busy={busy && m.role === "assistant" && !m.text}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {capHit && (
            <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              You hit your free-tier cap.{" "}
              <Link href="/pricing" className="font-medium underline">
                Upgrade
              </Link>{" "}
              to keep chatting.
            </div>
          )}
          <div className="relative rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-foreground/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Send a message…"
              rows={1}
              disabled={busy}
              className="block w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 pr-12 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
              style={{ maxHeight: 200 }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/92 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Powered by qlaud · Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  text,
  busy,
}: {
  role: "user" | "assistant";
  text: string;
  busy: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex animate-fade-in-up gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 pt-0.5">
        {busy ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex h-5 items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:400ms]" />
    </div>
  );
}
