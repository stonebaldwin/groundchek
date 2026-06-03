import { SiteHeader } from "./site-header";

/** Skeleton shown while a force-dynamic report page fetches from the database. */
export function PageSkeleton({ width = "max-w-4xl" }: { width?: string }) {
  return (
    <>
      <SiteHeader />
      <div className="blueprint-grid border-b border-border bg-surface-sunken/30">
        <div className={`mx-auto ${width} px-6 pb-7 pt-7`}>
          <div className="h-3 w-40 animate-pulse rounded bg-border" />
          <div className="mt-3 h-8 w-2/3 animate-pulse rounded bg-border" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-border" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        </div>
      </div>
      <div className={`mx-auto ${width} space-y-4 px-6 py-8`}>
        <div className="h-44 animate-pulse rounded-xl bg-surface-sunken" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-sunken" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-sunken" />
      </div>
    </>
  );
}
