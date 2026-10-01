"use client";

import { useMemo, useState } from "react";
import { FIRST_PARTY, MARKETPLACE_COMMISSION, PRODUCTS, SOURCES, THIRD_PARTY } from "@/lib/data";
import { DOW_LABELS, fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { byStore, cohorts, daily, dayparts, hourHeat, hourLabel, HOURS, pct, productStats, slice, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, Donut, Heatmap, ScatterPlot, SOURCE_COLORS, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Delta, Kpis, Legend, Pill, Tabs } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";
import { DataTable } from "@/components/ui/table";

type Tab = "overview" | "menu" | "customers" | "stores" | "channels";

export function PosAnalysis() {
  const [tab, setTab] = useState<Tab>("overview");
  const opts: { id: Tab; label: string }[] = [
    { id: "overview", label: "Dashboard" }, { id: "menu", label: "Menu" }, { id: "customers", label: "Customers" },
    { id: "stores", label: "Store comparison" },
    { id: "channels", label: "First-party vs third-party" },
  ];
  return (
    <div className="stack">
      <ScopeBanner />
      <Tabs value={tab} onChange={setTab} options={opts} />
      {tab === "overview" && <Overview />}
      {tab === "menu" && <Menu />}
      {tab === "customers" && <Customers />}
      {tab === "stores" && <Stores />}
      {tab === "channels" && <Channels />}
    </div>
  );
}

function bucket<T extends { date: string }>(pts: T[], fold: (chunk: T[]) => Record<string, number>) {
  const step = pts.length > 30 ? 7 : 1;
  const out: Record<string, number | string>[] = [];
  for (let i = pts.length; i > 0; i -= step) { const c = pts.slice(Math.max(0, i - step), i); out.unshift({ date: c[0].date, ...fold(c) }); }
  return out;
}

function Overview() {
  const { demo, cur, prev, storeIdx } = useApp();
  const rows = useMemo(() => slice(demo, cur, storeIdx), [demo, cur, storeIdx]);
  const prevRows = useMemo(() => slice(demo, prev, storeIdx), [demo, prev, storeIdx]);
  const t = totals(rows), p = totals(prevRows);
  const series = useMemo(() => daily(demo, cur, storeIdx).map(s => ({ date: s.date, net: s.net, orders: s.orders })), [demo, cur, storeIdx]);
  const dp = useMemo(() => dayparts(demo, rows), [demo, rows]);
  const heat = useMemo(() => hourHeat(demo, rows), [demo, rows]);
  const products = useMemo(() => productStats(demo, rows, prevRows).sort((a, b) => b.sales - a.sales), [demo, rows, prevRows]);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const busiest = order.map(d => ({ d, v: heat[d].reduce((a, b) => a + b, 0) })).sort((a, b) => b.v - a.v)[0];
  return (
    <>
      <Kpis items={[
        { label: "Gross sales", value: f.money(t.gross), delta: pct(t.gross, p.gross) },
        { label: "Discounts", value: f.money(t.discounts), delta: pct(t.discounts, p.discounts), invert: true, note: f.pct(t.discounts / (t.gross || 1)) + " of gross" },
        { label: "Net sales", value: f.money(t.net), delta: pct(t.net, p.net) },
        { label: "Orders", value: f.num(t.orders), delta: pct(t.orders, p.orders) },
        { label: "Average order", value: f.money2(t.aov), delta: pct(t.aov, p.aov) },
        { label: "Orders per day", value: f.num(t.orders / cur.days), note: storeIdx == null ? `${f.num(t.orders / cur.days / demo.stores.length)} per store` : undefined },
      ]} />
      <div className="grid g-2-1">
        <Card title="Net sales and orders" sub="Daily, completed business days" actions={<Legend items={[{ label: "Net sales", color: C.ember }, { label: "Orders", color: C.ink, kind: "line" }]} />}>
          <TrendChart data={series} height={270} right={f.compact} series={[{ key: "net", label: "Net sales", color: C.ember, type: "area" }, { key: "orders", label: "Orders", color: C.ink, axis: "right" }]} />
        </Card>
        <Card title="Sales by daypart" sub="Share of net sales">
          <BarList items={dp.map(d => ({ label: d.name, value: d.sales, display: `${f.money(d.sales)}`, sub: f.pct(d.sales / (t.net || 1), 0), color: d.name === "Dinner" ? C.ember : C.ink }))} />
          <p className="note" style={{ marginTop: 14 }}>Dinner (5 to 9 PM) carries the business. Late night runs {f.pct(dp[3].sales / (t.net || 1), 0)} of sales{storeIdx == null ? ", led by urban stores" : ""}.</p>
        </Card>
      </div>
      <div className="grid g2">
        <Card title="Orders by hour and weekday" sub={`Busiest day: ${DOW_LABELS[busiest.d]}. Darker cells mean more orders.`}>
          <Heatmap rows={order.map(d => DOW_LABELS[d])} cols={HOURS.map(hourLabel)} values={order.map(d => heat[d])} />
        </Card>
        <Card title="Top sellers" sub="By item sales in the period" flush>
          <DataTable rows={products.slice(0, 8)} rowKey={r => r.id} cols={[
            { key: "n", label: "Item", render: r => <span className="store">{r.name}</span> },
            { key: "u", label: "Units", align: "r", render: r => f.num(r.units) },
            { key: "s", label: "Sales", align: "r", render: r => f.moneyK(r.sales) },
            { key: "d", label: "vs prior", align: "r", render: r => <Delta value={pct(r.units, r.prevUnits)} /> },
          ]} />
        </Card>
      </div>
    </>
  );
}

function Menu() {
  const { demo, cur, prev, storeIdx } = useApp();
  const rows = useMemo(() => slice(demo, cur, storeIdx), [demo, cur, storeIdx]);
  const prevRows = useMemo(() => slice(demo, prev, storeIdx), [demo, prev, storeIdx]);
  const stats = useMemo(() => productStats(demo, rows, prevRows), [demo, rows, prevRows]);
  const avgUnits = stats.reduce((a, s) => a + s.units, 0) / stats.length;
  const avgMargin = stats.reduce((a, s) => a + s.margin, 0) / stats.length;
  const quad = (s: (typeof stats)[number]) => (s.units >= avgUnits ? (s.margin >= avgMargin ? "Star" : "Plowhorse") : s.margin >= avgMargin ? "Puzzle" : "Dog");
  const tone = { Star: "good", Plowhorse: "info", Puzzle: "watch", Dog: "bad" } as const;
  const qColor = { Star: C.basil, Plowhorse: C.sky, Puzzle: C.saffron, Dog: C.berry };
  const hh = stats.find(s => s.id === "p07")!;
  return (
    <>
      <div className="grid g-2-1">
        <Card title="Menu engineering" sub="Popularity against margin. Lines mark the menu average." info="Stars: popular and profitable, protect them. Plowhorses: popular, lower margin, reprice or re-cost. Puzzles: profitable but under-ordered, promote them. Dogs: candidates to cut.">
          <ScatterPlot height={320} data={stats.map(s => ({ id: s.id, name: s.name, x: s.units, y: s.margin * 100, z: s.sales, color: qColor[quad(s)] }))} xLabel="Units sold" yLabel="Margin" xFmt={f.compact} yFmt={v => `${v.toFixed(0)}%`} refX={avgUnits} refY={avgMargin * 100} />
          <Legend items={(["Star", "Plowhorse", "Puzzle", "Dog"] as const).map(q => ({ label: q, color: qColor[q] }))} />
        </Card>
        <Card title="New item launch" sub={`${hh.name}, launched ${fmtDate(demo.dates[demo.days - (PRODUCTS[6].launch ?? 0)])}`}>
          <div className="stack" style={{ gap: 12 }}>
            <div><div className="note">Units in period</div><div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600 }} className="num">{f.num(hh.units)}</div></div>
            <dl className="kv"><dt>Item sales</dt><dd className="num">{f.money(hh.sales)}</dd><dt>Share of item sales</dt><dd>{f.pct(hh.share)}</dd><dt>Menu position</dt><dd><Pill tone={tone[quad(hh)]}>{quad(hh)}</Pill></dd></dl>
            <p className="note">Ember Pepperoni gave up about a third of its share since launch. Most Hot Honey orders are swaps, not added items, so watch total pizza units alongside it.</p>
          </div>
        </Card>
      </div>
      <Card title="Item performance" sub="Item sales are allocated from gross sales by menu price" flush>
        <DataTable rows={stats} rowKey={r => r.id} initialSort={{ key: "s", dir: "desc" }} cols={[
          { key: "n", label: "Item", render: r => <span className="store">{r.name}</span>, sort: r => r.name },
          { key: "c", label: "Category", render: r => r.category, sort: r => r.category },
          { key: "p", label: "Menu price", align: "r", render: r => f.money2(r.price), sort: r => r.price },
          { key: "u", label: "Units", align: "r", render: r => f.num(r.units), sort: r => r.units },
          { key: "du", label: "Units vs prior", align: "r", render: r => <Delta value={pct(r.units, r.prevUnits)} />, sort: r => pct(r.units, r.prevUnits) ?? 999 },
          { key: "s", label: "Item sales", align: "r", render: r => f.money(r.sales), sort: r => r.sales },
          { key: "sh", label: "Share", align: "r", render: r => f.pct(r.share), sort: r => r.share },
          { key: "m", label: "Est. margin", align: "r", render: r => f.pct(r.margin, 0), sort: r => r.margin },
          { key: "q", label: "Quadrant", render: r => <Pill tone={tone[quad(r)]}>{quad(r)}</Pill>, sort: r => quad(r) },
        ]} />
      </Card>
    </>
  );
}

