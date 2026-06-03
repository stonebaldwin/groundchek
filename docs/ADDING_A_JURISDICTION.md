# Adding a jurisdiction

Adding a market is **data entry, not code**: a `jurisdictions` row + a
`permit_datasets` row (portal URL, dataset id, field mapping, cadence). The
connector framework dispatches on `platform`, so you only write code when a
portal is on a *new* platform.

> ⚠️ **Hand the build real portal URLs + dataset ids — don't let them be guessed.**
> And check the portal's update cadence first: some big portals lag 1–2 years
> (LA, Dallas were stale). Don't launch a market on stale data and call it current.

## 1. Find the source

- Most metros publish permits on **Socrata** (`data.<city>.gov`) or **ArcGIS**
  open-data. Search the portal for "permits" / "issued construction permits".
- Note the **base URL**, the **dataset/layer id**, and the **column names**.
- Check freshness: when was the latest `issued_date`? Is it updated daily/weekly?

## 2. Write the field mapping

Map the portal's columns to canonical fields (`packages/core` `FieldMapping`).
Each rule is `{ column, type?, fallback? }`. Real Austin (Socrata `3syk-w9eu`):

```jsonc
{
  "permitNumber":   { "column": "permit_number" },
  "permitType":     { "column": "permit_type_desc", "fallback": ["permit_class"] },
  "status":         { "column": "status_current" },
  "description":    { "column": "description" },
  "address":        { "column": "original_address1" },
  "latitude":       { "column": "latitude",  "type": "number" },
  "longitude":      { "column": "longitude", "type": "number" },
  "valuation":      { "column": "total_job_valuation", "type": "currency" },
  "contractorName": { "column": "contractor_company_name" },
  "issuedDate":     { "column": "issued_date",    "type": "date" },
  "appliedDate":    { "column": "applied_date",   "type": "date" },
  "completedDate":  { "column": "completed_date", "type": "date" }
}
```

`type` drives coercion: `currency` strips `$`/commas, `date` normalizes ISO /
`M/D/YYYY` / epoch-ms to `YYYY-MM-DD`, `number` parses floats. Contractor fields
are **public business info only** — never map an individual owner/applicant name.

## 3. Insert the rows

Add a `jurisdictions` row (`id` like `us-tx-austin`, name, state, `platform`,
`cadence`, `knownLagMonths` if it publishes on a delay) and a `permit_datasets`
row (the `fieldMapping` above, `portalBaseUrl`, `datasetId`). See
`packages/db/src/seed.ts` for a working example, or insert via `pnpm db:studio`.

## 4. Backfill + verify

- Trigger the ingest worker: `POST /run?jurisdiction=us-xx-city&force=1`
  (or wait for the cron). It fetches → normalizes → resolves properties → upserts
  → emits events → logs a `sync_run` and the freshness date.
- Check the **operator cockpit** at `/admin`: confirm the run is healthy, the
  freshness date is recent, and there are no mapping-failure anomalies.

## Platform notes

- **socrata** (primary, key-less SODA/SoQL): paginates `$limit`/`$offset`, filters
  incrementally on the mapped `issuedDate` column.
- **arcgis** (secondary): queries a Feature Service layer; geometry `x`/`y` is
  injected as `__lng`/`__lat`, so map `latitude → "__lat"`, `longitude → "__lng"`.
- **accela_browser / carto** (fallback): no clean API — a Browser Rendering worker
  supplies rows via an injected `browserFetcher` (Phase 6).
- **paid_aggregator** (Shovels): an optional, stubbed national fallback. Disabled
  at launch; flip on only if national breadth is worth the per-call cost.

## Adding a new platform connector

Implement `PermitSourceConnector` (`fetchRaw` → `normalize`) in
`packages/core/src/connectors/`, then add a `case` to `createConnector()` in
`packages/core/src/connectors/index.ts`. Everything downstream (normalize,
resolve, analytics, health) is platform-agnostic and works unchanged.
