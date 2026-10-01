import { addDays, daysBetween, dow } from "./dates";
import { jitter, rnd, round2 } from "./rand";

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const SOURCES = ["In Store", "Web", "Mobile App", "DoorDash", "Uber Eats"] as const;
export type Source = (typeof SOURCES)[number];
export const FIRST_PARTY: Source[] = ["In Store", "Web", "Mobile App"];
export const THIRD_PARTY: Source[] = ["DoorDash", "Uber Eats"];
export const MARKETPLACE_COMMISSION = 0.25;

export type Platform = "google" | "meta";
export const PLATFORM_LABEL: Record<Platform, string> = { google: "Google Ads", meta: "Meta Ads" };

export type Store = {
  idx: number;
  id: string;
  name: string;
  city: string;
  state: string;
  market: string;
  slug: string;
  token: string;
  openedOffset: number; // days from window start; <=0 means open for the whole window
  size: number;
  urban: boolean;
  weekendBias: number;
  lateNight: number;
  ticket: number;
  quality: number; // underlying ROAS quality
  spendLevel: number; // daily G+M budget
  conv: number; // site conversion rate
};

const STORE_LIST: [string, string, string, string][] = [
  ["Short North", "Columbus", "OH", "Columbus"],
  ["Clintonville", "Columbus", "OH", "Columbus"],
  ["Grandview", "Grandview Heights", "OH", "Columbus"],
  ["Dublin", "Dublin", "OH", "Columbus"],
  ["Westerville", "Westerville", "OH", "Columbus"],
  ["Gahanna", "Gahanna", "OH", "Columbus"],
  ["Lakewood", "Lakewood", "OH", "Cleveland"],
  ["Ohio City", "Cleveland", "OH", "Cleveland"],
  ["Shaker Heights", "Shaker Heights", "OH", "Cleveland"],
  ["Parma", "Parma", "OH", "Cleveland"],
  ["Strongsville", "Strongsville", "OH", "Cleveland"],
  ["Akron Highland Sq", "Akron", "OH", "Cleveland"],
  ["Over-the-Rhine", "Cincinnati", "OH", "Cincinnati"],
  ["Hyde Park", "Cincinnati", "OH", "Cincinnati"],
  ["Mason", "Mason", "OH", "Cincinnati"],
  ["West Chester", "West Chester", "OH", "Cincinnati"],
  ["Royal Oak", "Royal Oak", "MI", "Detroit"],
  ["Ferndale", "Ferndale", "MI", "Detroit"],
  ["Corktown", "Detroit", "MI", "Detroit"],
  ["Dearborn", "Dearborn", "MI", "Detroit"],
  ["Troy", "Troy", "MI", "Detroit"],
  ["Novi", "Novi", "MI", "Detroit"],
  ["Ann Arbor", "Ann Arbor", "MI", "Detroit"],
  ["East Lansing", "East Lansing", "MI", "Mid-Michigan"],
  ["Okemos", "Okemos", "MI", "Mid-Michigan"],
  ["Eastown", "Grand Rapids", "MI", "Mid-Michigan"],
  ["Kentwood", "Kentwood", "MI", "Mid-Michigan"],
  ["Broad Ripple", "Indianapolis", "IN", "Indianapolis"],
  ["Fountain Square", "Indianapolis", "IN", "Indianapolis"],
  ["Carmel", "Carmel", "IN", "Indianapolis"],
  ["Fishers", "Fishers", "IN", "Indianapolis"],
  ["Greenwood", "Greenwood", "IN", "Indianapolis"],
  ["Wicker Park", "Chicago", "IL", "Chicago"],
  ["Logan Square", "Chicago", "IL", "Chicago"],
  ["Evanston", "Evanston", "IL", "Chicago"],
  ["Oak Park", "Oak Park", "IL", "Chicago"],
  ["Naperville", "Naperville", "IL", "Chicago"],
  ["Bay View", "Milwaukee", "WI", "Milwaukee"],
  ["Third Ward", "Milwaukee", "WI", "Milwaukee"],
  ["Wauwatosa", "Wauwatosa", "WI", "Milwaukee"],
  ["Brookfield", "Brookfield", "WI", "Milwaukee"],
  ["Kenosha", "Kenosha", "WI", "Milwaukee"],
];
const URBAN = new Set(["Short North", "Ohio City", "Over-the-Rhine", "Corktown", "Ferndale", "Wicker Park", "Logan Square", "Third Ward", "Fountain Square", "Broad Ripple", "Eastown", "Bay View"]);

