export const BRAND = { name: "Northstar Slice Co.", targetRoas: 6 } as const;
export type Source = "In Store" | "Web" | "Mobile App" | "DoorDash" | "Uber Eats";
export type Platform = "Google Ads" | "Meta Ads" | "TikTok Ads";
export type Store = { id: string; name: string; region: string; market: string; size: number; latitude: number; longitude: number };
export type Daily = { date: string; storeId: string; orders: number; sales: number; adSpend: number; attributedRevenue: number; attributedOrders: number; newCustomers: number; returningCustomers: number; bySource: Record<Source, { orders: number; sales: number }> };
export type Campaign = { id: string; name: string; platform: Platform; objective: string; storeId: string; spend: number; impressions: number; clicks: number; orders: number; revenue: number; status: "Active" | "Paused" };
export type Demo = { anchor: string; stores: Store[]; daily: Daily[]; campaigns: Campaign[] };
export const SOURCES: Source[] = ["In Store", "Web", "Mobile App", "DoorDash", "Uber Eats"];
export const PLATFORMS: Platform[] = ["Google Ads", "Meta Ads", "TikTok Ads"];
export const PRODUCTS = [
  { name: "Northern Lights Pizza", category: "Pizza", price: 19.5, margin: 0.68 },
  { name: "Ember Pepperoni", category: "Pizza", price: 18.25, margin: 0.7 },
  { name: "Maple Fire Chicken", category: "Pizza", price: 21, margin: 0.62 },
  { name: "Lakeside Margherita", category: "Pizza", price: 17.75, margin: 0.72 },
  { name: "Cedar Smoke Wings", category: "Wings", price: 13.5, margin: 0.58 },
  { name: "Copper Crust Bites", category: "Sides", price: 8.5, margin: 0.76 },
  { name: "Prairie Garlic Knots", category: "Sides", price: 7.25, margin: 0.78 },
  { name: "Midnight Brownie", category: "Dessert", price: 6.75, margin: 0.74 },
  { name: "Orchard Sparkling Soda", category: "Beverage", price: 3.75, margin: 0.8 },
  { name: "Summit Ranch Dip", category: "Sides", price: 2.75, margin: 0.82 },
];
const prefixes = ["Harborview", "Cedarfield", "Pinehaven", "Copper Ridge", "Mapleford", "Westlake", "Northcrest", "Silver Brook", "Ashford", "Elm Harbor", "Summit Vale", "Willow Bend", "Stonebridge", "Foxhaven"];
const suffixes = ["Market", "Crossing", "District"];
const regions = ["Great Lakes", "Northeast", "Prairie", "Pacific Northwest", "Ontario"];
export const STORES: Store[] = Array.from({ length: 42 }, (_, index) => {
  const region = regions[index % regions.length];
  return { id: `ns-${String(index + 1).padStart(3, "0")}`, name: `${prefixes[index % 14]} ${suffixes[Math.floor(index / 14)]}`, region, market: `Market ${String.fromCharCode(65 + index % 12)}`, size: 0.78 + (index * 13 % 17) / 20, latitude: 39 + index % 9 + (index % 3) / 4, longitude: -96 + (index * 7 % 27) };
});
function wave(n: number, seed: number) { return Math.sin(n * 1.77 + seed * 2.31) * 0.045 + Math.cos(n * 0.31 + seed) * 0.025; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
export function currentAnchor() { return dateOffset(isoDay(new Date()), -1); }
export function dateOffset(anchor: string, days: number) { const d = new Date(`${anchor}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return isoDay(d); }
export function makeDemo(anchor: string): Demo {
  const daily: Daily[] = [];
  for (let day = 0; day < 180; day++) {
    const date = dateOffset(anchor, day - 179);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    for (const [i, store] of STORES.entries()) {
      const weekend = weekday === 5 || weekday === 6 ? 1.23 : weekday === 0 ? 1.12 : weekday === 1 ? 0.84 : 1;
      const season = 0.93 + day / 180 * 0.13;
      const dip = i === 1 && day > 165 ? 0.78 : 1;
      const orders = Math.round((77 + i % 9 * 5) * store.size * weekend * season * dip * (1 + wave(day, i)));
      const avgTicket = 26 + i % 8 * 1.25 + (weekday === 5 ? 1.4 : 0);
      const counts = [0.24, 0.27, 0.25, 0.15, 0.09].map(x => Math.floor(orders * x));
      counts[0] += orders - counts.reduce((a, b) => a + b, 0);
      const bySource = {} as Daily["bySource"];
      SOURCES.forEach((source, j) => { bySource[source] = { orders: counts[j], sales: round2(counts[j] * avgTicket * [0.92, 1.02, 1.08, 1.12, 1.1][j]) }; });
      const sales = round2(SOURCES.reduce((total, source) => total + bySource[source].sales, 0));
      const adSpend = round2((sales / (5.3 + (i * 7 % 29) / 10)) * 0.33);
      const attributedRevenue = round2(adSpend * (4.2 + (i * 17 % 39) / 10));
      const attributedOrders = Math.round(attributedRevenue / (avgTicket * 1.05));
      const newCustomers = Math.round(orders * (0.22 + (i % 4) * 0.015));
      daily.push({ date, storeId: store.id, orders, sales, adSpend, attributedRevenue, attributedOrders, newCustomers, returningCustomers: Math.round(orders * 0.56), bySource });
    }
  }
  const names = { "Google Ads": ["Local Search | Dinner", "Brand Search | Direct Orders", "Performance Max | Family Night"], "Meta Ads": ["Weekend Family Bundle", "App Ordering | Retargeting", "New Guest Prospecting"], "TikTok Ads": ["Crust Cam | Video Views", "Slice Night | Conversion", "Creators | Local Reach"] };
  const campaigns: Campaign[] = [];
  for (const [i, store] of STORES.entries()) for (const [p, platform] of PLATFORMS.entries()) {
    const basis = daily.slice(-42 * 30).filter(row => row.storeId === store.id).reduce((total, row) => total + row.adSpend, 0);
    const spend = round2(basis * [0.48, 0.36, 0.16][p]);
    campaigns.push({ id: `${store.id}-${p}`, name: `${store.name} · ${names[platform][i % 3]}`, platform, objective: p === 2 ? "Awareness" : "Sales", storeId: store.id, spend, impressions: Math.round(spend * (p === 2 ? 183 : 91)), clicks: Math.round(spend * (p === 0 ? 2.9 : 2.1)), orders: Math.round(spend * (p === 0 ? 0.2 : 0.14)), revenue: round2(spend * ([6.8, 5.3, 3.8][p] + (i % 5) * 0.18)), status: i % 11 === 0 ? "Paused" : "Active" });
  }
  return { anchor, stores: STORES, daily, campaigns };
}
export function sum(rows: Daily[]) {
  const sales = round2(rows.reduce((n, r) => n + r.sales, 0));
  const orders = rows.reduce((n, r) => n + r.orders, 0);
  const adSpend = round2(rows.reduce((n, r) => n + r.adSpend, 0));
  const attributedRevenue = round2(rows.reduce((n, r) => n + r.attributedRevenue, 0));
  const attributedOrders = rows.reduce((n, r) => n + r.attributedOrders, 0);
  const newCustomers = rows.reduce((n, r) => n + r.newCustomers, 0);
  const returningCustomers = rows.reduce((n, r) => n + r.returningCustomers, 0);
  return { sales, orders, adSpend, attributedRevenue, attributedOrders, newCustomers, returningCustomers, aov: orders ? sales / orders : 0, roas: adSpend ? attributedRevenue / adSpend : 0 };
}
