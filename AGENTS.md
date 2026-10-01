# Northstar Slice Co. Demo

This is a standalone pitch demo for a fictional 42-location North American pizza chain. The supplied MetrixMate project is read-only reference material for screen names, layout, and behavior. All stores, products, campaigns, customers, metrics, and sync activity in this project must be synthetic.

## Current app

- Next.js App Router and TypeScript; `npm run dev` uses webpack.
- `app/page.tsx` passes the last completed UTC day to the client.
- `components/demo-app.tsx` owns the reference-style navigation, top filters, and shared presentation components.
- `components/demo-screens.tsx` owns the eleven analytics screens and their tabs/drilldowns.
- `components/system-screens.tsx` owns the five utility/admin screens.
- `lib/demo-data.ts` generates 180 days of deterministic fictional data for 42 stores.
- `public/demo.css` is linked from `app/layout.tsx`. Do not reintroduce its import into a Next CSS bundle without checking build performance.

## Guardrails

- Never copy reference-client records, identifiers, locations, product names, credentials, exports, or production API calls into this project.
- Label values as simulated. Do not imply the dummy Connections or sync status are live.
- Keep screen names and navigation aligned with `docs/reference-screen-contract.md`.
- Before adding a new metric, make date/store/platform filtering and cross-screen totals consistent.
- No push or deployment without the user's explicit approval.