export const MARKETS = Array.from(new Set(STORE_LIST.map(s => s[3])));

export type Product = { id: string; name: string; category: "Pizza" | "Sides" | "Wings" | "Desserts" | "Drinks" | "Bundles"; price: number; margin: number; weight: number; launch?: number };
export const PRODUCTS: Product[] = [
  { id: "p01", name: "Ember Pepperoni", category: "Pizza", price: 18.99, margin: 0.71, weight: 0.17 },
  { id: "p02", name: "North Star Supreme", category: "Pizza", price: 21.99, margin: 0.66, weight: 0.11 },
  { id: "p03", name: "Lakeshore Margherita", category: "Pizza", price: 17.49, margin: 0.74, weight: 0.08 },
  { id: "p04", name: "Smokehouse BBQ Chicken", category: "Pizza", price: 20.99, margin: 0.63, weight: 0.07 },
  { id: "p05", name: "Buffalo Blaze", category: "Pizza", price: 19.99, margin: 0.64, weight: 0.05 },
  { id: "p06", name: "Garden Harvest", category: "Pizza", price: 18.49, margin: 0.69, weight: 0.04 },
  { id: "p07", name: "Hot Honey Crunch", category: "Pizza", price: 20.49, margin: 0.7, weight: 0.0, launch: 55 },
  { id: "p08", name: "Garlic Knot Bites", category: "Sides", price: 6.99, margin: 0.82, weight: 0.12 },
  { id: "p09", name: "Cheesy Breadsticks", category: "Sides", price: 7.99, margin: 0.8, weight: 0.08 },
  { id: "p10", name: "Northstar Wings (10)", category: "Wings", price: 14.99, margin: 0.55, weight: 0.07 },
  { id: "p11", name: "Caesar Side Salad", category: "Sides", price: 6.49, margin: 0.72, weight: 0.03 },
  { id: "p12", name: "Cinnamon Swirl Bites", category: "Desserts", price: 6.49, margin: 0.8, weight: 0.04 },
  { id: "p13", name: "Brownie Skillet", category: "Desserts", price: 7.49, margin: 0.77, weight: 0.03 },
  { id: "p14", name: "2-Liter Soda", category: "Drinks", price: 3.99, margin: 0.86, weight: 0.09 },
  { id: "p15", name: "Game Night Bundle", category: "Bundles", price: 39.99, margin: 0.6, weight: 0.02 },
];
export const ITEMS_PER_ORDER = 2.4;

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export type Day = {
  date: string;
  d: number; // day index in window
  s: number; // store index
  orders: number;
  gross: number;
  discounts: number;
  net: number;
  srcOrders: number[];
  srcSales: number[];
  spend: [number, number]; // google, meta
  rev: [number, number];
  attOrd: [number, number];
  newC: number;
  retC: number;
  sessions: number;
  users: number;
  webPurchases: number;
};

export type TikTokAd = { id: string; campaign: string; name: string; hook: string; launchOffset: number; weight: number; cpm: number; vtr: number; cpf: number; ctr: number; cpa: number };
export type TikTokDay = { date: string; adId: string; spend: number; impressions: number; reach: number; views: number; views6s: number; follows: number; likes: number; shares: number; clicks: number; conversions: number; revenue: number };

export type Demo = {
  anchor: string;
  start: string;
  days: number;
  dates: string[];
  stores: Store[];
  rows: Day[]; // date-major: rows[d * stores.length + s]
  tiktokAds: TikTokAd[];
  tiktok: TikTokDay[];
};

export const WINDOW_DAYS = 460;

/* ------------------------------------------------------------------ */
/* Calendar effects                                                    */
/* ------------------------------------------------------------------ */

