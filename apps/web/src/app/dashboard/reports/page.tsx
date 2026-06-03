import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@groundbreak/ui";
import { getViewer } from "@/lib/viewer";
import { PaywallNotice } from "../../_components/paywall";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { entitlements: ent } = await getViewer();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reports & exports</h1>
        <p className="text-sm text-ink-muted">
          Generate branded property reports and export permit data.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <FileText className="size-5 text-primary" /> Branded property report
        </h2>
        {ent.brandedReports ? (
          <Card>
            <CardHeader>
              <CardTitle>Generate a report</CardTitle>
              <CardDescription>
                Pick a saved property to produce a white-labeled PDF (uses your branding profile). The
                report view doubles as the print layout — open a property and print to PDF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/search" className="text-sm font-medium text-primary hover:underline">
                Choose a property →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <PaywallNotice
            title="Branded reports are a Pro feature"
            description="Generate white-labeled PDF property reports for clients — your logo, colors, and contact details."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Download className="size-5 text-primary" /> Data exports
        </h2>
        {ent.exports ? (
          <Card>
            <CardHeader>
              <CardTitle>Export CSV</CardTitle>
              <CardDescription>
                Bulk-export permits, area activity, or contractor activity for your markets.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              <Link href="/search" className="font-medium text-primary hover:underline">
                Export from search →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <PaywallNotice
            title="Exports are a Business feature"
            description="Bulk CSV export of permits, areas, and contractor activity — the lead-gen data suppliers and brokerages need."
            cta="See Business plan"
          />
        )}
      </section>
    </div>
  );
}
