import { addDays, dow } from "./dates";
import { jitter, rnd, round2 } from "./rand";
import { eventFactor, ITEMS_PER_ORDER, MARKETS, PRODUCTS, SOURCES, type Day, type Demo, type Store } from "./data";

export type PlatformFilter = "all" | "google" | "meta";
export type Range = { startIdx: number; endIdx: number; start: string; end: string; days: number };

export function makeRange(demo: Demo, days: number, shift = 0): Range {
  const endIdx = demo.days - 1 - shift;
  const startIdx = Math.max(0, endIdx - days + 1);
  return { startIdx, endIdx, start: demo.dates[startIdx], end: demo.dates[endIdx], days };
}
export function periodRanges(demo: Demo, days: number) {
  return { cur: makeRange(demo, days), prev: makeRange(demo, days, days), ly: makeRange(demo, days, 364) };
}

export function slice(demo: Demo, r: Range, storeIdx?: number | null): Day[] {
  const S = demo.stores.length;
  if (storeIdx != null) {
    const out: Day[] = [];
    for (let d = r.startIdx; d <= r.endIdx; d++) out.push(demo.rows[d * S + storeIdx]);
    return out;
  }
  return demo.rows.slice(r.startIdx * S, (r.endIdx + 1) * S);
}

export type Totals = {
  orders: number; gross: number; discounts: number; net: number; aov: number;
  gSpend: number; mSpend: number; spend: number; gRev: number; mRev: number; rev: number;
  gOrd: number; mOrd: number; attOrd: number; roas: number;
  newC: number; retC: number; sessions: number; users: number; webPurchases: number; convRate: number;
  srcOrders: number[]; srcSales: number[];
};

export function totals(rows: Day[], platform: PlatformFilter = "all"): Totals {
  const t: Totals = { orders: 0, gross: 0, discounts: 0, net: 0, aov: 0, gSpend: 0, mSpend: 0, spend: 0, gRev: 0, mRev: 0, rev: 0, gOrd: 0, mOrd: 0, attOrd: 0, roas: 0, newC: 0, retC: 0, sessions: 0, users: 0, webPurchases: 0, convRate: 0, srcOrders: [0, 0, 0, 0, 0], srcSales: [0, 0, 0, 0, 0] };
  for (const r of rows) {
    t.orders += r.orders; t.gross += r.gross; t.discounts += r.discounts; t.net += r.net;
    t.gSpend += r.spend[0]; t.mSpend += r.spend[1]; t.gRev += r.rev[0]; t.mRev += r.rev[1];
    t.gOrd += r.attOrd[0]; t.mOrd += r.attOrd[1];
    t.newC += r.newC; t.retC += r.retC; t.sessions += r.sessions; t.users += r.users; t.webPurchases += r.webPurchases;
    for (let j = 0; j < 5; j++) { t.srcOrders[j] += r.srcOrders[j]; t.srcSales[j] += r.srcSales[j]; }
  }
  const g = platform !== "meta", m = platform !== "google";
  t.spend = (g ? t.gSpend : 0) + (m ? t.mSpend : 0);
  t.rev = (g ? t.gRev : 0) + (m ? t.mRev : 0);
  t.attOrd = (g ? t.gOrd : 0) + (m ? t.mOrd : 0);
  t.roas = t.spend ? t.rev / t.spend : 0;
  t.aov = t.orders ? t.net / t.orders : 0;
  t.convRate = t.sessions ? t.webPurchases / t.sessions : 0;
  return t;
}

export function pct(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export type StoreTotals = { store: Store; t: Totals; isNew: boolean };
export function byStore(demo: Demo, r: Range, platform: PlatformFilter = "all"): StoreTotals[] {
  return demo.stores.map(store => {
    const rows = slice(demo, r, store.idx);
    return { store, t: totals(rows, platform), isNew: store.openedOffset > r.startIdx - 1 && store.openedOffset > 0 };
  });
}

export type SeriesPoint = Totals & { date: string };
export function daily(demo: Demo, r: Range, storeIdx: number | null, platform: PlatformFilter = "all"): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const S = demo.stores.length;
  for (let d = r.startIdx; d <= r.endIdx; d++) {
    const rows = storeIdx != null ? [demo.rows[d * S + storeIdx]] : demo.rows.slice(d * S, (d + 1) * S);
    out.push({ date: demo.dates[d], ...totals(rows, platform) });
  }
  return out;
}