function nthWeekday(year: number, month: number, weekday: number, n: number) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7, 12)).toISOString().slice(0, 10);
}
const eventCache = new Map<number, Record<string, number>>();
function eventsFor(year: number) {
  let e = eventCache.get(year);
  if (!e) {
    const thanksgiving = nthWeekday(year, 10, 4, 4);
    e = {
      [nthWeekday(year, 1, 0, 2)]: 1.85, // big game Sunday
      [`${year}-10-31`]: 1.32,
      [`${year}-12-31`]: 1.24,
      [`${year}-12-24`]: 0.72,
      [`${year}-12-25`]: 0.22,
      [`${year}-01-01`]: 1.12,
      [`${year}-07-04`]: 0.78,
      [thanksgiving]: 0.45,
      [addDays(thanksgiving, -1)]: 1.22,
    };
    eventCache.set(year, e);
  }
  return e;
}
export function eventFactor(date: string) {
  return eventsFor(Number(date.slice(0, 4)))[date] ?? 1;
}
export function eventName(date: string) {
  const y = Number(date.slice(0, 4));
  if (date === nthWeekday(y, 1, 0, 2)) return "Big game Sunday";
  if (date.endsWith("-10-31")) return "Halloween";
  if (date.endsWith("-12-31")) return "New Year's Eve";
  if (date.endsWith("-12-25")) return "Christmas";
  if (date === nthWeekday(y, 10, 4, 4)) return "Thanksgiving";
  return null;
}
function season(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const doy = Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
  return 1 + 0.07 * Math.cos((2 * Math.PI * (doy - 38)) / 365);
}

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

const DOW_BASE = [1.1, 0.8, 0.85, 0.9, 1.0, 1.34, 1.4];
const SRC_BASE = [0.35, 0.2, 0.16, 0.18, 0.11];
const SRC_TICKET = [0.93, 1.03, 1.06, 1.14, 1.12];

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function buildStores(): Store[] {
  const n = STORE_LIST.length;
  // ROAS quality: skewed distribution, shuffled deterministically across stores
  const qualities = Array.from({ length: n }, (_, k) => 2.4 + 9.8 * Math.pow(k / (n - 1), 2.6));
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => rnd(a, 77) - rnd(b, 77));
  return STORE_LIST.map(([name, city, state, market], i) => {
    const urban = URBAN.has(name);
    let quality = qualities[order[i]];
    let spendLevel = 34 + rnd(i, 11) * 46;
    let size = 0.72 + rnd(i, 12) * 0.7 + (urban ? 0.08 : 0);
    let openedOffset = 0;
    // Planted stories
    if (name === "Wicker Park") { quality = 2.15; spendLevel = 128; size = 1.32; }
    if (name === "Bay View") { quality = 11.6; spendLevel = 27; }
    if (name === "Third Ward") { quality = 9.4; spendLevel = 31; }
    if (name === "Naperville") { quality = 2.7; spendLevel = 112; }
    if (name === "Troy") { quality = 3.1; spendLevel = 96; }
    if (name === "Carmel") { quality = 7.4; spendLevel = 58; }
    if (name === "Novi") openedOffset = WINDOW_DAYS - 250;
    if (name === "Fishers") openedOffset = WINDOW_DAYS - 132;
    return {
      idx: i,
      id: `ns-${String(i + 1).padStart(3, "0")}`,
      name, city, state, market,
      slug: slugify(name),
      token: name.replace(/[^A-Za-z]/g, "").toUpperCase(),
      openedOffset,
      size,
      urban,
      weekendBias: name === "Mason" || name === "West Chester" ? 0.22 : rnd(i, 13) * 0.1,
      lateNight: urban ? 0.25 + rnd(i, 14) * 0.35 : rnd(i, 14) * 0.18,
      ticket: 25.5 + rnd(i, 15) * 5.5,
      quality,
      spendLevel,
      conv: 0.031 + rnd(i, 16) * 0.018,
    };
  });
}

