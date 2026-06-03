"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, useToast } from "@groundbreak/ui";
import { signIn } from "@/lib/auth-client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Only honor same-site relative paths for ?next= — block open-redirects to
  // external origins (e.g. ?next=https://evil.com or //evil.com).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      toast({ title: "Sign-in failed", description: res.error.message ?? "Check your credentials.", tone: "danger" });
    } else {
      router.push(safeNext);
      router.refresh();
    }
  }

  async function withMagicLink() {
    if (!email) {
      toast({ title: "Enter your email first", tone: "warning" });
      return;
    }
    const res = await signIn.magicLink({ email, callbackURL: safeNext });
    if (res.error) {
      toast({ title: "Could not send link", description: res.error.message ?? "", tone: "danger" });
    } else {
      toast({ title: "Check your email", description: "We sent you a one-time sign-in link.", tone: "success" });
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={withPassword} className="space-y-3">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={withMagicLink}>
        Email me a magic link
      </Button>
      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
