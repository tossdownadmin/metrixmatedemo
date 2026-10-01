import { MARKETPLACE_COMMISSION, PRODUCTS, SOURCES, type Demo } from "./data";
import { DOW_LABELS, dow } from "./dates";
import { f } from "./format";
import { byStore, campaignStats, pct, productStats, slice, totals, type PlatformFilter, type Range } from "./select";

export type Severity = "critical" | "warning" | "opportunity" | "info";
export type Finding = { id: string; severity: Severity; title: string; body: string; action: string; stores?: { idx: number; label: string }[]; impact?: string };
const RANK: Record<Severity, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };

export function fleetFindings(demo: Demo, cur: Range, prev: Range, target: number, platform: PlatformFilter): Finding[] {
  const out: Finding[] = [];
  const now = byStore(demo, cur, platform), before = byStore(demo, prev, platform);
  const T = totals(slice(demo, cur), platform);
  const spenders = now.filter(s => s.t.spend > 0);
  const medianSpend = [...spenders].sort((a, b) => a.t.spend - b.t.spend)[Math.floor(spenders.length / 2)]?.t.spend ?? 0;

  const leaks = spenders.filter(s => !s.isNew && s.t.roas < target * 0.5 && s.t.spend > medianSpend).sort((a, b) => b.t.spend - a.t.spend);
  if (leaks.length) {
    const spend = leaks.reduce((a, s) => a + s.t.spend, 0);
    out.push({ id: "leaks", severity: "critical", title: `${f.money(spend)} of spend is returning under ${(target * 0.5).toFixed(1)}×`, body: `${leaks.length} established stores spend above the fleet median but return ${f.x(leaks.reduce((a, s) => a + s.t.rev, 0) / spend)} combined. That is ${f.pct(spend / (T.spend || 1), 0)} of total spend producing ${f.pct(leaks.reduce((a, s) => a + s.t.rev, 0) / (T.rev || 1), 0)} of attributed revenue.`, action: `Cut daily budgets at these stores by 25 to 30% and move the savings to the stores in the "Scale" finding below. Review search terms and audiences before restoring spend.`, stores: leaks.map(s => ({ idx: s.store.idx, label: `${s.store.name} ${f.x1(s.t.roas)}` })), impact: f.money(spend) });
  }

  const winners = spenders.filter(s => s.t.roas >= target * 1.35 && s.t.spend <= medianSpend * 1.1).sort((a, b) => b.t.roas - a.t.roas);
  if (winners.length) {
    const extra = winners.reduce((a, s) => a + s.t.spend * 0.3, 0);
    const gain = winners.reduce((a, s) => a + s.t.spend * 0.3 * s.t.roas * 0.7, 0);
    out.push({ id: "scale", severity: "opportunity", title: `${winners.length} stores beat target on a small budget`, body: `These stores return ${f.x1(winners.reduce((a, s) => a + s.t.rev, 0) / winners.reduce((a, s) => a + s.t.spend, 0))} on below-median spend. Adding 30% (${f.money(extra)} over the period) should bring about ${f.money(gain)} in attributed revenue at a conservative 70% marginal efficiency.`, action: "Raise daily budgets 30% for two weeks, then re-check ROAS before the next step up. Keep creative and targeting unchanged so the test stays clean.", stores: winners.map(s => ({ idx: s.store.idx, label: `${s.store.name} ${f.x1(s.t.roas)}` })), impact: `+${f.money(gain)}` });
  }

  const slides = now.map((s, i) => ({ s, ch: pct(s.t.net, before[i].t.net) ?? 0, b: before[i].t })).filter(x => x.ch < -3.5 && !x.s.isNew).sort((a, b) => a.ch - b.ch);
  slides.slice(0, 2).forEach(x => {
    const drops = SOURCES.map((src, j) => ({ src, d: x.s.t.srcSales[j] - x.b.srcSales[j] })).sort((a, b) => a.d - b.d);
    out.push({ id: `slide-${x.s.store.idx}`, severity: "warning", title: `${x.s.store.name} sales are down ${f.delta(x.ch).replace("−", "")}`, body: `Net sales fell from ${f.money(x.b.net)} to ${f.money(x.s.t.net)} against the prior period. Most of the drop is ${drops[0].src} (${f.money(drops[0].d)}) and ${drops[1].src} (${f.money(drops[1].d)}). Those two sources account for ${f.pct(Math.min(1, (drops[0].d + drops[1].d) / (x.s.t.net - x.b.net)), 0)} of the decline.`, action: `Check ${drops[0].src} listing status, prep times and ratings for this store. ${["DoorDash", "Uber Eats"].includes(drops[0].src) ? "A marketplace-led drop usually means the listing was paused or pushed down in search." : "Compare staffing and hours with the prior period."}`, stores: [{ idx: x.s.store.idx, label: x.s.store.name }], impact: f.money(x.s.t.net - x.b.net) });
  });

  const risers = now.map((s, i) => ({ s, ch: pct(s.t.roas, before[i].t.roas) ?? 0 })).filter(x => x.s.t.spend > 0 && x.ch > 8 && x.s.t.roas >= target).sort((a, b) => b.ch - a.ch);
  if (risers.length) {
    const r = risers[0];
    out.push({ id: "riser", severity: "opportunity", title: `${r.s.store.name} ROAS is up ${f.delta(r.ch).replace("+", "")}`, body: `${r.s.store.name} moved to ${f.x(r.s.t.roas)} as Meta took a larger share of its budget. Meta now returns ${f.x(r.s.t.mSpend ? r.s.t.mRev / r.s.t.mSpend : 0)} there, against ${f.x(T.mSpend ? T.mRev / T.mSpend : 0)} fleet-wide.`, action: `Copy this store's Meta conversion setup (audience, offer and creative) to two similar suburban stores as a controlled test.`, stores: risers.slice(0, 3).map(x => ({ idx: x.s.store.idx, label: x.s.store.name })) });
  }

  const ramp = now.filter(s => s.isNew || s.store.openedOffset > cur.startIdx - 120);
  if (ramp.length) out.push({ id: "ramp", severity: "info", title: ramp.length === 1 ? `${ramp[0].store.name} is still ramping` : `${ramp.length} newer stores are still ramping`, body: `${ramp.map(s => s.store.name).join(" and ")} opened in the last eight months. Low ROAS is expected while awareness builds, and new-customer share there runs ${f.pct(ramp.reduce((a, s) => a + s.t.newC, 0) / (ramp.reduce((a, s) => a + s.t.newC + s.t.retC, 0) || 1), 0)}.`, action: "Hold budgets steady and judge these stores on new customers and repeat rate, not ROAS, until they pass six months open.", stores: ramp.map(s => ({ idx: s.store.idx, label: s.store.name })) });

  const mk = now.map(s => ({ s, sh: (s.t.srcSales[3] + s.t.srcSales[4]) / (s.t.net || 1) })).filter(x => x.sh > 0.39).sort((a, b) => b.sh - a.sh);
  if (mk.length) {
    const fees = mk.reduce((a, x) => a + (x.s.t.srcSales[3] + x.s.t.srcSales[4]) * MARKETPLACE_COMMISSION, 0);
    out.push({ id: "mkt", severity: "info", title: `${mk.length} stores take 40% or more of sales through marketplaces`, body: `These stores paid an estimated ${f.money(fees)} in marketplace commission this period. App orders carry a similar ticket with no commission.`, action: "Run an app-only offer (free garlic knots on first app order) with in-bag inserts at these stores.", stores: mk.slice(0, 8).map(x => ({ idx: x.s.store.idx, label: `${x.s.store.name} ${f.pct(x.sh, 0)}` })), impact: f.money(fees) });
  }

  const items = productStats(demo, slice(demo, cur), slice(demo, prev));
  const hh = items.find(i => i.id === "p07");
  if (hh && hh.units > 0) out.push({ id: "menu", severity: "info", title: `${hh.name} reached ${f.pct(hh.share)} of item sales`, body: `The new pizza sold ${f.num(hh.units)} units this period. ${PRODUCTS[0].name} units moved ${f.delta(pct(items[0].units, items[0].prevUnits))} over the same time, so part of the gain is a swap.`, action: "Feature it in the next TikTok and Meta creative round. It is already the best-performing TikTok ad by cost per follow." });

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}

