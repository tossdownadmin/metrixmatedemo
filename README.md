# MetrixMate demo: Northstar Slice Co.

A standalone pitch demo of the MetrixMate restaurant analytics dashboard. Every store, product, campaign, customer and number is fictional and generated in the browser. There is no backend, no API key and no live connector.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production check (same as Vercel)
```

Deploys to Vercel with zero config. Each screen has its own URL hash (for example `/#/insights`) so you can bookmark or share a starting screen for a demo.

## The fictional brand

Northstar Slice Co. runs 42 pizza stores across 8 Great Lakes markets (Columbus, Cleveland, Cincinnati, Detroit, Mid-Michigan, Indianapolis, Chicago, Milwaukee). Brand name and target live in `lib/brand.ts`; store list and menu live in `lib/data.ts`.

## Screens

Dashboard, Sales Comparison, Source Comparison, POS Analysis (dashboard, menu, customers, store comparison, first vs third party), Store Insights (with budget reallocation simulator), Local Market & Reputation, Fleet Strategy (seven plays), Meta Ads, Google Ads, TikTok Ads, Web Analytics (GA4), and Settings → Connectors. The former Workspace and Report Builder pages have been removed.

## Demo controls

Top bar: date range (7 to 90 days), then store picker on store-scoped screens. The fleet-only TikTok and Fleet Strategy screens use the date range without a store picker; Connectors has no data filters. The app uses one unrestricted demo view with no role selector. The ROAS target control remains on the Dashboard and target-dependent screens update.

Local Market & Reputation presents synthetic profile activity, review sentiment, social mentions and fictional nearby pizza competitors. Paid-attributed revenue stays on the Dashboard and channel screens, not on this local screen. Connectors lists Meta Ads, Google Ads, GMB, Facebook, Instagram, TikTok, YouTube, Square, Toast, Clover, Foodtech and GA4. Status labels distinguish modeled demo data from catalog-only entries; no account is connected.

## Stories built into the data

These patterns are planted so Insights and Fleet Strategy always have something sharp to show:

- Wicker Park, Naperville and Troy spend heavily at low ROAS.
- Bay View and Third Ward beat target on small budgets.
- Ferndale's marketplace orders slide over the last ~3 weeks.
- Carmel's ROAS climbs after a Meta push 40 days ago.
- Novi and Fishers are newer stores still ramping (no last-year comparison).
- Hot Honey Crunch launched 55 days ago and is cannibalizing Ember Pepperoni.
- Big game Sunday, Halloween, Thanksgiving and other holidays show up in the daily charts.

The data rolls forward daily (anchored to yesterday, US Eastern), so the demo never looks stale.
