# Groundbreak

> **Codename — trademark-check before launch.** Several adjacent uses exist;
> `Underway` or `Buildlog` are cleaner fallbacks. The name lives in
> `NEXT_PUBLIC_APP_NAME` and is not hard-coded anywhere structural.

**Groundbreak is a self-serve local building-permit intelligence tool.** Enter an
address (or browse an area) and see what's been built, renovated, or permitted at
a property and nearby:

- **Permit history** at a property — what was built/renovated/added, project value,
  status, contractor, and dates, each linked to the official source record.
- **Neighborhood construction activity** — volume & value trends, project-type mix,
  hotspots, and top contractors for a ZIP / neighborhood / jurisdiction.
- **Contractor activity** — where a contractor pulls permits, what they build, and
  at what volume (public business records — not an endorsement or rating).

Built for real-estate **agents**, small **investors**, **homebuyers**, and
**contractors/suppliers** in specific local markets.

It is **informational only** — permit records are public data, attributed to each
jurisdiction's portal with a "**data current as of [date]**" freshness note.
Project-type classifications and activity metrics are computed analysis, not
official designations. See the methodology/compliance surfaces (Phase 7).

### Positioning (read this before adding scope)

This is **not** a nationwide permit database — funded incumbents (Shovels.ai,
BuildZoom) own the national raw-data + enterprise lane, and that's a data arms race
we'd lose. Groundbreak wins on (a) **local depth** in launch metros, (b) **fusing
permits with property context** in a clean, parcel-centric product, and (c)
**agent distribution**. If the build drifts toward "national permit database," it's
walking into the incumbents' strength. Keep it local and product-led. The optional
Shovels connector is stubbed for *later* national breadth, not wired at launch.

---

## Architecture at a glance

A **pnpm monorepo** with a cleanly separated, reusable public-data ingestion engine
("the Core") plus the Groundbreak web app on top. Everything keys to the **parcel /
address as the central entity** — Groundbreak is deliberately the **second** product
of a real-estate cluster, designed to **snap together with [Terrain](../terrain)**
(the property-risk lookup) on the shared `property` row, so one parcel can carry both
its permit history and its risk profile in a single "everything about this property"
report.

```
groundbreak/
├── packages/
│   ├── db/      @groundbreak/db    Drizzle schema + Neon client + PostGIS + migrations (shared)
│   ├── core/    @groundbreak/core  The Core: permit connector framework (Socrata/ArcGIS/
│   │                               browser/paid-fallback), field-mapping + normalizer,
│   │                               project-type classification, parcel entity resolution,
│   │                               area analytics, change-detection, ingestion health.
│   │                               Product-agnostic — siblings reuse it.
│   └── ui/      @groundbreak/ui    Design system: tokens + primitives + map + report parts
├── apps/
│   ├── web/     @groundbreak/web   Next.js (App Router) on Cloudflare Workers via OpenNext
│   └── ingest/  @groundbreak/ingest Workers Cron/Queue ingestion runners (Phase 6)
```

**The dependency rule:** `core`, `db`, and `ui` stay product-agnostic. Apps depend on
packages, never the reverse. `core` never imports `ui`. The shared `CanonicalProperty`
shape in `@groundbreak/core` is **identical** to Terrain's, and the DB `properties`
table is the cluster-shared row both products attach to — that's what lets the two
merge on one parcel later.

### The Core (reusable engine)

Every jurisdiction source implements one `PermitSourceConnector` interface
(`fetchRaw` → `normalize`). Sources are parameterized by a `JurisdictionConfig` +
declarative `FieldMapping`, so **adding a market is data entry, not code**. Connectors
are resilient (timeouts, backoff, polite rate-limiting) and log a `sync_run` health
record on **every** run, including stale-source detection. (Fully built in Phase 1.)

- **Socrata SODA** (primary, key-less SODA/SoQL) — most launch metros publish here.
- **ArcGIS REST** (secondary) — geometry-aware open-data layers.
- **Accela/CARTO browser fallback** — via Queues + Browser Rendering (Phase 6).
- **Paid aggregator (Shovels)** — an OPTIONAL, stubbed connector for later national
  coverage. Not wired or required at launch.

### Why caching & freshness are load-bearing

Permit portals refresh slowly (daily to monthly) and some lag **1–2 years** (LA,
Dallas were stale). So: ingested permits are stored in the DB and served from there
(never re-hit a portal per request); public property/area/contractor pages are
edge-cached via Cloudflare; and every market shows "**data current as of [date]**" —
both a trust differentiator and a guard against presenting stale data as live.

---

## Tech stack