/** Group series by ISO-ish week (7-day buckets ending on the anchor). */
export function weekly(points: SeriesPoint[]) {
  const out: { label: string; start: string; points: SeriesPoint[] }[] = [];
  for (let i = points.length; i > 0; i -= 7) {
    const chunk = points.slice(Math.max(0, i - 7), i);
    out.unshift({ label: chunk[0].date, start: chunk[0].date, points: chunk });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export function productWeights(demo: Demo, row: Day) {
  const fromEnd = demo.days - 1 - row.d;
  const wd = dow(row.date);
  const ev = eventFactor(row.date);
  return PRODUCTS.map((p, k) => {
    let w = p.weight * (0.82 + rnd(row.s, k, 40) * 0.36);
    if (p.launch) w = fromEnd < p.launch ? 0.055 * Math.min(1, (p.launch - fromEnd) / 14) : 0;
    if (p.id === "p01") { const hh = PRODUCTS[6].launch!; if (fromEnd < hh) w *= 1 - 0.32 * Math.min(1, (hh - fromEnd) / 14); }
    if (p.category === "Bundles") w *= (wd === 5 || wd === 6 || wd === 0 ? 1.7 : 1) * (ev > 1.5 ? 4.5 : 1);
    if (p.category === "Wings" && ev > 1.5) w *= 2.6;
    return w;
  });
}

export type ProductStat = { id: string; name: string; category: string; price: number; margin: number; units: number; sales: number; share: number; prevUnits: number };
export function productStats(demo: Demo, rows: Day[], prevRows: Day[] = []): ProductStat[] {
  const units = PRODUCTS.map(() => 0), sales = PRODUCTS.map(() => 0), prev = PRODUCTS.map(() => 0);
  const acc = (list: Day[], target: number[], withSales: boolean) => {
    for (const r of list) {
      if (!r.orders) continue;
      const w = productWeights(demo, r);
      const sw = w.reduce((a, b) => a + b, 0);
      const u = w.map(x => (r.orders * ITEMS_PER_ORDER * x) / sw);
      const menu = u.reduce((a, x, k) => a + x * PRODUCTS[k].price, 0);
      for (let k = 0; k < PRODUCTS.length; k++) {
        target[k] += u[k];
        if (withSales) sales[k] += (r.gross * u[k] * PRODUCTS[k].price) / menu;
      }
    }
  };
  acc(rows, units, true);
  acc(prevRows, prev, false);
  const totalSales = sales.reduce((a, b) => a + b, 0) || 1;
  return PRODUCTS.map((p, k) => ({ id: p.id, name: p.name, category: p.category, price: p.price, margin: p.margin, units: Math.round(units[k]), sales: round2(sales[k]), share: sales[k] / totalSales, prevUnits: Math.round(prev[k]) }));
}

/* ------------------------------------------------------------------ */
/* Hours and dayparts                                                  */
/* ------------------------------------------------------------------ */

export const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
const HOUR_BASE = [0.012, 0.05, 0.088, 0.068, 0.04, 0.034, 0.05, 0.108, 0.148, 0.128, 0.09, 0.06, 0.04, 0.025, 0.015, 0.008];
export function hourLabel(h: number) { const x = h % 24; return x === 0 ? "12a" : x < 12 ? `${x}a` : x === 12 ? "12p" : `${x - 12}p`; }
export function hourProfile(store: Store, wd: number) {
  const w = HOUR_BASE.map((v, k) => {
    const h = HOURS[k];
    let x = v;
    if (h >= 21) x *= 1 + store.lateNight;
    if ((wd === 0 || wd === 6) && h >= 11 && h <= 14) x *= 1.35;
    if ((wd === 5 || wd === 6) && h >= 21) x *= 1.25;
    return x;
  });
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / sum);
}
/** orders[dow][hourIdx] for the given rows */
export function hourHeat(demo: Demo, rows: Day[]) {
  const grid = Array.from({ length: 7 }, () => HOURS.map(() => 0));
  for (const r of rows) {
    if (!r.orders) continue;
    const wd = dow(r.date);
    const prof = hourProfile(demo.stores[r.s], wd);
    for (let k = 0; k < HOURS.length; k++) grid[wd][k] += r.orders * prof[k];
  }
  return grid;
}
export const DAYPARTS = [
  { name: "Lunch", from: 10, to: 13 },
  { name: "Afternoon", from: 14, to: 16 },
  { name: "Dinner", from: 17, to: 20 },
  { name: "Late night", from: 21, to: 25 },
];
export function dayparts(demo: Demo, rows: Day[]) {
  const heat = hourHeat(demo, rows);
  const orders = DAYPARTS.map(dp => heat.reduce((a, row) => a + row.reduce((b, v, k) => b + (HOURS[k] >= dp.from && HOURS[k] <= dp.to ? v : 0), 0), 0));
  const t = totals(rows);
  const all = orders.reduce((a, b) => a + b, 0) || 1;
  const tick = [0.94, 0.9, 1.05, 1.08];
  return DAYPARTS.map((dp, k) => ({ ...dp, orders: Math.round(orders[k]), sales: (t.net * (orders[k] / all) * tick[k]) / (DAYPARTS.reduce((a, _, j) => a + (orders[j] / all) * tick[j], 0)) }));
}

/* ------------------------------------------------------------------ */
/* Campaigns (Google + Meta)                                           */
/* ------------------------------------------------------------------ */

export type Campaign = {
  id: string; name: string; platform: "google" | "meta"; type: string; scope: "store" | "fleet";
  storeIdx: number | null; status: "Active" | "Paused" | "Ended"; inRoas: boolean;
  spend: number; impressions: number; clicks: number; conversions: number; revenue: number;
};

type Def = { id: string; name: string; platform: "google" | "meta"; type: string; share: number; cpc: number; ctr: number; storeIdx: number | null; fleetDaily?: number; fleetRoas?: number; endBack?: number; status?: Campaign["status"] };

function campaignDefs(demo: Demo): Def[] {
  const defs: Def[] = [];
  demo.stores.forEach(st => {
    defs.push({ id: `g-s-${st.idx}`, name: `NS | ${st.token} | Search | Local`, platform: "google", type: "Search", share: 0.62, cpc: 1.35 + rnd(st.idx, 50) * 0.75, ctr: 0.062 + rnd(st.idx, 51) * 0.03, storeIdx: st.idx });
    defs.push({ id: `g-p-${st.idx}`, name: `NS | ${st.token} | PMax | Ordering`, platform: "google", type: "Performance Max", share: 0.38, cpc: 0.68 + rnd(st.idx, 52) * 0.4, ctr: 0.016 + rnd(st.idx, 53) * 0.009, storeIdx: st.idx });
    defs.push({ id: `m-c-${st.idx}`, name: `NS | ${st.token} | Conversions | Ordering`, platform: "meta", type: "Sales", share: 0.76, cpc: 0.78 + rnd(st.idx, 54) * 0.45, ctr: 0.011 + rnd(st.idx, 55) * 0.006, storeIdx: st.idx });
    defs.push({ id: `m-r-${st.idx}`, name: `NS | ${st.token} | Retargeting | App`, platform: "meta", type: "Retargeting", share: 0.24, cpc: 0.62 + rnd(st.idx, 56) * 0.3, ctr: 0.017 + rnd(st.idx, 57) * 0.006, storeIdx: st.idx });
  });
  defs.push({ id: "g-brand", name: "NS | Brand | Search", platform: "google", type: "Brand search", share: 0, cpc: 0.42, ctr: 0.21, storeIdx: null, fleetDaily: 94, fleetRoas: 9.2 });
  defs.push({ id: "g-legacy", name: "Ohio Region | Display (legacy)", platform: "google", type: "Display", share: 0, cpc: 0.38, ctr: 0.0042, storeIdx: null, fleetDaily: 41, fleetRoas: 0.9, endBack: 31, status: "Paused" });
  ["Columbus", "Detroit", "Chicago"].forEach((mk, k) => defs.push({ id: `m-aw-${k}`, name: `NS | ${mk} | Awareness | Reels`, platform: "meta", type: "Awareness", share: 0, cpc: 1.9, ctr: 0.0058, storeIdx: null, fleetDaily: 26 + k * 4, fleetRoas: 0 }));
  defs.push({ id: "m-legacy", name: "Corporate | Brand Love (legacy)", platform: "meta", type: "Engagement", share: 0, cpc: 1.4, ctr: 0.007, storeIdx: null, fleetDaily: 35, fleetRoas: 0.4, endBack: 46, status: "Ended" });
  return defs;
}

let defsCache: { demo: Demo; defs: Def[] } | null = null;
function getDefs(demo: Demo) { if (!defsCache || defsCache.demo !== demo) defsCache = { demo, defs: campaignDefs(demo) }; return defsCache.defs; }

export function campaignStats(demo: Demo, r: Range, platform: "google" | "meta", storeIdx: number | null): Campaign[] {
  const p = platform === "google" ? 0 : 1;
  const S = demo.stores.length;
  return getDefs(demo).filter(df => df.platform === platform && (storeIdx == null || df.storeIdx === storeIdx)).map((df, n) => {
    let spend = 0, conversions = 0, revenue = 0;
    if (df.storeIdx != null) {
      for (let d = r.startIdx; d <= r.endIdx; d++) {
        const row = demo.rows[d * S + df.storeIdx];
        const k = df.type === "Retargeting" ? 1.25 : df.type === "Performance Max" ? 0.86 : df.type === "Search" ? 1.09 : 0.92;
        spend += row.spend[p] * df.share;
        revenue += row.rev[p] * df.share * k;
        conversions += row.attOrd[p] * df.share * k;
      }
    } else {
      for (let d = r.startIdx; d <= r.endIdx; d++) {
        if (df.endBack && demo.days - 1 - d < df.endBack) continue;
        const s = df.fleetDaily! * (1 + jitter(0.12, n, d, 60)) * eventFactor(demo.dates[d]);
        spend += s;
        revenue += s * (df.fleetRoas ?? 0) * (1 + jitter(0.2, n, d, 61));
      }
      conversions = revenue / 29.5;
    }
    const clicks = spend / df.cpc;
    const impressions = clicks / df.ctr;
    const status: Campaign["status"] = df.status ?? "Active";
    return { id: df.id, name: df.name, platform: df.platform, type: df.type, scope: (df.storeIdx != null ? "store" : "fleet") as Campaign["scope"], storeIdx: df.storeIdx, status, inRoas: df.storeIdx != null, spend: round2(spend), impressions: Math.round(impressions), clicks: Math.round(clicks), conversions: Math.round(conversions), revenue: round2(revenue) };
  }).filter(c => c.spend > 0 || c.status !== "Ended");
}

export function fleetDailySpend(demo: Demo, r: Range, platform: "google" | "meta") {
  const defs = getDefs(demo).filter(df => df.platform === platform && df.storeIdx == null);
  return Array.from({ length: r.endIdx - r.startIdx + 1 }, (_, i) => {
    const d = r.startIdx + i;
    let spend = 0, revenue = 0;
    defs.forEach(df => {
      const n = getDefs(demo).filter(x => x.platform === platform).indexOf(df);
      if (df.endBack && demo.days - 1 - d < df.endBack) return;
      const s = df.fleetDaily! * (1 + jitter(0.12, n, d, 60)) * eventFactor(demo.dates[d]);
      spend += s; revenue += s * (df.fleetRoas ?? 0) * (1 + jitter(0.2, n, d, 61));
    });
    return { date: demo.dates[d], spend, revenue };
  });
}

/* ------------------------------------------------------------------ */
/* Recent attributed orders (sample feed)                              */
/* ------------------------------------------------------------------ */

export type AttributedOrder = { id: string; date: string; time: string; store: Store; platform: "google" | "meta"; campaign: string; sourceMedium: string; source: string; items: number; amount: number; customer: "New" | "Returning" };
export function recentAttributedOrders(demo: Demo, storeIdx: number | null, platform: PlatformFilter, limit = 60): AttributedOrder[] {
  const out: AttributedOrder[] = [];
  const S = demo.stores.length;
  for (let d = demo.days - 1; d >= demo.days - 4 && out.length < limit * 3; d--) {
    for (let s = 0; s < S; s++) {
      if (storeIdx != null && s !== storeIdx) continue;
      const row = demo.rows[d * S + s];
      const st = demo.stores[s];
      ([0, 1] as const).forEach(p => {
        if (platform !== "all" && (platform === "google") !== (p === 0)) return;
        const n = Math.min(row.attOrd[p], storeIdx != null ? 8 : 2);
        for (let k = 0; k < n; k++) {
          const u = rnd(s, d, 100 + p * 10 + k);
          const hour = 11 + Math.floor(rnd(s, d, 200 + k) * 12);
          const min = Math.floor(rnd(s, d, 300 + k) * 60);
          const isApp = u < 0.4;
          const retarget = p === 1 && u > 0.78;
          out.push({
            id: `NS-${String(d).padStart(3, "0")}${String(s).padStart(2, "0")}${p}${k}`,
            date: row.date,
            time: `${hour > 12 ? hour - 12 : hour}:${String(min).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`,
            store: st,
            platform: p === 0 ? "google" : "meta",
            campaign: p === 0 ? `NS | ${st.token} | ${u < 0.6 ? "Search | Local" : "PMax | Ordering"}` : `NS | ${st.token} | ${retarget ? "Retargeting | App" : "Conversions | Ordering"}`,
            sourceMedium: p === 0 ? "google / cpc" : u < 0.5 ? "meta_td / paid" : u < 0.8 ? "ig / paid" : "fb / paid",
            source: isApp ? "Mobile App" : "Web",
            items: 1 + Math.floor(rnd(s, d, 400 + k) * 4),
            amount: round2(st.ticket * (0.7 + rnd(s, d, 500 + k) * 0.9)),
            customer: rnd(s, d, 600 + k) < 0.34 ? "New" : "Returning",
          });
        }
      });
    }
  }
  return out.sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date))).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Customers (cohorts are a presentation model)                        */
