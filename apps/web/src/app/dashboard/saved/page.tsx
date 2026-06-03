import Link from "next/link";
import { Building2, MapPinned } from "lucide-react";
import { EmptyState } from "@groundbreak/ui";

export const dynamic = "force-dynamic";

export default function SavedPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Saved & watched</h1>
        <p className="text-sm text-ink-muted">
          Properties you&apos;ve saved and areas you&apos;re monitoring for new permits.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Saved properties</h2>
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No saved properties"
          description="Open a property and choose “Watch this property” to track its permit history here."
          action={
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Find a property →
            </Link>
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Watched areas</h2>
        <EmptyState
          icon={<MapPinned className="size-5" />}
          title="No watched areas"
          description="Monitor a ZIP, neighborhood, or jurisdiction to get alerted when activity spikes."
          action={
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Browse areas →
            </Link>
          }
        />
      </section>
    </div>
  );
}
