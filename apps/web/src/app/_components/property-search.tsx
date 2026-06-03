"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressInput, type AddressSuggestion } from "@groundbreak/ui";

export function PropertySearch({
  size = "lg",
  buttonLabel = "See permits",
}: {
  size?: "md" | "lg";
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { items: Array<{ key: string; label: string; sublabel?: string }> };
        if (!cancelled) {
          setSuggestions(data.items.map((i) => ({ id: i.key, label: i.label, sublabel: i.sublabel })));
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  function go(key?: string) {
    if (key) router.push(`/property/${key}`);
    else if (suggestions[0]) router.push(`/property/${suggestions[0].id}`);
    else router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <AddressInput
      value={q}
      onChange={setQ}
      suggestions={suggestions}
      loading={loading}
      buttonLabel={buttonLabel}
      size={size}
      onSelect={(s) => go(s.id)}
      onSubmit={() => go()}
    />
  );
}