| Concern        | Choice                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + TypeScript                                                |
| Runtime/deploy | Cloudflare Workers via `@opennextjs/cloudflare` (Node runtime, `nodejs_compat`)     |
| Database       | Neon Postgres + Drizzle ORM, **PostGIS** for nearby-permit radius/geometry queries  |
| Map            | MapLibre GL JS (open-source, no API key)                                            |
| Styling        | Tailwind CSS v4 (CSS-first `@theme` design tokens)                                  |
| Auth           | Better Auth (email/password + magic link); Clerk scaffolded as fallback _(Phase 4)_ |
| Billing        | Stripe Checkout + Billing portal + raw-body webhooks _(Phase 5)_                    |
| Email          | Resend _(Phase 4/6)_                                                                |
| Ingestion      | Cloudflare Cron Triggers + Queues + Browser Rendering _(Phase 6)_                   |

> **Pinned, known-good versions** (matched to the cluster, verified June 2026):
> Next 16.2.7 + React 19, `@opennextjs/cloudflare@^1.19.11`, `wrangler@^4.97`,
> Tailwind v4, `drizzle-orm@^0.45`, `@neondatabase/serverless@^1.1`. The OpenNext
> adapter is fast-moving — re-check [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)
> before bumping.

---

## Getting started

Prereqs: Node ≥ 20 (`.nvmrc` pins 22), pnpm 11.

```bash
pnpm install
cp .env.example .env            # fill DATABASE_URL at minimum
cp .env apps/web/.dev.vars      # Worker local dev reads .dev.vars (same keys)

# Database (needs a Neon DATABASE_URL with PostGIS):
pnpm db:generate                # generate SQL migrations from Drizzle schema
pnpm db:migrate                 # apply migrations (enables PostGIS, creates tables)

# Develop the web app:
pnpm dev                        # http://localhost:3000  (Next dev + OpenNext bindings)
```

Visit:

- `/` — landing.
- `/styleguide` — the full design system: tokens, every primitive, the map, and a
  sample property report (with a stubbed property-risk section showing the Terrain merge).
- `/api/health` — liveness + DB/PostGIS connectivity check (degrades gracefully with no DB).

### Deploy to Cloudflare

```bash
pnpm --filter @groundbreak/web run preview   # build with OpenNext + run locally on workerd
pnpm --filter @groundbreak/web run deploy     # build + deploy to your Cloudflare account
# set production secrets (inside apps/web):
#   wrangler secret put DATABASE_URL
```

Deploying requires a Cloudflare account (`wrangler login`) and a Neon database. See
`.env.example` for the full env reference.

---

## Repo conventions

- **TypeScript strict** everywhere; shared base config in `tsconfig.base.json`.
- Packages export TypeScript **source** (`./src/index.ts`); apps transpile them
  (`transpilePackages` in Next, esbuild in Workers). No separate build step for packages.
- Lint: `pnpm lint` (ESLint flat config). Format: `pnpm format` (Prettier).
- Typecheck the whole repo: `pnpm typecheck`.

## Adding a jurisdiction (the repeatable growth task)

Declare a `jurisdictions` + `permit_datasets` row (platform, portal base URL, dataset
id, field mapping, cadence, known lag) — near-pure config. The connector framework
picks it up; no new code unless the portal is on a new platform. **Full guide:**
[`docs/ADDING_A_JURISDICTION.md`](docs/ADDING_A_JURISDICTION.md). Hand real portal URLs
+ dataset ids to the build — don't let them be guessed.

## Reviewing without infrastructure

The public app falls back to a built-in **demo dataset** when `DATABASE_URL` is unset,
so `/`, `/property/*`, `/area/*`, `/contractor/*`, `/search`, and `/styleguide` are
fully reviewable with zero setup (`pnpm dev`). With a database wired, `pnpm db:seed`
loads the same demo content (plus the real Austin Socrata field-mapping config), the
ingest worker (`apps/ingest`, `POST /run?jurisdiction=…&force=1`) backfills live data,
and the operator cockpit at `/admin` shows ingestion health + freshness.

## Build phases — all complete ✅

0. ✅ Monorepo, tooling, design system, map/report components, Cloudflare wiring.
1. ✅ The Core: permit connectors + field-mapping + normalization + analytics + freshness (+ tests).
2. ✅ Database schema (Drizzle + PostGIS) — incl. the cluster-shared `properties` entity.
3. ✅ Public, cacheable property / area / contractor / search front end (SEO, sitemap, robots).
4. ✅ Auth (Better Auth) + user dashboard + saved/watched + branding + reports/exports + team + API.
5. ✅ Stripe self-serve billing + entitlements (Free / Pro / Business).
6. ✅ Cron ingestion + alert pipeline + operator cockpit (health + freshness + coverage).
7. ✅ Hardening / freshness-honesty / compliance (methodology, terms, privacy) / demo seed / docs.
```
