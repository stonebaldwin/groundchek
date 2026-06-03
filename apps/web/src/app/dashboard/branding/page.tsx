import { isDbConfigured } from "@/lib/env";
import { getViewer } from "@/lib/viewer";
import { PaywallNotice } from "../../_components/paywall";
import { BrandingForm, type BrandingValues } from "./branding-form";

export const dynamic = "force-dynamic";

const EMPTY: BrandingValues = {
  name: "",
  logoUrl: "",
  primaryColor: "#1d5a8a",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

async function loadBranding(userId: string): Promise<BrandingValues> {
  if (!isDbConfigured()) return EMPTY;
  try {
    const { getDb, schema, eq } = await import("@groundbreak/db");
    const rows = await getDb()
      .select()
      .from(schema.brandingProfiles)
      .where(eq(schema.brandingProfiles.userId, userId))
      .limit(1);
    const b = rows[0];
    if (!b) return EMPTY;
    return {
      name: b.name ?? "",
      logoUrl: b.logoUrl ?? "",
      primaryColor: b.primaryColor ?? "#1d5a8a",
      contactName: b.contactName ?? "",
      contactEmail: b.contactEmail ?? "",
      contactPhone: b.contactPhone ?? "",
    };
  } catch {
    return EMPTY;
  }
}

export default async function BrandingPage() {
  const viewer = await getViewer();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Branding</h1>
        <p className="text-sm text-ink-muted">
          Your logo, color, and contact details for white-labeled property reports.
        </p>
      </header>
      {viewer.entitlements.brandedReports ? (
        <BrandingForm initial={viewer.userId ? await loadBranding(viewer.userId) : EMPTY} />
      ) : (
        <PaywallNotice
          title="Branding is a Pro feature"
          description="Add your logo and contact details to generate white-labeled PDF property reports for clients."
        />
      )}
    </div>
  );
}
