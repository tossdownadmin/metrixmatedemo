"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { byStore, pct, slice, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { C } from "@/components/ui/charts";
import { Card, Delta, Kpis, Pill, Seg } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/table";

export function SalesComparison() {
  const { demo, cur, prev, ly, storeIdx, setStoreIdx, go } = useApp();
  const [metric, setMetric] = useState<"net" | "orders">("net");
  const priorLabel = `Previous ${cur.days} days`;

  const rows = useMemo(() => {
    const c = byStore(demo, cur), p = byStore(demo, prev), l = byStore(demo, ly);
    return c.map((s, i) => ({ store: s.store, c: s.t, p: p[i].t, l: l[i].t })).filter(r => storeIdx == null || r.store.idx === storeIdx);
  }, [demo, cur, prev, ly, storeIdx]);
  const T = { c: totals(slice(demo, cur, storeIdx)), p: totals(slice(demo, prev, storeIdx)), l: totals(slice(demo, ly, storeIdx)) };
  const val = (t: typeof T.c) => (metric === "net" ? t.net : t.orders);
  const fm = metric === "net" ? f.money : f.num;
  const up = rows.filter(r => val(r.c) > val(r.p)).length;
  const diverging = [...rows].map(r => ({ name: r.store.name, v: pct(val(r.c), val(r.p)) ?? 0 })).sort((a, b) => b.v - a.v);
  const label = `${fmtDate(cur.start)} to ${fmtDate(cur.end)}`;

  const exportCsv = () => {
    const head = ["Store", "Market", "Current net sales", "Current orders", "Current avg", "Previous net sales", "Previous orders", "Diff $", "Diff %", "Last year net sales", "LY diff %"];
    const lines = rows.map(r => [r.store.name, r.store.market, r.c.net.toFixed(2), r.c.orders, r.c.aov.toFixed(2), r.p.net.toFixed(2), r.p.orders, (r.c.net - r.p.net).toFixed(2), (pct(r.c.net, r.p.net) ?? 0).toFixed(1), r.l.net.toFixed(2), r.l.net ? (pct(r.c.net, r.l.net) ?? 0).toFixed(1) : "new"].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `sales-comparison-${cur.days}d-${cur.end}.csv`; a.click();
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <Seg value={metric} onChange={setMetric} options={[{ id: "net", label: "Net sales" }, { id: "orders", label: "Orders" }]} label="Metric" />
        <span className="note">{label}, compared with the previous {cur.days} days and the same weekdays last year</span>
        <span className="spacer" />
        <button className="btn" onClick={exportCsv}><Download size={14} />Export CSV</button>
      </div>

      <Kpis items={[
        { label: metric === "net" ? "Net sales" : "Orders", value: fm(val(T.c)), note: label },
        { label: priorLabel, value: fm(val(T.p)), delta: pct(val(T.c), val(T.p)) },
        { label: "Same period last year", value: fm(val(T.l)), delta: pct(val(T.c), val(T.l)) },
        { label: "Average order", value: f.money2(T.c.aov), delta: pct(T.c.aov, T.p.aov) },
        { label: "Stores growing", value: `${up} of ${rows.length}`, note: `vs previous ${cur.days} days` },
      ]} />

      <Card title="Change by store" sub={`${metric === "net" ? "Net sales" : "Orders"} vs previous ${cur.days} days, sorted from strongest to weakest`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={diverging} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" hide />
            <YAxis tick={{ fontSize: 11.5, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={44} />
            <ReferenceLine y={0} stroke={C.grey} />
            <Tooltip cursor={{ fill: "rgba(19,34,58,.04)" }} formatter={(v: number) => f.delta(v)} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: 8, fontSize: 12.5 }} />
            <Bar dataKey="v" name="Change" isAnimationActive={false} radius={[2, 2, 2, 2]}>
              {diverging.map(d => <Cell key={d.name} fill={d.v >= 0 ? C.basil : C.berry} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Sales comparison report" sub="Click a store to open it on the dashboard" flush>
        <DataTable rows={rows} rowKey={r => r.store.id} maxHeight={680} initialSort={{ key: "cn", dir: "desc" }} onRow={r => { setStoreIdx(r.store.idx); go("dashboard"); }} cols={[
          { key: "s", label: "Store", render: r => <span><span className="store">{r.store.name}</span> <span className="sub">{r.store.market}</span></span>, sort: r => r.store.name, foot: storeIdx == null ? "All stores" : "Selected store" },
          { key: "cn", label: "Current $", align: "r", render: r => f.money(r.c.net), sort: r => r.c.net, foot: f.money(T.c.net) },
          { key: "co", label: "Current #", align: "r", render: r => f.num(r.c.orders), sort: r => r.c.orders, foot: f.num(T.c.orders) },
          { key: "ca", label: "Avg", align: "r", render: r => f.money2(r.c.aov), sort: r => r.c.aov, foot: f.money2(T.c.aov) },
          { key: "pn", label: "Previous $", align: "r", render: r => f.money(r.p.net), sort: r => r.p.net, foot: f.money(T.p.net) },
          { key: "po", label: "Previous #", align: "r", render: r => f.num(r.p.orders), sort: r => r.p.orders, foot: f.num(T.p.orders) },
          { key: "dd", label: "Diff $", align: "r", render: r => <span className={r.c.net >= r.p.net ? "pos" : "neg"}>{r.c.net >= r.p.net ? "+" : "−"}{f.money(Math.abs(r.c.net - r.p.net))}</span>, sort: r => r.c.net - r.p.net, foot: f.money(T.c.net - T.p.net) },
          { key: "dp", label: "Diff %", align: "r", render: r => <Delta value={pct(r.c.net, r.p.net)} />, sort: r => pct(r.c.net, r.p.net) ?? 0, foot: <Delta value={pct(T.c.net, T.p.net)} /> },
          { key: "ln", label: "Last year $", align: "r", render: r => (r.l.net ? f.money(r.l.net) : <span className="sub">Not open</span>), sort: r => r.l.net, foot: f.money(T.l.net) },
          { key: "lp", label: "LY diff %", align: "r", render: r => (r.l.net ? <Delta value={pct(r.c.net, r.l.net)} /> : <Pill tone="info">New store</Pill>), sort: r => pct(r.c.net, r.l.net) ?? -999, foot: <Delta value={pct(T.c.net, T.l.net)} /> },
        ]} />
      </Card>
    </div>
  );
}
