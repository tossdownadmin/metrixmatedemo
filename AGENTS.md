# Agent notes

Standalone pitch demo. Next.js App Router, TypeScript, Recharts, lucide-react. Plain CSS design system in `app/globals.css` (tokens at the top). No Tailwind.

## Layout

- `lib/brand.ts`: brand name and default ROAS target.
- `lib/data.ts`: deterministic generator. 42 stores × 460 days, stored date-major (`rows[d * stores + s]`). Planted stories are marked with comments.
- `lib/select.ts`: all aggregation (ranges, totals, per-store, daily series, products, dayparts, campaigns, cohorts, GA4 models). Screens must aggregate through here so numbers reconcile across screens.
- `lib/insights.ts`: rule-based findings for Store Insights and Report Builder.
- `components/app.tsx`: state, routing (URL hash), top bar. `components/context.tsx`: shared context.
- `components/ui/*`: primitives, table, charts (including the ROAS ruler).
- `components/screens/*`: one file per screen.

## Rules

- Never add real client names, store names, hostnames, account IDs or credentials. All data stays synthetic.
- Store ROAS = store-campaign spend (name contains `NS | <TOKEN>`) vs attributed POS revenue. Fleet, brand, awareness and legacy campaigns are shown but excluded from store ROAS.
- The app renders client-only (`components/client-root.tsx`, `ssr: false`) because the data is anchored to the viewer's current date.
- Run `npx tsc --noEmit` and `npm run build` before committing.
