import { KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@groundbreak/ui";
import { getViewer } from "@/lib/viewer";
import { PaywallNotice } from "../../_components/paywall";

export const dynamic = "force-dynamic";

export default async function ApiPage() {
  const viewer = await getViewer();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">API access</h1>
        <p className="text-sm text-ink-muted">
          A read API over permits, properties, areas, and contractors.
        </p>
      </header>

      {viewer.entitlements.api ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-primary" /> API keys
            </CardTitle>
            <CardDescription>
              Keys authenticate read requests to <span className="font-mono">/api/v1/*</span>. Keep
              them secret; rotate anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-sunken/40 p-4 text-sm text-ink-muted">
              No keys yet. Generate one to start making requests.
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Generate API key
            </button>
          </CardContent>
        </Card>
      ) : (
        <PaywallNotice
          title="API access is a Business feature"
          description="Programmatic, key-managed read access to permits, properties, areas, and contractors."
          cta="See Business plan"
        />
      )}
    </div>
  );
}
