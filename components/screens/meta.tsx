"use client";

import { useState } from "react";
import { f } from "@/lib/format";
import { useApp } from "@/components/context";
import { C, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Kpis, Legend, Pill, RoasPill, Seg } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";
import { DataTable } from "@/components/ui/table";
import { ratio, usePlatform } from "./paid-common";

const PLACEMENTS = [{ n: "Facebook Feed", s: 0.31, r: 1.05 }, { n: "Instagram Reels", s: 0.27, r: 1.12 }, { n: "Instagram Feed", s: 0.17, r: 1.0 }, { n: "Stories", s: 0.15, r: 0.86 }, { n: "Audience Network", s: 0.1, r: 0.52 }];
const AGES = [{ n: "18 to 24", s: 0.14, r: 0.7 }, { n: "25 to 34", s: 0.31, r: 1.12 }, { n: "35 to 44", s: 0.27, r: 1.18 }, { n: "45 to 54", s: 0.17, r: 0.96 }, { n: "55 and over", s: 0.11, r: 0.71 }];
const ADS = [
  { n: "Friday pie stack", fmt: "Reels, 9 sec", s: 0.24, ctr: 1.9, r: 1.24, bg: "linear-gradient(160deg,#e4502a,#7a1f0b)" },
  { n: "Order in 3 taps", fmt: "Feed, carousel", s: 0.2, ctr: 1.6, r: 1.15, bg: "linear-gradient(160deg,#2f6fe4,#13223a)" },
  { n: "Hot Honey pour", fmt: "Reels, 7 sec", s: 0.18, ctr: 2.1, r: 1.08, bg: "linear-gradient(160deg,#c98410,#5c3b04)" },
  { n: "Game night bundle", fmt: "Feed, static", s: 0.16, ctr: 1.3, r: 0.94, bg: "linear-gradient(160deg,#17936a,#0b3d2c)" },
  { n: "Family table", fmt: "Stories, 6 sec", s: 0.12, ctr: 1.1, r: 0.78, bg: "linear-gradient(160deg,#6e56cf,#2b2161)" },
  { n: "Lunch slice deal", fmt: "Feed, static", s: 0.1, ctr: 0.9, r: 0.61, bg: "linear-gradient(160deg,#6b778a,#1e293b)" },
];

export function MetaAds() {
  const { target, setStoreIdx, storeIdx } = useApp();
  const { camps, t, p, series, roas, prevRoas, d } = usePlatform("meta");
  const [scope, setScope] = useState<"store" | "all">("all");
  const list = camps.filter(c => scope === "all" || c.inRoas);
  return (
    <div className="stack">
      <ScopeBanner note="Fleet awareness campaigns are hidden while a store is selected" />
      <Kpis items={[
        { label: "Spend", value: f.money(t.spend), delta: d(t.spend, p.spend), invert: true },
        { label: "Impressions", value: f.compact(t.imp), delta: d(t.imp, p.imp) },
        { label: "Reach", value: f.compact(t.imp * 0.41), note: `${(1 / 0.41).toFixed(1)} avg frequency` },
        { label: "CTR", value: f.pct(ratio(t.clicks, t.imp), 2), delta: d(ratio(t.clicks, t.imp), ratio(p.clicks, p.imp)) },
        { label: "Cost per click", value: f.money2(ratio(t.spend, t.clicks)), delta: d(ratio(t.spend, t.clicks), ratio(p.spend, p.clicks)), invert: true },
        { label: "Purchases", value: f.num(t.conv), delta: d(t.conv, p.conv) },
        { label: "Store ROAS", value: f.x(roas), delta: d(roas, prevRoas), info: "Attributed POS revenue ÷ spend on store campaigns. Awareness and legacy campaigns are excluded." },
      ]} />
      <div className="grid g-2-1">
        <Card title="Spend and attributed revenue" sub="Daily, Meta campaigns" actions={<Legend items={[{ label: "Attributed revenue", color: C.violet }, { label: "Spend", color: C.ink }]} />}>
          <TrendChart data={series} height={260} series={[{ key: "spend", label: "Spend", color: C.ink, type: "bar" }, { key: "revenue", label: "Attributed revenue", color: C.violet, type: "area" }]} />
        </Card>
        <Card title="Placement" sub="Share of spend, with ROAS relative to average">
          <BarList items={PLACEMENTS.map(x => ({ label: x.n, value: x.s, display: `${f.pct(x.s, 0)} · ${f.x1(roas * x.r)}`, color: x.r >= 1 ? C.violet : C.grey }))} />
        </Card>
      </div>
      <div className="grid g-1-2">
        <Card title="Age" sub="Share of spend and ROAS">
          <BarList items={AGES.map(x => ({ label: x.n, value: x.s, display: `${f.pct(x.s, 0)} · ${f.x1(roas * x.r)}`, color: x.r >= 1 ? C.violet : C.grey }))} />
        </Card>
        <Card title="Top creative" sub="Ranked by attributed revenue">
          <div className="creative-grid">
            {ADS.map(a => (
              <div className="creative" key={a.n}>
                <div className="thumb" style={{ background: a.bg }}><span>{a.n}</span></div>
                <dl className="kv"><dt>Format</dt><dd>{a.fmt}</dd><dt>Spend</dt><dd className="num">{f.moneyK(t.spend * a.s)}</dd><dt>CTR</dt><dd className="num">{a.ctr.toFixed(1)}%</dd><dt>ROAS</dt><dd className="num">{f.x1(roas * a.r)}</dd></dl>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 12 }}>Creative thumbnails are placeholders in this demo.</p>
        </Card>
      </div>
      <Card title="Campaigns" sub="Store campaigns count toward store ROAS. Awareness and legacy campaigns do not." flush actions={storeIdx == null ? <Seg value={scope} onChange={setScope} options={[{ id: "all", label: "All campaigns" }, { id: "store", label: "Store campaigns" }]} /> : undefined}>
        <DataTable rows={list} rowKey={r => r.id} initialSort={{ key: "spend", dir: "desc" }} maxHeight={560} onRow={r => r.storeIdx != null && setStoreIdx(r.storeIdx)} cols={[
          { key: "n", label: "Campaign", render: r => <span className="store">{r.name}</span>, sort: r => r.name },
          { key: "t", label: "Objective", render: r => r.type, sort: r => r.type },
          { key: "st", label: "Status", render: r => <Pill tone={r.status === "Active" ? "good" : "neutral"}>{r.status}</Pill>, sort: r => r.status },
          { key: "spend", label: "Spend", align: "r", render: r => f.money(r.spend), sort: r => r.spend },
          { key: "imp", label: "Impressions", align: "r", render: r => f.compact(r.impressions), sort: r => r.impressions },
          { key: "ctr", label: "CTR", align: "r", render: r => f.pct(ratio(r.clicks, r.impressions), 2), sort: r => ratio(r.clicks, r.impressions) },
          { key: "cpc", label: "CPC", align: "r", render: r => f.money2(ratio(r.spend, r.clicks)), sort: r => ratio(r.spend, r.clicks) },
          { key: "conv", label: "Purchases", align: "r", render: r => f.num(r.conversions), sort: r => r.conversions },
          { key: "roas", label: "ROAS", align: "r", render: r => (r.inRoas ? <RoasPill roas={ratio(r.revenue, r.spend)} target={target} /> : <Pill>Not in store ROAS</Pill>), sort: r => (r.inRoas ? ratio(r.revenue, r.spend) : -1) },
        ]} />
      </Card>
    </div>
  );
}
