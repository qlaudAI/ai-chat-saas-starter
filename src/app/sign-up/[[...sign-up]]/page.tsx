import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <main className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-grid" />
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            ai-chat-saas
          </span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-sm",
              card: "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.08)] border border-border rounded-2xl",
              headerTitle: "tracking-tight",
              formButtonPrimary:
                "bg-primary hover:bg-primary/92 text-primary-foreground shadow-sm rounded-lg normal-case",
              footerActionLink: "text-primary hover:text-primary/80",
            },
            variables: {
              colorPrimary: "hsl(0, 72%, 51%)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </div>
    </main>
  );
}
