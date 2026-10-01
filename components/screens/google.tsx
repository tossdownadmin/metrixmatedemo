"use client";

import { useState } from "react";
import { f } from "@/lib/format";
import { useApp } from "@/components/context";
import { C, Donut, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Kpis, Legend, Pill, RoasPill, Seg } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";
import { DataTable } from "@/components/ui/table";
import { ratio, usePlatform } from "./paid-common";

const TERMS = [
  { q: "pizza near me", s: 0.24, cr: 0.11 }, { q: "pizza delivery {city}", s: 0.13, cr: 0.14 }, { q: "northstar slice", s: 0.11, cr: 0.24 },
  { q: "northstar pizza menu", s: 0.07, cr: 0.19 }, { q: "best pizza {city}", s: 0.07, cr: 0.08 }, { q: "pizza deals tonight", s: 0.06, cr: 0.1 },
  { q: "late night pizza", s: 0.05, cr: 0.09 }, { q: "wings near me", s: 0.05, cr: 0.06 }, { q: "large pizza coupon", s: 0.04, cr: 0.07 },
  { q: "gluten free pizza near me", s: 0.03, cr: 0.05 }, { q: "pizza open now", s: 0.03, cr: 0.12 }, { q: "pizza place for parties", s: 0.02, cr: 0.03 },
];

export function GoogleAds() {
  const { target, setStoreIdx, storeIdx, store } = useApp();
  const { camps, t, p, series, roas, prevRoas, d } = usePlatform("google");
  const [scope, setScope] = useState<"store" | "all">("all");
  const list = camps.filter(c => scope === "all" || c.inRoas);
  const types = ["Search", "Performance Max", "Brand search", "Display"].map(ty => { const c = camps.filter(x => x.type === ty); return { ty, spend: c.reduce((a, x) => a + x.spend, 0), conv: c.reduce((a, x) => a + x.conversions, 0) }; }).filter(x => x.spend > 0);
  const tc = [C.sky, "#7aa5f0", C.ink, C.grey];
  const city = store?.city ?? "columbus";
  return (
    <div className="stack">
      <ScopeBanner note="Brand and legacy campaigns are hidden while a store is selected" />
      <Kpis items={[
        { label: "Spend", value: f.money(t.spend), delta: d(t.spend, p.spend), invert: true },
        { label: "Impressions", value: f.compact(t.imp), delta: d(t.imp, p.imp) },
        { label: "Clicks", value: f.num(t.clicks), delta: d(t.clicks, p.clicks) },
        { label: "CTR", value: f.pct(ratio(t.clicks, t.imp), 2) },
        { label: "Avg CPC", value: f.money2(ratio(t.spend, t.clicks)), delta: d(ratio(t.spend, t.clicks), ratio(p.spend, p.clicks)), invert: true },
        { label: "Conversions", value: f.num(t.conv), delta: d(t.conv, p.conv), note: `${f.pct(ratio(t.conv, t.clicks))} conv. rate` },
        { label: "Store ROAS", value: f.x(roas), delta: d(roas, prevRoas), info: "Attributed POS revenue ÷ spend on store campaigns. Brand search and legacy regional campaigns are excluded." },
      ]} />
      <div className="grid g-2-1">
        <Card title="Spend and attributed revenue" sub="Daily, Google campaigns" actions={<Legend items={[{ label: "Attributed revenue", color: C.sky }, { label: "Spend", color: C.ink }]} />}>
          <TrendChart data={series} height={260} series={[{ key: "spend", label: "Spend", color: C.ink, type: "bar" }, { key: "revenue", label: "Attributed revenue", color: C.sky, type: "area" }]} />
        </Card>
        <Card title="Spend by campaign type">
          <Donut height={180} data={types.map((x, i) => ({ name: x.ty, value: x.spend, color: tc[i] }))} center={{ value: f.moneyK(t.spend), label: "total spend" }} />
          <div style={{ marginTop: 12 }}><Legend items={types.map((x, i) => ({ label: `${x.ty} ${f.pct(x.spend / (t.spend || 1), 0)}`, color: tc[i] }))} /></div>
        </Card>
      </div>
      <div className="grid g-1-2">
        <Card title="Device" sub="Share of clicks">
          <BarList items={[{ label: "Mobile", value: 0.74, display: "74%", color: C.sky }, { label: "Desktop", value: 0.22, display: "22%", color: C.ink }, { label: "Tablet", value: 0.04, display: "4%", color: C.grey }]} />
          <p className="note" style={{ marginTop: 12 }}>Mobile converts at about 1.3× desktop for ordering.</p>
        </Card>
        <Card title="Top search terms" sub="Search campaigns" flush>
          <DataTable rows={TERMS} rowKey={r => r.q} cols={[
            { key: "q", label: "Search term", render: r => r.q.replace("{city}", city.toLowerCase()) },
            { key: "c", label: "Clicks", align: "r", render: r => f.num(t.clicks * 0.6 * r.s) },
            { key: "cv", label: "Conversions", align: "r", render: r => f.num(t.clicks * 0.6 * r.s * r.cr) },
            { key: "cr", label: "Conv. rate", align: "r", render: r => f.pct(r.cr) },
            { key: "cpa", label: "Cost / conv.", align: "r", render: r => f.money2(ratio(t.spend, t.clicks) / r.cr) },
          ]} />
        </Card>
      </div>
      <Card title="Campaigns" sub="Store campaigns count toward store ROAS. Brand and legacy regional campaigns do not." flush actions={storeIdx == null ? <Seg value={scope} onChange={setScope} options={[{ id: "all", label: "All campaigns" }, { id: "store", label: "Store campaigns" }]} /> : undefined}>
        <DataTable rows={list} rowKey={r => r.id} initialSort={{ key: "spend", dir: "desc" }} maxHeight={560} onRow={r => r.storeIdx != null && setStoreIdx(r.storeIdx)} cols={[
          { key: "n", label: "Campaign", render: r => <span className="store">{r.name}</span>, sort: r => r.name },
          { key: "t", label: "Type", render: r => r.type, sort: r => r.type },
          { key: "st", label: "Status", render: r => <Pill tone={r.status === "Active" ? "good" : "neutral"}>{r.status}</Pill>, sort: r => r.status },
          { key: "spend", label: "Spend", align: "r", render: r => f.money(r.spend), sort: r => r.spend },
          { key: "clicks", label: "Clicks", align: "r", render: r => f.num(r.clicks), sort: r => r.clicks },
          { key: "cpc", label: "CPC", align: "r", render: r => f.money2(ratio(r.spend, r.clicks)), sort: r => ratio(r.spend, r.clicks) },
          { key: "conv", label: "Conv.", align: "r", render: r => f.num(r.conversions), sort: r => r.conversions },
          { key: "roas", label: "ROAS", align: "r", render: r => (r.inRoas ? <RoasPill roas={ratio(r.revenue, r.spend)} target={target} /> : <Pill>Not in store ROAS</Pill>), sort: r => (r.inRoas ? ratio(r.revenue, r.spend) : -1) },
        ]} />
      </Card>
    </div>
  );
}