export function storeFindings(demo: Demo, cur: Range, prev: Range, target: number, platform: PlatformFilter, idx: number): Finding[] {
  const out: Finding[] = [];
  const st = demo.stores[idx];
  const rows = slice(demo, cur, idx);
  const t = totals(rows, platform), p = totals(slice(demo, prev, idx), platform);
  const fleet = byStore(demo, cur, platform);
  const medAov = [...fleet].sort((a, b) => a.t.aov - b.t.aov)[Math.floor(fleet.length / 2)].t.aov;

  if (t.spend > 0) {
    const sev: Severity = t.roas >= target ? "opportunity" : t.roas >= target * 0.6 ? "warning" : "critical";
    out.push({ id: "roas", severity: sev, title: t.roas >= target ? `ROAS is ${f.x1(t.roas)}, above the ${target}× target` : `ROAS is ${f.x1(t.roas)}, below the ${target}× target`, body: `${f.money(t.spend)} in spend returned ${f.money(t.rev)} in attributed sales (${f.delta(pct(t.roas, p.roas))} vs prior). Google returns ${f.x(t.gSpend ? t.gRev / t.gSpend : 0)}, Meta ${f.x(t.mSpend ? t.mRev / t.mSpend : 0)}.`, action: t.roas >= target ? "Test a 20 to 30% budget increase on the stronger platform and re-check in two weeks." : `Shift budget toward ${t.gSpend && t.mSpend && t.gRev / t.gSpend > t.mRev / t.mSpend ? "Google search" : "Meta conversions"}, which is returning more here, and pause the weakest campaign below.` });
  }
  const ch = pct(t.net, p.net) ?? 0;
  if (Math.abs(ch) > 3) {
    const b = totals(slice(demo, prev, idx));
    const drops = SOURCES.map((src, j) => ({ src, d: t.srcSales[j] - b.srcSales[j] })).sort((a, c) => (ch < 0 ? a.d - c.d : c.d - a.d));
    out.push({ id: "sales", severity: ch < 0 ? "warning" : "opportunity", title: `Net sales ${ch < 0 ? "down" : "up"} ${f.delta(ch).replace(/[+−]/, "")} vs prior period`, body: `${f.money(t.net)} against ${f.money(p.net)}. ${drops[0].src} moved the most (${drops[0].d > 0 ? "+" : "−"}${f.money(Math.abs(drops[0].d))}).`, action: ch < 0 ? `Check ${drops[0].src} first: listing status, ratings and prep time.` : `Keep doing what is working in ${drops[0].src}. Note the change in the store log so the team knows what drove it.` });
  }
  const byDow = [0, 1, 2, 3, 4, 5, 6].map(d => { const r = rows.filter(x => dow(x.date) === d); return { d, avg: r.reduce((a, x) => a + x.net, 0) / (r.length || 1) }; }).sort((a, b) => a.avg - b.avg);
  out.push({ id: "dow", severity: "info", title: `${DOW_LABELS[byDow[0].d]} is the slowest day`, body: `${DOW_LABELS[byDow[0].d]} averages ${f.money(byDow[0].avg)} against ${f.money(byDow[6].avg)} on ${DOW_LABELS[byDow[6].d]}.`, action: `Try a ${DOW_LABELS[byDow[0].d]}-only app deal and schedule ads to lean into ${DOW_LABELS[byDow[0].d]} afternoons.` });
  if (t.aov < medAov * 0.97) out.push({ id: "aov", severity: "warning", title: `Average order is ${f.money2(t.aov)}, below the fleet median`, body: `The median store averages ${f.money2(medAov)}. Closing half that gap adds about ${f.money(((medAov - t.aov) / 2) * t.orders)} over this period.`, action: "Prompt the Game Night Bundle at checkout and add a side upsell on web and app." });
  const camps = [...campaignStats(demo, cur, "google", idx), ...campaignStats(demo, cur, "meta", idx)].filter(c => c.spend > 0).sort((a, b) => a.revenue / a.spend - b.revenue / b.spend);
  if (camps.length) out.push({ id: "camp", severity: "info", title: `Weakest campaign: ${camps[0].name}`, body: `${f.money(camps[0].spend)} spend at ${f.x(camps[0].revenue / camps[0].spend)}. Best is ${camps[camps.length - 1].name} at ${f.x(camps[camps.length - 1].revenue / camps[camps.length - 1].spend)}.`, action: "Move 20% of the weakest campaign's budget to the best one for this store." });
  if (st.openedOffset > 0) out.push({ id: "new", severity: "info", title: "This store is still in its first year", body: "New stores take six months or more to build repeat traffic. ROAS will trail mature stores until then.", action: "Judge progress on new customers and repeat rate for now." });
  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}
