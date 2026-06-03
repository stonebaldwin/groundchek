"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@groundbreak/ui";
import { signOut } from "@/lib/auth-client";

const LINKS: Array<[string, string]> = [
  ["/dashboard", "Overview"],
  ["/dashboard/saved", "Saved & watched"],
  ["/dashboard/reports", "Reports & exports"],
  ["/dashboard/branding", "Branding"],
  ["/dashboard/team", "Team"],
  ["/dashboard/api", "API"],
  ["/dashboard/billing", "Billing"],
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="space-y-0.5 text-sm">
      {LINKS.map(([href, label]) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "block rounded-lg px-3 py-2 font-medium transition-colors",
              active ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-surface-sunken",
            )}
          >
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
        className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </nav>
  );
}
