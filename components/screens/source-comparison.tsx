"use client";

import { useMemo, useState } from "react";
import { FIRST_PARTY, MARKETPLACE_COMMISSION, SOURCES, type Source } from "@/lib/data";
import { f } from "@/lib/format";
import { byStore, daily, pct, slice, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { HBarChart, SOURCE_COLORS, TrendChart } from "@/components/ui/charts";
import { Card, Kpis, Legend, Seg } from "@/components/ui/primitives";
import { DataTable, type Col } from "@/components/ui/table";

export function SourceComparison() {
  const { demo, cur, prev, setStoreIdx, go } = useApp();
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [on, setOn] = useState<Source[]>([...SOURCES]);
  const idx = SOURCES.map((s, j) => ({ s, j })).filter(x => on.includes(x.s));
  const stores = useMemo(() => byStore(demo, cur), [demo, cur]);
  const T = totals(slice(demo, cur)), P = totals(slice(demo, prev));
  const v = (t: typeof T, j: number) => (metric === "sales" ? t.srcSales[j] : t.srcOrders[j]);
  const fm = metric === "sales" ? f.money : f.num;
  const sel = (t: typeof T) => idx.reduce((a, x) => a + v(t, x.j), 0);
  const fp = (t: typeof T) => FIRST_PARTY.reduce((a, s) => a + t.srcSales[SOURCES.indexOf(s)], 0) / (t.net || 1);
  const commission = (T.srcSales[3] + T.srcSales[4]) * MARKETPLACE_COMMISSION;

  const weekly = useMemo(() => {
    const pts = daily(demo, cur, null);
    const step = pts.length > 30 ? 7 : 1;
    const out: Record<string, number | string>[] = [];
    for (let i = pts.length; i > 0; i -= step) {
      const chunk = pts.slice(Math.max(0, i - step), i);
      const row: Record<string, number | string> = { date: chunk[0].date };
      SOURCES.forEach((s, j) => (row[s] = chunk.reduce((a, p) => a + (metric === "sales" ? p.srcSales[j] : p.srcOrders[j]), 0)));
      out.unshift(row);
    }
    return out;
  }, [demo, cur, metric]);

  const byMarket = useMemo(() => {
    const m = new Map<string, number[]>();
    stores.forEach(s => { const arr = m.get(s.store.market) ?? [0, 0, 0, 0, 0]; SOURCES.forEach((_, j) => (arr[j] += v(s.t, j))); m.set(s.store.market, arr); });
    return [...m.entries()].map(([name, arr]) => { const row: Record<string, number | string> = { name }; SOURCES.forEach((s, j) => (row[s] = on.includes(s) ? arr[j] : 0)); return row; });
  }, [stores, metric, on]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols: Col<(typeof stores)[number]>[] = [
    { key: "s", label: "Store", render: r => <span><span className="store">{r.store.name}</span> <span className="sub">{r.store.market}</span></span>, sort: r => r.store.name, foot: "All stores" },
    ...idx.map(({ s, j }) => ({ key: s, label: <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: SOURCE_COLORS[j] }} />{s}</span>, align: "r" as const, render: (r: (typeof stores)[number]) => <span>{fm(v(r.t, j))} <span className="sub">{f.pct(v(r.t, j) / (sel(r.t) || 1), 0)}</span></span>, sort: (r: (typeof stores)[number]) => v(r.t, j), foot: fm(v(T, j)) })),
    { key: "all", label: on.length === SOURCES.length ? "All sources" : "Selected sources", align: "r", render: r => <b>{fm(sel(r.t))}</b>, sort: r => sel(r.t), foot: fm(sel(T)) },
    { key: "fp", label: "First-party share", align: "r", render: r => f.pct(fp(r.t), 0), sort: r => fp(r.t), foot: f.pct(fp(T), 0) },
  ];

  return (
    <div className="stack">
      <div className="toolbar">
        <Seg value={metric} onChange={setMetric} options={[{ id: "sales", label: "Net sales" }, { id: "orders", label: "Order count" }]} label="Metric" />
        <div className="row wrap" style={{ gap: 6 }}>
          {SOURCES.map((s, j) => (
            <label key={s} className={`check ${on.includes(s) ? "" : "off"}`}>
              <input type="checkbox" checked={on.includes(s)} onChange={() => setOn(o => (o.includes(s) ? (o.length > 1 ? o.filter(x => x !== s) : o) : SOURCES.filter(x => o.includes(x) || x === s)))} />
              <span className="sw" style={{ background: SOURCE_COLORS[j] }} />{s}
            </label>
          ))}
        </div>
      </div>

      <Kpis items={[
        { label: "First-party share", value: f.pct(fp(T)), delta: pct(fp(T), fp(P)), note: "In store, web and app" },
        { label: "Mobile app sales", value: f.money(T.srcSales[2]), delta: pct(T.srcSales[2], P.srcSales[2]) },
        { label: "Web sales", value: f.money(T.srcSales[1]), delta: pct(T.srcSales[1], P.srcSales[1]) },
        { label: "Marketplace sales", value: f.money(T.srcSales[3] + T.srcSales[4]), delta: pct(T.srcSales[3] + T.srcSales[4], P.srcSales[3] + P.srcSales[4]), invert: true },
        { label: "Est. marketplace commission", value: f.money(commission), note: `at ${MARKETPLACE_COMMISSION * 100}% blended`, info: "Estimated fees paid to delivery marketplaces on their orders. Moving these guests to web or app ordering keeps that margin." },
      ]} />

      <div className="grid g2">
        <Card title="Source mix over time" sub={`${cur.days > 30 ? "Weekly" : "Daily"} ${metric === "sales" ? "net sales" : "orders"} by source`} actions={<Legend items={SOURCES.filter(s => on.includes(s)).map(s => ({ label: s, color: SOURCE_COLORS[SOURCES.indexOf(s)] }))} />}>
          <TrendChart data={weekly} height={260} left={metric === "sales" ? f.moneyK : f.compact} series={idx.map(({ s, j }) => ({ key: s, label: s, color: SOURCE_COLORS[j], type: "bar", stack: "a" }))} />
        </Card>
        <Card title="Source mix by market" sub="Selected sources only">
          <HBarChart data={byMarket} height={260} fmt={metric === "sales" ? f.moneyK : f.compact} keys={idx.map(({ s, j }) => ({ key: s, label: s, color: SOURCE_COLORS[j] }))} />
        </Card>
      </div>

      <Card title="Order source comparison by location" sub="All Sources recalculates from the sources you select. Click a store to open it." flush>
        <DataTable rows={stores} cols={cols} rowKey={r => r.store.id} initialSort={{ key: "all", dir: "desc" }} maxHeight={640} onRow={r => { setStoreIdx(r.store.idx); go("pos"); }} />
      </Card>
    </div>
  );
}
