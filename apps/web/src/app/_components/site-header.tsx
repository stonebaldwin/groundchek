import Link from "next/link";
import { APP_NAME } from "@/lib/env";
import { Logo } from "./logo";

const NAV = [
  { href: "/search", label: "Explore" },
  { href: "/pricing", label: "Pricing" },
  { href: "/methodology", label: "Methodology", hideOnMobile: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label={`${APP_NAME} — home`} className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav className="flex items-center gap-0.5 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink ${
                item.hideOnMobile ? "hidden sm:block" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-1.5 rounded-md border border-border-strong px-3 py-1.5 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
