# Demo data contract

`lib/demo-data.ts` creates deterministic, fictional data for the Northstar Slice Co. pitch dashboard. This describes the implementation in this repository, not the reference client's data model.

## Window and entities

- The reporting anchor is the previous UTC calendar day. `makeDemo(anchor)` generates 180 days ending on that date.
- There are 42 fictional stores across five broad regions and ten fictional menu products.
- Every store has one daily record per day: 42 × 180 = 7,560 daily records.
- Each daily record contains orders, net sales, ad spend, attributed revenue/orders, customer counts, and sales/orders split across In Store, Web, Mobile App, DoorDash, and Uber Eats.
- The generator also creates three fictional platform campaigns per store: Google Ads, Meta Ads, and TikTok Ads.

## Relationships

- Store size, weekday/weekend patterns, a gentle trend, and seeded waves shape order volume. One store has a recent decline for demo storytelling.
- Source order counts add up to the store's daily order count. Source sales add up to daily net sales.
- `sum(rows)` is the shared rollup for net sales, orders, average order value, ad spend, attributed revenue, attributed orders, customer counts, and ROAS.
- Campaigns are generated from a 30-day basis; the paid-media screen scales their displayed figures to the selected date range and store.
- Platform filtering changes ad spend and attributed metrics, not POS orders or net sales.

## Boundaries

Several visualizations and comparisons are presentation models, not ledger-derived facts: product units and margin, previous-year comparisons, GA4 sessions and users, paid-media attribution, campaign creative detail, and system sync activity. The UI labels the workspace and data as simulated. There are no production API calls or client records.

When extending the demo, keep totals consistent across the selected store, date range, and platform. Do not introduce real client identifiers or credentials.
