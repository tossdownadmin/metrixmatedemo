# MetrixMate Pizza Chain Demo

A separate, local demo of the reference MetrixMate dashboard using only fictional **Northstar Slice Co.** data. It includes the same visible navigation: Dashboard, Sales Comparison, Source Comparison, POS Analysis, Store Insights, Fleet Strategy, Report Builder, Meta/Google/TikTok Ads Analytics, Web Analytics (GA4), and the Connections, Connectors, Sync History, Settings, and Admin utility pages.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run typecheck` and `npm run build` to verify changes. This app has no real integration, login, or backend requirement.

## Demo controls

The top bar can change the selected store, advertising platform, date range, and demo role. Pages have their own tabs, sorting, tables, and drilldowns. Report Builder can preview and print/save a PDF through the browser. The data is generated deterministically over the last 180 days ending with the previous UTC day, so demo figures are repeatable for a given day.

## Scope and fidelity

The reference project supplies the screen names and reporting concepts. This is a functional, screen-specific reconstruction, not a byte-for-byte copy of the client's implementation. Charts, comparisons, campaign data, and system activity are modeled for presentation. There are no client records, credentials, API calls, or live connectors. See `docs/reference-screen-contract.md` for the screen inventory.
