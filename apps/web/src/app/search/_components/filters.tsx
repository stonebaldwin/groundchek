"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Input,
  PROJECT_TYPE_ORDER,
  Select,
  projectTypeMeta,
} from "@groundbreak/ui";

const STATUSES = ["issued", "completed", "in_progress", "applied", "expired"] as const;

export interface FilterState {
  q: string;
  jurisdiction: string;
  projectType: string;
  status: string;
  minValue: string;
}

export function SearchFiltersForm({
  jurisdictions,
  initial,
}: {
  jurisdictions: Array<{ id: string; name: string; state: string }>;
  initial: FilterState;
}) {
  const router = useRouter();
  const [state, setState] = useState<FilterState>(initial);

  function update<K extends keyof FilterState>(k: K, v: string) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (state.q.trim()) params.set("q", state.q.trim());
    if (state.jurisdiction) params.set("jurisdiction", state.jurisdiction);
    if (state.projectType) params.set("projectType", state.projectType);
    if (state.status) params.set("status", state.status);
    if (state.minValue) params.set("minValue", state.minValue);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-border bg-surface p-5 shadow-soft"
    >
      <Input
        label="Keyword"
        placeholder="Address, description, contractor…"
        value={state.q}
        onChange={(e) => update("q", e.target.value)}
      />
      <Select
        label="Market"
        value={state.jurisdiction}
        onChange={(e) => update("jurisdiction", e.target.value)}
      >
        <option value="">All markets</option>
        {jurisdictions.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name}, {j.state}
          </option>
        ))}
      </Select>
      <Select
        label="Project type"
        value={state.projectType}
        onChange={(e) => update("projectType", e.target.value)}
      >
        <option value="">All types</option>
        {PROJECT_TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {projectTypeMeta(t).label}
          </option>
        ))}
      </Select>
      <Select label="Status" value={state.status} onChange={(e) => update("status", e.target.value)}>
        <option value="">Any status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </Select>
      <Input
        label="Min value ($)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        value={state.minValue}
        onChange={(e) => update("minValue", e.target.value)}
      />
      <Button type="submit" className="w-full">
        Apply filters
      </Button>
    </form>
  );
}
