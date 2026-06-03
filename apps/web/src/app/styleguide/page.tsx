import type { ReactNode } from "react";
import { Building2, MapPin, Search } from "lucide-react";
import {
  ActivityBadge,
  AreaActivityCard,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ContractorActivityList,
  EmptyState,
  FreshnessIndicator,
  Input,
  PermitTimeline,
  PROJECT_TYPE_ORDER,
  ProjectTypeBadge,
  ReportLayout,
  ReportSection,
  Select,
  Skeleton,
  SourceAttribution,
  StatCard,
  type ActivityLevel,
  type AreaActivityData,
  type ContractorActivityEntry,
  type PermitTimelineEntry,
} from "@groundbreak/ui";
import { InteractiveShowcase } from "./_components/interactive";
import { MapDemo } from "./_components/map-demo";

export const metadata = { title: "Style guide" };

const ACTIVITY_LEVELS: ActivityLevel[] = ["quiet", "light", "moderate", "active", "hot"];

const TIMELINE: PermitTimelineEntry[] = [
  {
    id: "1",
    permitNumber: "2026-014532-BP",
    projectType: "addition",
    status: "issued",
    description: "Second-story addition, 620 sq ft, over existing garage.",
    valuation: 185000,
    contractorName: "Lone Star Builders LLC",
    contractorLicense: "TX-CGC-44821",
    issuedDate: "2026-04-18",
    sourceUrl: "https://data.austintexas.gov/",
  },
  {
    id: "2",
    permitNumber: "2025-098221-EP",
    projectType: "solar",
    status: "completed",
    description: "Rooftop photovoltaic system, 8.2 kW, 22 panels.",
    valuation: 24500,
    contractorName: "Sunfield Solar",
    contractorLicense: "TX-EC-7731",
    issuedDate: "2025-09-02",
    sourceUrl: "https://data.austintexas.gov/",
  },
  {
    id: "3",
    permitNumber: "2024-051120-BP",
    projectType: "roofing",
    status: "expired",
    description: "Tear-off and reroof, composition shingle.",
    valuation: 18900,
    contractorName: "Hill Country Roofing",
    issuedDate: "2024-05-11",
    sourceUrl: "https://data.austintexas.gov/",
  },
];

const AREA: AreaActivityData = {
  label: "78702 · East Austin",
  activityLevel: "active",
  totalPermits: 1284,
  totalValuation: 412_000_000,
  momChangePct: 12,
  yoyChangePct: 41,
  series: [
    { period: "Jul", permitCount: 78 },
    { period: "Aug", permitCount: 86 },
    { period: "Sep", permitCount: 92 },
    { period: "Oct", permitCount: 81 },
    { period: "Nov", permitCount: 74 },
    { period: "Dec", permitCount: 69 },
    { period: "Jan", permitCount: 88 },
    { period: "Feb", permitCount: 97 },
    { period: "Mar", permitCount: 110 },
    { period: "Apr", permitCount: 124 },
    { period: "May", permitCount: 131 },
    { period: "Jun", permitCount: 104 },
  ],
  projectMix: [
    { type: "alteration", count: 410, share: 0.32 },
    { type: "addition", count: 244, share: 0.19 },
    { type: "new_construction", count: 167, share: 0.13 },
    { type: "roofing", count: 141, share: 0.11 },
    { type: "solar", count: 128, share: 0.1 },
    { type: "adu", count: 90, share: 0.07 },
    { type: "other", count: 104, share: 0.08 },
  ],
};

