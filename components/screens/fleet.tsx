"use client";

import { useMemo, useState } from "react";
import { MARKETPLACE_COMMISSION } from "@/lib/data";
import { DOW_LABELS, dow } from "@/lib/dates";
import { f } from "@/lib/format";
import { byStore, dayparts, pct, slice } from "@/lib/select";
import { useApp } from "@/components/context";
import { Card, Pill } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/table";

type PlayStore = { idx: number; name: string; stat: string };
type Play = { id: string; name: string; headline: string; why: string; steps: string[]; watch: string; stores: PlayStore[] };

export function FleetStrategy() {
  const { demo, cur, prev, target, setStoreIdx, go } = useApp();
  const plays = useMemo<Play[]>(() => {
    const now = byStore(demo, cur), before = byStore(demo, prev);
    const q = Math.ceil(now.length / 4);
    const spend = now.filter(s => s.t.spend > 0 && !s.isNew);
    const take = <T,>(arr: T[], n = q) => arr.slice(0, n);
    const win = take([...spend].sort((a, b) => b.t.roas - a.t.roas));
    const leak = take([...spend].sort((a, b) => a.t.roas * 1000 / a.t.spend - b.t.roas * 1000 / b.t.spend));
    const dowStats = now.map(s => {
      const rows = slice(demo, cur, s.store.idx);
      const avg = [0, 1, 2, 3, 4, 5, 6].map(d => { const r = rows.filter(x => dow(x.date) === d); return r.reduce((a, x) => a + x.net, 0) / (r.length || 1); });
      const mean = avg.reduce((a, b) => a + b, 0) / 7;
      const min = Math.min(...avg);
      return { s, avg, gap: (mean - min) / mean, slow: avg.indexOf(min) };
    });
    const slow = take([...dowStats].sort((a, b) => b.gap - a.gap));
    const mk = take(now.map(s => ({ s, sh: (s.t.srcSales[3] + s.t.srcSales[4]) / (s.t.net || 1) })).sort((a, b) => b.sh - a.sh));
    const aov = take([...now].sort((a, b) => a.t.aov - b.t.aov));
    const late = take(now.map(s => { const dp = dayparts(demo, slice(demo, cur, s.store.idx)); return { s, sh: dp[3].sales / (s.t.net || 1) }; }).sort((a, b) => b.sh - a.sh));
    const slide = take(now.map((s, i) => ({ s, ch: pct(s.t.net, before[i].t.net) ?? 0 })).filter(x => !x.s.isNew && x.ch < 0).sort((a, b) => a.ch - b.ch));
    const medAov = [...now].sort((a, b) => a.t.aov - b.t.aov)[Math.floor(now.length / 2)].t.aov;
    return [
      { id: "scale", name: "Scale the winners", headline: `${f.x1(win.reduce((a, s) => a + s.t.rev, 0) / win.reduce((a, s) => a + s.t.spend, 0))} average ROAS`, why: "The top quarter of stores by ROAS can absorb more budget before returns flatten.", steps: ["Raise daily budgets 20 to 30% for two weeks.", "Keep creative and audiences unchanged so the read is clean.", "Step up again only if ROAS holds within 15% of where it started."], watch: `ROAS staying above ${target}×`, stores: win.map(s => ({ idx: s.store.idx, name: s.store.name, stat: f.x1(s.t.roas) })) },
      { id: "leaks", name: "Fix the leaks", headline: `${f.money(leak.reduce((a, s) => a + s.t.spend, 0))} at ${f.x1(leak.reduce((a, s) => a + s.t.rev, 0) / leak.reduce((a, s) => a + s.t.spend, 0))}`, why: "Lowest return per dollar, weighted toward the biggest budgets.", steps: ["Pull search terms and add negatives for non-ordering queries.", "Tighten Meta audiences to a 5-mile radius around the store.", "Cut budget 25% until ROAS clears 60% of target."], watch: "ROAS and attributed orders", stores: leak.map(s => ({ idx: s.store.idx, name: s.store.name, stat: `${f.x1(s.t.roas)} on ${f.moneyK(s.t.spend)}` })) },
      { id: "slow", name: "Win the slow day", headline: `${f.pct(slow.reduce((a, x) => a + x.gap, 0) / slow.length, 0)} below weekly average`, why: "These stores have the widest gap between their slowest day and their average day.", steps: ["Launch a slow-day app offer (two mediums, one price).", "Schedule ads to lift bids on the slow day from 3 PM.", "Message lapsed customers the evening before."], watch: "Slow-day net sales vs the four prior weeks", stores: slow.map(x => ({ idx: x.s.store.idx, name: x.s.store.name, stat: DOW_LABELS[x.slow] })) },
      { id: "own", name: "Own the order", headline: `${f.money(mk.reduce((a, x) => a + (x.s.t.srcSales[3] + x.s.t.srcSales[4]) * MARKETPLACE_COMMISSION, 0))} in commission`, why: "Highest marketplace share. Every order moved to the app keeps about a quarter of its value.", steps: ["Add app-only offer inserts to every marketplace bag.", "Run Meta retargeting to recent marketplace customers by zip.", "Match marketplace menu prices to first-party prices."], watch: "First-party share", stores: mk.map(x => ({ idx: x.s.store.idx, name: x.s.store.name, stat: f.pct(x.sh, 0) })) },
      { id: "ticket", name: "Lift the ticket", headline: `${f.money2(aov.reduce((a, s) => a + s.t.aov, 0) / aov.length)} vs ${f.money2(medAov)} median`, why: "Lowest average order in the chain. Small add-ons move these stores most.", steps: ["Turn on the Game Night Bundle prompt at checkout.", "Train counter staff on one side suggestion per order.", "Test a free dessert threshold at $35."], watch: "Average order and items per order", stores: aov.map(s => ({ idx: s.store.idx, name: s.store.name, stat: f.money2(s.t.aov) })) },
      { id: "late", name: "Late-night window", headline: `${f.pct(late.reduce((a, x) => a + x.sh, 0) / late.length, 0)} of sales after 9 PM`, why: "These stores already sell late. Ads and staffing rarely follow.", steps: ["Extend ad schedules to midnight on Thursday through Saturday.", "Add a late-night slice deal for app orders.", "Check driver coverage after 10 PM."], watch: "Late-night orders", stores: late.map(x => ({ idx: x.s.store.idx, name: x.s.store.name, stat: f.pct(x.sh, 0) })) },
      { id: "recover", name: "Recover the slide", headline: slide.length ? `${slide[0].s.store.name} ${f.delta(slide[0].ch)}` : "No stores declining", why: "Stores with net sales below the prior period, steepest decline first.", steps: ["Check marketplace listings, ratings and prep times first.", "Compare staffing and hours against the prior period.", "Run a win-back message to customers with no order in 30 days."], watch: "Week-over-week net sales", stores: slide.map(x => ({ idx: x.s.store.idx, name: x.s.store.name, stat: f.delta(x.ch) })) },
    ];
  }, [demo, cur, prev, target]);
  const [sel, setSel] = useState("scale");
  const play = plays.find(p => p.id === sel)!;

  const dowTable = useMemo(() => byStore(demo, cur).map(s => {
    const rows = slice(demo, cur, s.store.idx);
    const avg = [1, 2, 3, 4, 5, 6, 0].map(d => { const r = rows.filter(x => dow(x.date) === d); return r.reduce((a, x) => a + x.net, 0) / (r.length || 1); });
    return { s, avg, total: avg.reduce((a, b) => a + b, 0) };
  }), [demo, cur]);
  const dowMax = Math.max(...dowTable.flatMap(r => r.avg));

  return (
    <div className="stack">
      <div className="grid g4">
        {plays.map(p => (
          <button key={p.id} className={`play ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)} aria-pressed={sel === p.id}>
            <div className="row"><h4>{p.name}</h4><span className="spacer" /><Pill>{p.stores.length} stores</Pill></div>
            <div className="big num">{p.headline}</div>
            <p>{p.why}</p>
          </button>
        ))}
      </div>
      <Card title={`Play brief: ${play.name}`} sub={play.why}>
        <div className="grid g2">
          <div className="brief">
            <div><div className="note" style={{ marginBottom: 6 }}>Steps</div><ol>{play.steps.map(s => <li key={s}>{s}</li>)}</ol></div>
            <div><div className="note">Measure</div><b>{play.watch}</b></div>
          </div>
          <div>
            <div className="note" style={{ marginBottom: 6 }}>Stores in this play</div>
            <div className="chips">{play.stores.map(s => <button key={s.idx} className="chip" onClick={() => { setStoreIdx(s.idx); go("insights"); }}>{s.name} <span className="muted">{s.stat}</span></button>)}</div>
          </div>
        </div>
      </Card>
      <Card title="Average net sales by weekday" sub="Each store's daily average, darker is higher. Click a store for its insights." flush>
        <DataTable rows={dowTable} rowKey={r => r.s.store.id} initialSort={{ key: "t", dir: "desc" }} maxHeight={560} onRow={r => { setStoreIdx(r.s.store.idx); go("insights"); }} cols={[
          { key: "s", label: "Store", render: r => <span className="store">{r.s.store.name}</span>, sort: r => r.s.store.name },
          ...[1, 2, 3, 4, 5, 6, 0].map((d, k) => ({ key: `d${d}`, label: DOW_LABELS[d], align: "r" as const, sort: (r: (typeof dowTable)[number]) => r.avg[k], render: (r: (typeof dowTable)[number]) => <span style={{ display: "inline-block", minWidth: 64, padding: "2px 6px", borderRadius: 4, background: `rgba(228,80,42,${0.06 + 0.6 * Math.pow(r.avg[k] / dowMax, 2.2)})` }}>{f.moneyK(r.avg[k])}</span> })),
          { key: "t", label: "Week total", align: "r", render: r => <b>{f.moneyK(r.total)}</b>, sort: r => r.total },
        ]} />
      </Card>
    </div>
  );
}
