# Reference Screen Contract

The demo must mirror the supplied MetrixMate reference project. The reference project is the UI and behavior source; the demo data layer is the only deliberate substitution.

## Main navigation

The visible dashboard navigation is:

1. Dashboard
2. Sales Comparison
3. Source Comparison
4. POS Analysis
5. Store Insights
6. Fleet Strategy
7. Report Builder
8. Meta Ads Analytics
9. Google Ads Analytics
10. TikTok Ads Analytics
11. Web Analytics (GA4)

The utility navigation is:

- Connections
- Connectors
- Sync History
- Settings
- Admin when the admin role is enabled

## Fidelity rules

- Use the same sidebar grouping, active-state treatment, top navigation, filter placement, date controls, and status indicators.
- Preserve the reference screen's chart types, metric-card order, tables, tabs, drilldowns, and empty/loading/error states.
- Preserve the reference naming and terminology exactly unless the name identifies the reference client.
- Replace live source labels with fictional equivalents only where necessary: Northstar POS, Northstar GA4, Northstar Meta Ads, and Northstar Google Ads.
- All values, campaigns, store names, products, customer records, and locations are generated dummy data.
- No real connectors, OAuth flows, API routes, BigQuery calls, client credentials, or client exports are allowed.

## Implementation mapping

| Reference area | Demo implementation |
| --- | --- |
| `components/app-sidebar.tsx` | Exact navigation structure and groups |
| `components/top-nav.tsx` | Date range, platform, account, campaign, freshness, and role controls |
| `components/sections/store-roas.tsx` | Dashboard, Sales Comparison, Source Comparison tabs |
| `components/sections/pos-insights.tsx` | POS Analysis |
| `components/sections/insights.tsx` | Store Insights |
| `components/sections/fleet-strategy.tsx` | Fleet Strategy |
| `components/sections/report-builder.tsx` | Report Builder |
| `components/sections/paid-media.tsx` | Meta Ads and Google Ads tabs |
| `components/sections/tiktok.tsx` | TikTok Ads Analytics |
| `components/sections/ga4-section.tsx` | Web Analytics (GA4) and its tabs |
| connector utility pages | Dummy Connections, Connectors, Sync History, Settings, and Admin pages |

The screen-specific compositions now live in `components/demo-screens.tsx` and `components/system-screens.tsx`. The shared shell is in `components/demo-app.tsx`, with deterministic fictional data in `lib/demo-data.ts`. The previous generic `ReferenceScreen` is no longer used. This is a local demo reconstruction, not a production integration; detailed charts and business rules are modeled rather than connected to the client's systems.
