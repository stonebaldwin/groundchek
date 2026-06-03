"use client";
import { useState } from "react";
import { Button, Input, useToast } from "@groundbreak/ui";

export function CoverageRequestForm({ defaultMarket = "" }: { defaultMarket?: string }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [market, setMarket] = useState(defaultMarket);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/coverage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, market }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
      toast({ title: "Request received", description: `We'll prioritize ${market || "your market"}.`, tone: "success" });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-ink-soft">
        Thanks — we&apos;ll let you know when {market || "your market"} is live.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        required
        aria-label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        aria-label="City or ZIP"
        placeholder="City / ZIP"
        value={market}
        onChange={(e) => setMarket(e.target.value)}
      />
      <Button type="submit" loading={submitting} className="shrink-0">
        Request market
      </Button>
    </form>
  );
}
