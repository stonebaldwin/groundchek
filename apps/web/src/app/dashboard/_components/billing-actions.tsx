"use client";
import { useState } from "react";
import { Button, useToast } from "@groundbreak/ui";
import type { Plan } from "@/lib/entitlements";

export function UpgradeButton({
  plan,
  label,
  variant = "primary",
}: {
  plan: Plan;
  label: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, cycle: "monthly" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else toast({ title: "Billing unavailable", description: data.error ?? "Try again later.", tone: "warning" });
    } catch {
      toast({ title: "Something went wrong", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button loading={loading} variant={variant} onClick={go}>
      {label}
    </Button>
  );
}

export function ManageBillingButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else toast({ title: "Billing portal unavailable", description: data.error ?? "", tone: "warning" });
    } catch {
      toast({ title: "Something went wrong", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" loading={loading} onClick={go}>
      Manage billing
    </Button>
  );
}