export function makeDemo(anchor: string): Demo {
  const stores = buildStores();
  const days = WINDOW_DAYS;
  const start = addDays(anchor, -(days - 1));
  const dates: string[] = Array.from({ length: days }, (_, d) => addDays(start, d));
  const rows: Day[] = new Array(days * stores.length);
  const ferndale = stores.find(s => s.name === "Ferndale")!.idx;
  const carmel = stores.find(s => s.name === "Carmel")!.idx;
  const fromEnd = (d: number) => days - 1 - d;

  for (let d = 0; d < days; d++) {
    const date = dates[d];
    const wd = dow(date);
    const ev = eventFactor(date);
    const sea = season(date);
    const growth = 1 + 0.07 * (d / 365);
    const appShift = 0.035 * (d / days);
    for (const st of stores) {
      const s = st.idx;
      const i = d * stores.length + s;
      const open = d >= st.openedOffset;
      if (!open) {
        rows[i] = { date, d, s, orders: 0, gross: 0, discounts: 0, net: 0, srcOrders: [0, 0, 0, 0, 0], srcSales: [0, 0, 0, 0, 0], spend: [0, 0], rev: [0, 0], attOrd: [0, 0], newC: 0, retC: 0, sessions: 0, users: 0, webPurchases: 0 };
        continue;
      }
      const daysOpen = d - st.openedOffset;
      const ramp = st.openedOffset > 0 ? Math.min(1, 0.55 + 0.45 * (daysOpen / 100)) : 1;
      const wkd = wd === 5 || wd === 6 || wd === 0 ? 1 + st.weekendBias : 1;
      let mult = DOW_BASE[wd] * wkd * ev * sea * growth * ramp * (1 + jitter(0.075, s, d, 1));

      // Source shares
      const shares = SRC_BASE.map((v, j) => v * (0.72 + rnd(s, j, 90) * 0.56));
      shares[0] -= appShift; shares[2] += appShift;
      if (st.urban) { shares[3] += 0.06; shares[4] += 0.04; shares[0] -= 0.1; }
      // Planted: Ferndale marketplace slide over the last ~3.5 weeks
      if (s === ferndale && fromEnd(d) < 24) {
        const k = 1 - (24 - fromEnd(d)) / 24 * 0.62;
        shares[3] *= k; shares[4] *= k;
        mult *= 1 - (24 - fromEnd(d)) / 24 * 0.2;
      }
      // Planted: Carmel lift after Meta launch 40 days ago
      if (s === carmel && fromEnd(d) < 40) mult *= 1 + Math.min(1, (40 - fromEnd(d)) / 25) * 0.14;

      const orders = Math.max(0, Math.round(92 * st.size * mult));
      const tot = shares.reduce((a, b) => a + b, 0);
      const srcOrders = shares.map(x => Math.floor((orders * x) / tot));
      srcOrders[0] += orders - srcOrders.reduce((a, b) => a + b, 0);
      const ticket = st.ticket * (wd === 5 ? 1.045 : 1) * (ev > 1.5 ? 1.22 : 1) * (1 + 0.018 * (d / 365));
      const srcSales = srcOrders.map((o, j) => round2(o * ticket * SRC_TICKET[j] * (1 + jitter(0.035, s, d, 20 + j))));
      const net = round2(srcSales.reduce((a, b) => a + b, 0));
      const discRate = 0.055 + rnd(s, d, 3) * 0.03;
      const gross = round2(net / (1 - discRate));

      // Paid media (store-attributed "NS" campaigns only)
      let budget = st.spendLevel * (wd === 5 || wd === 6 ? 1.12 : 1) * (1 + jitter(0.13, s, d, 4)) * ramp;
      let metaShare = 0.42;
      if (s === carmel) metaShare = fromEnd(d) < 40 ? 0.58 : 0.18;
      if (s === carmel && fromEnd(d) < 40) budget *= 1.35;
      const gSpend = round2(budget * (1 - metaShare));
      const mSpend = round2(budget * metaShare);
      const qNoise = 1 + jitter(0.3, s, d, 5);
      const seasonalQ = ev > 1.5 ? 1.5 : 1;
      let q = st.quality * qNoise * seasonalQ;
      if (s === carmel && fromEnd(d) >= 40) q *= 0.72;
      let gRev = gSpend * q * 1.1;
      let mRev = mSpend * q * 0.86;
      const cap = net * 0.42;
      if (gRev + mRev > cap) { const k = cap / (gRev + mRev); gRev *= k; mRev *= k; }
      gRev = round2(gRev); mRev = round2(mRev);
      const attTicket = ticket * 1.06;
      const attOrd: [number, number] = [Math.round(gRev / attTicket), Math.round(mRev / attTicket)];

      const identified = Math.round(orders * (0.74 + rnd(s, 17) * 0.1));
      const newC = Math.round(orders * (0.17 + rnd(s, 18) * 0.06 + (st.openedOffset > 0 ? 0.08 * (1 - ramp) + 0.04 : 0)) + (attOrd[0] + attOrd[1]) * 0.18);
      const retC = Math.max(0, identified - newC);

      const digital = srcOrders[1] + srcOrders[2];
      const sessions = Math.round((digital / st.conv) * (1 + jitter(0.06, s, d, 6)));
      rows[i] = {
        date, d, s, orders, gross, discounts: round2(gross - net), net,
        srcOrders, srcSales,
        spend: [gSpend, mSpend], rev: [gRev, mRev], attOrd,
        newC, retC,
        sessions, users: Math.round(sessions * (0.76 + rnd(s, d, 7) * 0.05)),
        webPurchases: Math.round(digital * 0.94),
      };
    }
  }

  const tiktokAds: TikTokAd[] = [
    { id: "tt1", campaign: "NS | Fleet | Consideration | Follows", name: "Cheese pull, slow motion", hook: "Close-up stretch over a hot slice", launchOffset: 78, weight: 0.34, cpm: 6.1, vtr: 0.36, cpf: 1.48, ctr: 0.0078, cpa: 0 },
    { id: "tt2", campaign: "NS | Fleet | Consideration | Follows", name: "Oven at 6 PM rush", hook: "Behind the counter on a Friday", launchOffset: 78, weight: 0.27, cpm: 6.6, vtr: 0.31, cpf: 1.86, ctr: 0.0069, cpa: 0 },
    { id: "tt3", campaign: "NS | Fleet | Consideration | Follows", name: "Hot Honey drizzle reveal", hook: "New pie, honey pour in one shot", launchOffset: 52, weight: 0.24, cpm: 5.8, vtr: 0.41, cpf: 1.22, ctr: 0.0092, cpa: 0 },
    { id: "tt4", campaign: "NS | Fleet | Consideration | Follows", name: "Crew taste test", hook: "Staff rank the menu blind", launchOffset: 64, weight: 0.15, cpm: 7.2, vtr: 0.26, cpf: 2.44, ctr: 0.0055, cpa: 0 },
    { id: "tt5", campaign: "NS | Fleet | Web Conversions | Ordering", name: "Order in 3 taps", hook: "App ordering screen capture", launchOffset: 23, weight: 0.45, cpm: 8.4, vtr: 0.22, cpf: 4.9, ctr: 0.0124, cpa: 13.8 },
    { id: "tt6", campaign: "NS | Fleet | Web Conversions | Ordering", name: "Game night bundle", hook: "Bundle unboxing on a coffee table", launchOffset: 23, weight: 0.35, cpm: 8.0, vtr: 0.25, cpf: 4.2, ctr: 0.0131, cpa: 12.1 },
    { id: "tt7", campaign: "NS | Fleet | Web Conversions | Ordering", name: "Late-night slice run", hook: "Night drive, porch handoff", launchOffset: 19, weight: 0.2, cpm: 8.9, vtr: 0.2, cpf: 5.6, ctr: 0.0108, cpa: 16.4 },
  ];
  const tiktok: TikTokDay[] = [];
  tiktokAds.forEach((ad, a) => {
    const campaignDaily = ad.campaign.includes("Consideration") ? 86 : 64;
    for (let back = ad.launchOffset - 1; back >= 0; back--) {
      const d = days - 1 - back;
      const date = dates[d];
      const age = ad.launchOffset - back;
      const fatigue = 1 - Math.min(0.28, age / 260);
      const spend = round2(campaignDaily * ad.weight * (1 + jitter(0.16, a, d, 30)) * (age < 4 ? 0.6 : 1));
      const impressions = Math.round((spend / ad.cpm) * 1000 * (1 + jitter(0.1, a, d, 31)));
      const views = Math.round(impressions * ad.vtr * fatigue);
      const follows = Math.round((spend / ad.cpf) * fatigue * (1 + jitter(0.18, a, d, 32)));
      const clicks = Math.round(impressions * ad.ctr * (1 + jitter(0.15, a, d, 33)));
      const conversions = ad.cpa ? Math.round((spend / ad.cpa) * (1 + jitter(0.25, a, d, 34))) : 0;
      tiktok.push({
        date, adId: ad.id, spend, impressions, reach: Math.round(impressions * 0.71), views,
        views6s: Math.round(views * 0.46), follows, likes: Math.round(views * 0.052), shares: Math.round(views * 0.0061),
        clicks, conversions, revenue: round2(conversions * 31.4),
      });
    }
  });

  return { anchor, start, days, dates, stores, rows, tiktokAds, tiktok };
}

export function storeOpenOn(st: Store, demo: Demo, date: string) {
  return daysBetween(demo.start, date) >= st.openedOffset;
}
