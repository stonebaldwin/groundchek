import { UserPlus, Users } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@groundbreak/ui";
import { getViewer } from "@/lib/viewer";
import { PaywallNotice } from "../../_components/paywall";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const viewer = await getViewer();
  if (viewer.entitlements.seats <= 1) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="text-sm text-ink-muted">Shared seats, branding, and watchlists.</p>
        </header>
        <PaywallNotice
          title="Teams are a Business feature"
          description="Add seats for your brokerage or firm, with shared branding and watchlists."
          cta="See Business plan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Team</h1>
          <p className="text-sm text-ink-muted">
            {viewer.entitlements.seats} seats included on your plan.
          </p>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" /> Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{viewer.name ?? viewer.email}</p>
              <p className="text-xs text-ink-muted">{viewer.email}</p>
            </div>
            <Badge variant="primary">Owner</Badge>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-3 text-sm font-medium text-ink-soft hover:bg-surface-sunken"
          >
            <UserPlus className="size-4" /> Invite a teammate
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
