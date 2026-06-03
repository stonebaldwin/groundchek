"use client";
import { useState } from "react";
import { Button, Input, useToast } from "@groundbreak/ui";

export interface BrandingValues {
  name: string;
  logoUrl: string;
  primaryColor: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export function BrandingForm({ initial }: { initial: BrandingValues }) {
  const { toast } = useToast();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof BrandingValues>(k: K, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Branding saved", tone: "success" });
    } catch {
      toast({ title: "Could not save", description: "Try again.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
      <Input label="Business name" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Agent Realty" />
      <Input label="Logo URL" value={values.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…/logo.png" />
      <div className="flex items-end gap-3">
        <Input label="Brand color" value={values.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} placeholder="#1d5a8a" />
        <span
          className="mb-0.5 size-10 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: values.primaryColor || "var(--color-surface-sunken)" }}
        />
      </div>
      <Input label="Contact name" value={values.contactName} onChange={(e) => set("contactName", e.target.value)} />
      <Input label="Contact email" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
      <Input label="Contact phone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
      <Button type="submit" loading={saving}>
        Save branding
      </Button>
    </form>
  );
}
