"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, useToast } from "@groundbreak/ui";
import { signUp } from "@/lib/auth-client";
import type { Plan } from "@/lib/entitlements";

export function SignupForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signUp.email({ email, password, name });
    if (res.error) {
      setLoading(false);
      toast({ title: "Sign-up failed", description: res.error.message ?? "", tone: "danger" });
      return;
    }
    // Paid plan → straight to Stripe Checkout; free → dashboard.
    if (plan && plan !== "free") {
      try {
        const checkout = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan, cycle: "monthly" }),
        });
        const data = (await checkout.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        // fall through to dashboard
      }
    }
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Agent" />
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <Input label="Password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      <Button type="submit" loading={loading} className="w-full">
        {plan && plan !== "free" ? `Create account & continue to ${plan}` : "Create account"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