/* ------------------------------------------------------------------ */

export function cohorts(demo: Demo, storeIdx: number | null) {
  const out: { month: string; size: number; retention: (number | null)[] }[] = [];
  const S = demo.stores.length;
  const anchor = demo.anchor;
  const endMonth = new Date(`${anchor.slice(0, 7)}-01T12:00:00Z`);
  for (let m = 6; m >= 1; m--) {
    const md = new Date(endMonth); md.setUTCMonth(md.getUTCMonth() - m);
    const key = md.toISOString().slice(0, 7);
    let size = 0;
    for (let d = 0; d < demo.days; d++) {
      if (!demo.dates[d].startsWith(key)) continue;
      for (let s = 0; s < S; s++) if (storeIdx == null || s === storeIdx) size += demo.rows[d * S + s].newC;
    }
    const retention = Array.from({ length: 6 }, (_, k) => (k + 1 > m - 0 ? null : Math.max(0.06, 0.37 * Math.pow(k + 1, -0.52) * (1 + jitter(0.06, m, k, 70)) + (m <= 2 ? 0.02 : 0))));
    out.push({ month: key, size, retention });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* GA4 (channel model)                                                 */
/* ------------------------------------------------------------------ */

export const GA4_CHANNELS = [
  { name: "Organic Search", share: 0.33, conv: 0.9 },
  { name: "Direct", share: 0.19, conv: 1.35 },
  { name: "Paid Search", share: 0.2, conv: 1.22 },
  { name: "Paid Social", share: 0.12, conv: 0.74 },
  { name: "Organic Social", share: 0.07, conv: 0.42 },
  { name: "Email", share: 0.05, conv: 1.6 },
  { name: "Referral", share: 0.04, conv: 0.65 },
];
export const SOURCE_MEDIUMS = [
  { sm: "google / organic", share: 0.31, conv: 0.9, paid: false },
  { sm: "(direct) / (none)", share: 0.19, conv: 1.35, paid: false },
  { sm: "google / cpc", share: 0.19, conv: 1.24, paid: true },
  { sm: "meta_td / paid", share: 0.055, conv: 0.86, paid: true },
  { sm: "ig / paid", share: 0.04, conv: 0.71, paid: true },
  { sm: "fb / paid", share: 0.025, conv: 0.66, paid: true },
  { sm: "tiktok / paid", share: 0.012, conv: 0.38, paid: false },
  { sm: "newsletter / email", share: 0.05, conv: 1.6, paid: false },
  { sm: "instagram.com / referral", share: 0.07, conv: 0.42, paid: false },
  { sm: "bing / organic", share: 0.02, conv: 0.88, paid: false },
  { sm: "localguide.example / referral", share: 0.028, conv: 0.65, paid: false },
];

export function marketOf(demo: Demo, storeIdx: number) { return demo.stores[storeIdx].market; }
export { MARKETS, SOURCES, addDays };
