"use client";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "../lib/cn";

export interface AddressSuggestion {
  id: string;
  label: string;
  sublabel?: string;
}

export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onSubmit?: () => void;
  suggestions?: AddressSuggestion[];
  loading?: boolean;
  placeholder?: string;
  label?: ReactNode;
  hideLabel?: boolean;
  size?: "md" | "lg";
  buttonLabel?: string;
  className?: string;
}

/**
 * Accessible combobox address field. Phase 0 ships the interactive shell;
 * `suggestions` are supplied by the caller. Phase 3 wires it to the Census
 * geocoder (via the Core) for live autocomplete over the launch metros.
 */
export function AddressInput({
  value,
  onChange,
  onSelect,
  onSubmit,
  suggestions = [],
  loading = false,
  placeholder = "Enter a property address…",
  label = "Property address",
  hideLabel = true,
  size = "lg",
  buttonLabel,
  className,
}: AddressInputProps) {
  const inputId = useId();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const showList = open && suggestions.length > 0;

  function choose(s: AddressSuggestion) {
    onChange(s.label);
    onSelect?.(s);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showList && active >= 0 && active < suggestions.length) {
        e.preventDefault();
        choose(suggestions[active]!);
      } else {
        onSubmit?.();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const sizing = size === "lg" ? "h-14 text-base" : "h-11 text-sm";

  return (
    <div className={cn("relative w-full", className)}>
      <label
        htmlFor={inputId}
        className={cn("mb-1.5 block text-sm font-medium text-ink-soft", hideLabel && "sr-only")}
      >
        {label}
      </label>
      <div
        role="combobox"
        aria-expanded={showList}
        aria-haspopup="listbox"
        aria-owns={listId}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 shadow-soft transition-colors",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40",
          sizing,
        )}
      >
        <Search className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
        <input
          id={inputId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-muted"
        />
        {loading ? (
          <span
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary"
            aria-hidden="true"
          />
        ) : null}
        {buttonLabel ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSubmit?.()}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {buttonLabel}
          </button>
        ) : null}
      </div>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-pop"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(s)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm",
                i === active ? "bg-primary-soft" : "",
              )}
            >
              <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-ink">{s.label}</span>
                {s.sublabel ? <span className="text-xs text-ink-muted">{s.sublabel}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