const CONTRACTORS: ContractorActivityEntry[] = [
  {
    name: "Lone Star Builders LLC",
    license: "TX-CGC-44821",
    permitCount: 38,
    totalValuation: 21_400_000,
    jurisdictions: ["Austin", "Round Rock"],
    topProjectTypes: ["new_construction", "addition", "alteration"],
  },
  {
    name: "Sunfield Solar",
    license: "TX-EC-7731",
    permitCount: 121,
    totalValuation: 3_200_000,
    jurisdictions: ["Austin"],
    topProjectTypes: ["solar", "electrical"],
  },
  {
    name: "Hill Country Roofing",
    permitCount: 64,
    totalValuation: 1_900_000,
    jurisdictions: ["Austin", "Pflugerville"],
    topProjectTypes: ["roofing"],
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-10 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className="h-14 rounded-lg border border-border"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="text-xs">
        <p className="font-medium text-ink">{name}</p>
        <p className="font-mono text-ink-muted">{varName}</p>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
      <header className="space-y-2">
        <Badge variant="primary">Design system</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Groundbreak style guide</h1>
        <p className="max-w-2xl text-ink-soft">
          Trustworthy property intelligence — a calmer Zillow meets Stripe. Warm paper, near-black
          ink, one confident blueprint-blue primary, a categorical project-type palette, and a
          graded, non-alarmist activity scale. Every token, primitive, the map, and a sample report.
        </p>
      </header>

      <Section title="Color & surfaces">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="Paper" varName="--color-paper" />
          <Swatch name="Surface" varName="--color-surface" />
          <Swatch name="Surface sunken" varName="--color-surface-sunken" />
          <Swatch name="Ink" varName="--color-ink" />
          <Swatch name="Ink soft" varName="--color-ink-soft" />
          <Swatch name="Ink muted" varName="--color-ink-muted" />
          <Swatch name="Primary" varName="--color-primary" />
          <Swatch name="Primary soft" varName="--color-primary-soft" />
          <Swatch name="Accent" varName="--color-accent" />
          <Swatch name="Accent soft" varName="--color-accent-soft" />
          <Swatch name="Border" varName="--color-border" />
          <Swatch name="Info" varName="--color-info" />
        </div>
      </Section>

      <Section
        title="Activity scale"
        description="Graded and legible — calm blue → teal → ochre → clay → warm brick. Never fire-engine red. A computed analysis of construction activity, not an official designation."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ACTIVITY_LEVELS.map((level) => (
            <Swatch key={level} name={level} varName={`--color-activity-${level}`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {ACTIVITY_LEVELS.map((level) => (
            <ActivityBadge key={level} level={level} />
          ))}
        </div>
      </Section>

      <Section
        title="Project-type palette"
        description="A restrained categorical hue per normalized project type — used for badges and map pins."
      >
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPE_ORDER.map((type) => (
            <ProjectTypeBadge key={type} type={type} />
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg" leadingIcon={<Search className="size-4" />}>
            Search permits
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Completed</Badge>
          <Badge variant="warning">Expired</Badge>
          <Badge variant="danger">Cancelled</Badge>
          <Badge variant="info">Under review</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-xl gap-4">
          <Input
            label="Property address"
            placeholder="1100 E 5th St, Austin, TX"
            leading={<MapPin className="size-4" />}
          />
          <Input label="With hint" hint="We never share your searches." placeholder="you@example.com" />
          <Input label="With error" error="That address could not be found." defaultValue="nowhere" />
          <Select label="Search radius" defaultValue="0.25">
            <option value="0.1">500 ft</option>
            <option value="0.25">¼ mile</option>
            <option value="0.5">½ mile</option>
          </Select>
        </div>
      </Section>

      <Section title="Cards & figures">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Permits at this property" value="7" sublabel="Since 2009" />
          <StatCard
            label="Total declared value"
            value="$412K"
            sublabel="Across all permits"
            tone="text-primary"
          />
          <StatCard
            label="Neighborhood activity"
            value="Active"
            sublabel="+41% YoY"
            tone="text-activity-active"
          />
        </div>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Watch this property</CardTitle>
            <CardDescription>Get alerted when a new permit is filed here or nearby.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-soft">
              A new permit at the property, a status change, or a spike in neighborhood activity
              triggers an email.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Enable alerts</Button>
            <Button size="sm" variant="ghost">
              Learn more
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="States">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
          <EmptyState
            icon={<Building2 className="size-5" />}
            title="No permits found at this address"
            description="This may be a covered market with no recent permits, or an area we don't cover yet."
            action={<Button size="sm">Request this market</Button>}
          />
        </div>
      </Section>

      <Section title="Freshness" description="Per-jurisdiction honesty — shown on every record.">
        <div className="flex flex-wrap items-center gap-3">
          <FreshnessIndicator currentAs="2026-05-28" note="Austin · updated daily" />
          <FreshnessIndicator currentAs="2024-01-15" stale note="this portal is lagging" />
        </div>
      </Section>

      <Section title="Interactive" description="AddressInput, toasts, tabs, and a modal.">
        <InteractiveShowcase />
      </Section>

      <Section
        title="Map"
        description="MapLibre basemap with the subject parcel and permit pins color-coded by project type."
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <MapDemo />
        </div>
      </Section>

      <Section title="Permit history timeline">
        <PermitTimeline entries={TIMELINE} />
      </Section>

      <Section title="Neighborhood activity">
        <AreaActivityCard data={AREA} />
      </Section>

      <Section title="Contractor activity">
        <ContractorActivityList contractors={CONTRACTORS} />
      </Section>

      <Section
        title="Sample report"
        description="The composed report surface — also the print/PDF layout, and structured to host a property-risk section from Terrain on the same parcel."
      >
        <div className="rounded-2xl border border-border bg-surface p-6">
          <ReportLayout
            address="1100 E 5th St, Austin, TX 78702"
            generatedAtLabel="2026-06-02 14:30 UTC"
            badge={<ActivityBadge level="active" size="lg" />}
            freshness={<FreshnessIndicator currentAs="2026-05-28" note="Austin Open Data" />}
            map={<MapDemo />}
            summary={
              <Card>
                <CardContent className="pt-5 text-sm text-ink-soft">
                  Seven permits on record since 2009 — a 2026 second-story addition and a 2025 solar
                  install most recently. The surrounding ZIP is an{" "}
                  <span className="font-medium text-ink">active</span> construction area, up 41%
                  year-over-year.
                </CardContent>
              </Card>
            }
          >
            <ReportSection
              title="Permit history"
              description="Every permit on record at this property, newest first."
              attribution={
                <SourceAttribution
                  sourceName="City of Austin Open Data"
                  retrievedAt="2026-06-02T14:30:00Z"
                  dataCurrentAs="2026-05-28"
                  sourceUrl="https://data.austintexas.gov/"
                />
              }
            >
              <PermitTimeline entries={TIMELINE} />
            </ReportSection>

            <ReportSection
              title="Neighborhood activity"
              badge={<ActivityBadge level="active" size="sm" />}
              attribution={
                <SourceAttribution
                  sourceName="City of Austin Open Data"
                  retrievedAt="2026-06-02T14:30:00Z"
                  dataCurrentAs="2026-05-28"
                  sourceUrl="https://data.austintexas.gov/"
                />
              }
            >
              <AreaActivityCard data={AREA} />
            </ReportSection>

            <ReportSection
              title="Top contractors nearby"
              description="Public business activity — not an endorsement or rating."
              attribution={
                <SourceAttribution
                  sourceName="City of Austin Open Data"
                  retrievedAt="2026-06-02T14:30:00Z"
                  dataCurrentAs="2026-05-28"
                  sourceUrl="https://data.austintexas.gov/"
                />
              }
            >
              <ContractorActivityList contractors={CONTRACTORS} />
            </ReportSection>

            <ReportSection
              title="Property risk"
              badge={<Badge variant="outline">Cluster preview · via Terrain</Badge>}
            >
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken/60 p-5 text-sm text-ink-muted">
                Groundbreak and Terrain key to the same parcel. When paired, this section carries the
                property&apos;s FEMA flood zone, nearby EPA-regulated facilities, and natural-hazard
                exposure — one report, one property. Wired when the cluster is merged.
              </div>
            </ReportSection>
          </ReportLayout>
        </div>
      </Section>
    </div>
  );
}