function Customers() {
  const { demo, cur, prev, storeIdx } = useApp();
  const t = totals(slice(demo, cur, storeIdx)), p = totals(slice(demo, prev, storeIdx));
  const series = useMemo(() => bucket(daily(demo, cur, storeIdx), c => ({ newC: c.reduce((a, x) => a + x.newC, 0), retC: c.reduce((a, x) => a + x.retC, 0) })), [demo, cur, storeIdx]);
  const coh = useMemo(() => cohorts(demo, storeIdx), [demo, storeIdx]);
  const identified = t.newC + t.retC;
  const freq = [{ label: "1 order", v: 0.52 }, { label: "2 to 3 orders", v: 0.28 }, { label: "4 to 6 orders", v: 0.13 }, { label: "7 or more", v: 0.07 }];
  return (
    <>
      <Kpis items={[
        { label: "Identified customers", value: f.num(identified), delta: pct(identified, p.newC + p.retC), note: f.pct(identified / (t.orders || 1), 0) + " of orders" },
        { label: "New customers", value: f.num(t.newC), delta: pct(t.newC, p.newC) },
        { label: "Returning customers", value: f.num(t.retC), delta: pct(t.retC, p.retC) },
        { label: "Returning share", value: f.pct(t.retC / (identified || 1)), delta: pct(t.retC / (identified || 1), p.retC / ((p.newC + p.retC) || 1)) },
      ]} />
      <div className="grid g-2-1">
        <Card title="New and returning customers" sub={cur.days > 30 ? "Weekly" : "Daily"} actions={<Legend items={[{ label: "Returning", color: C.ink }, { label: "New", color: C.basil }]} />}>
          <TrendChart data={series} height={260} left={f.compact} series={[{ key: "retC", label: "Returning", color: C.ink, type: "bar", stack: "c" }, { key: "newC", label: "New", color: C.basil, type: "bar", stack: "c" }]} />
        </Card>
        <Card title="Order frequency" sub="Customers by orders placed in the last 90 days" info="Modeled from identified POS customers (phone, email or loyalty ID).">
          <BarList items={freq.map(x => ({ label: x.label, value: x.v, display: f.pct(x.v, 0), color: C.violet }))} />
        </Card>
      </div>
      <Card title="Monthly cohort retention" sub="Share of each month's new customers who ordered again in later months" flush>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Cohort</th><th className="r">New customers</th>{[1, 2, 3, 4, 5, 6].map(m => <th key={m} className="r">Month {m}</th>)}</tr></thead>
            <tbody>
              {coh.map(c => (
                <tr key={c.month}>
                  <td className="store">{fmtDate(`${c.month}-15`, { month: "long", year: "numeric" })}</td>
                  <td className="r num">{f.num(c.size)}</td>
                  {c.retention.map((r, k) => <td key={k} className="r num" style={r == null ? undefined : { background: `rgba(23,147,106,${0.08 + r * 1.6})`, color: r > 0.3 ? "#fff" : undefined }}>{r == null ? "" : f.pct(r, 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Stores() {
  const { demo, cur, prev, setStoreIdx } = useApp();
  const rows = useMemo(() => { const p = byStore(demo, prev); return byStore(demo, cur).map((s, i) => ({ ...s, p: p[i].t })); }, [demo, cur, prev]);
  const avgAov = rows.reduce((a, r) => a + r.t.aov, 0) / rows.length;
  const avgOrd = rows.reduce((a, r) => a + r.t.orders, 0) / rows.length;
  return (
    <>
      <Card title="Volume against ticket size" sub="Each dot is a store, sized by net sales. Click one to open it.">
        <ScatterPlot height={320} data={rows.map(r => ({ id: String(r.store.idx), name: r.store.name, x: r.t.orders / cur.days, y: r.t.aov, z: r.t.net, color: r.store.urban ? C.ember : C.ink }))} xLabel="Orders per day" yLabel="Average order" xFmt={v => v.toFixed(0)} yFmt={v => `$${v.toFixed(0)}`} refX={avgOrd / cur.days} refY={avgAov} onClick={id => setStoreIdx(Number(id))} />
        <Legend items={[{ label: "Urban store", color: C.ember }, { label: "Suburban store", color: C.ink }]} />
      </Card>
      <Card title="Store comparison" flush>
        <DataTable rows={rows} rowKey={r => r.store.id} initialSort={{ key: "n", dir: "desc" }} maxHeight={620} onRow={r => setStoreIdx(r.store.idx)} cols={[
          { key: "s", label: "Store", render: r => <span><span className="store">{r.store.name}</span> <span className="sub">{r.store.market}</span></span>, sort: r => r.store.name },
          { key: "n", label: "Net sales", align: "r", render: r => f.money(r.t.net), sort: r => r.t.net },
          { key: "dn", label: "vs prior", align: "r", render: r => <Delta value={pct(r.t.net, r.p.net)} />, sort: r => pct(r.t.net, r.p.net) ?? 0 },
          { key: "o", label: "Orders", align: "r", render: r => f.num(r.t.orders), sort: r => r.t.orders },
          { key: "a", label: "Avg order", align: "r", render: r => f.money2(r.t.aov), sort: r => r.t.aov },
          { key: "d", label: "Discount rate", align: "r", render: r => f.pct(r.t.discounts / (r.t.gross || 1)), sort: r => r.t.discounts / (r.t.gross || 1) },
          { key: "fp", label: "First-party share", align: "r", render: r => f.pct((r.t.srcSales[0] + r.t.srcSales[1] + r.t.srcSales[2]) / (r.t.net || 1), 0), sort: r => (r.t.srcSales[0] + r.t.srcSales[1] + r.t.srcSales[2]) / (r.t.net || 1) },
          { key: "nc", label: "New customers", align: "r", render: r => f.num(r.t.newC), sort: r => r.t.newC },
        ]} />
      </Card>
    </>
  );
}

function Channels() {
  const { demo, cur, prev, storeIdx, setStoreIdx } = useApp();
  const t = totals(slice(demo, cur, storeIdx)), p = totals(slice(demo, prev, storeIdx));
  const fpS = (x: typeof t) => FIRST_PARTY.reduce((a, s) => a + x.srcSales[SOURCES.indexOf(s)], 0);
  const tpS = (x: typeof t) => THIRD_PARTY.reduce((a, s) => a + x.srcSales[SOURCES.indexOf(s)], 0);
  const series = useMemo(() => bucket(daily(demo, cur, storeIdx), c => ({ fp: c.reduce((a, x) => a + x.srcSales[0] + x.srcSales[1] + x.srcSales[2], 0), tp: c.reduce((a, x) => a + x.srcSales[3] + x.srcSales[4], 0) })), [demo, cur, storeIdx]);
  const stores = useMemo(() => byStore(demo, cur).map(s => ({ ...s, tpShare: tpS(s.t) / (s.t.net || 1) })).sort((a, b) => b.tpShare - a.tpShare), [demo, cur]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Kpis items={[
        { label: "First-party sales", value: f.money(fpS(t)), delta: pct(fpS(t), fpS(p)) },
        { label: "Marketplace sales", value: f.money(tpS(t)), delta: pct(tpS(t), tpS(p)), invert: true },
        { label: "First-party share", value: f.pct(fpS(t) / (t.net || 1)), delta: pct(fpS(t) / (t.net || 1), fpS(p) / (p.net || 1)) },
        { label: "Est. marketplace commission", value: f.money(tpS(t) * MARKETPLACE_COMMISSION), note: `${MARKETPLACE_COMMISSION * 100}% blended rate` },
        { label: "Avg order, app vs marketplace", value: `${f.money2(t.srcSales[2] / (t.srcOrders[2] || 1))} / ${f.money2((t.srcSales[3] + t.srcSales[4]) / ((t.srcOrders[3] + t.srcOrders[4]) || 1))}` },
      ]} />
      <div className="grid g-2-1">
        <Card title="First-party vs marketplace sales" sub={cur.days > 30 ? "Weekly net sales" : "Daily net sales"} actions={<Legend items={[{ label: "First-party", color: C.ink }, { label: "Marketplace", color: C.ember }]} />}>
          <TrendChart data={series} height={260} series={[{ key: "fp", label: "First-party", color: C.ink, type: "bar", stack: "x" }, { key: "tp", label: "Marketplace", color: C.ember, type: "bar", stack: "x" }]} />
        </Card>
        <Card title="Channel split" sub="Net sales by source">
          <Donut height={190} data={SOURCES.map((s, j) => ({ name: s, value: t.srcSales[j], color: SOURCE_COLORS[j] }))} center={{ value: f.pct(fpS(t) / (t.net || 1), 0), label: "first-party" }} />
          <div style={{ marginTop: 10 }}><Legend items={SOURCES.map((s, j) => ({ label: s, color: SOURCE_COLORS[j] }))} /></div>
        </Card>
      </div>
      {storeIdx == null && (
        <Card title="Stores most dependent on marketplaces" sub="Highest marketplace share first. These are the best candidates for app ordering promotions." flush>
          <DataTable rows={stores.slice(0, 12)} rowKey={r => r.store.id} onRow={r => setStoreIdx(r.store.idx)} cols={[
            { key: "s", label: "Store", render: r => <span className="store">{r.store.name}</span> },
            { key: "sh", label: "Marketplace share", align: "r", render: r => f.pct(r.tpShare, 0) },
            { key: "tp", label: "Marketplace sales", align: "r", render: r => f.money(tpS(r.t)) },
            { key: "c", label: "Est. commission", align: "r", render: r => f.money(tpS(r.t) * MARKETPLACE_COMMISSION) },
            { key: "app", label: "App sales", align: "r", render: r => f.money(r.t.srcSales[2]) },
          ]} />
        </Card>
      )}
    </>
  );
}
