"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SOURCES } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { byStore, campaignStats, daily, pct, recentAttributedOrders, slice, totals, type StoreTotals } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, Donut, RoasRuler, SOURCE_COLORS, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Delta, Info, Kpis, Legend, Pill, RoasPill, Tabs } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";
import { DataTable, type Col } from "@/components/ui/table";

const ROAS_INFO = "Attributed ROAS = attributed POS revenue ÷ ad spend. Spend counts only store campaigns (name contains NS and the store token). Revenue counts POS orders matched to a paid Google or Meta session on that store's ordering page.";

export function Dashboard() {
  const [tab, setTab] = useState<"overview" | "stores" | "orders">("overview");
  return (
    <div className="stack">
      <ScopeBanner />
      <Tabs value={tab} onChange={setTab} options={[{ id: "overview", label: "Overview" }, { id: "stores", label: "Per-store ROAS" }, { id: "orders", label: "Attributed orders" }]} />
      {tab === "overview" && <Overview />}
      {tab === "stores" && <StoreTable />}
      {tab === "orders" && <OrdersFeed />}
    </div>
  );
}

function Overview() {
  const { demo, cur, prev, ly, storeIdx, store, platform, target, setStoreIdx } = useApp();
  const t = useMemo(() => totals(slice(demo, cur, storeIdx), platform), [demo, cur, storeIdx, platform]);
  const p = useMemo(() => totals(slice(demo, prev, storeIdx), platform), [demo, prev, storeIdx, platform]);
  const stores = useMemo(() => byStore(demo, cur, platform).filter(s => s.t.spend > 0), [demo, cur, platform]);
  const series = useMemo(() => daily(demo, cur, storeIdx, platform), [demo, cur, storeIdx, platform]);
  const lySeries = useMemo(() => daily(demo, ly, storeIdx, platform), [demo, ly, storeIdx, platform]);
  const atTarget = stores.filter(s => s.t.roas >= target).length;
  const ranked = [...stores].sort((a, b) => b.t.roas - a.t.roas);

  const chartData = series.map(s => ({ date: s.date, spend: s.spend, revenue: s.rev, roas: s.spend ? s.rev / s.spend : 0 }));
  const salesData = series.map((s, i) => ({ date: s.date, net: s.net, ly: lySeries[i]?.net ?? 0 }));
  const lyNet = lySeries.reduce((a, b) => a + b.net, 0);

  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="lbl">Attributed ROAS{store ? `, ${store.name}` : ", all stores"}<Info tip={ROAS_INFO} /></div>
          <div className="big num">{t.roas.toFixed(1)}<small>×</small></div>
          <div className="vs">{t.roas >= target ? `${(t.roas - target).toFixed(1)}× above` : `${(target - t.roas).toFixed(1)}× below`} the {target}× target <span style={{ marginLeft: 6 }}><Delta value={pct(t.roas, p.roas)} /></span></div>
          <div className="stats">
            {store ? (
              <>
                <div><strong className="num">{f.money(t.spend)}</strong><span>Ad spend</span></div>
                <div><strong className="num">{f.pct(t.net ? t.rev / t.net : 0)}</strong><span>Of sales from paid</span></div>
              </>
            ) : (
              <>
                <div><strong className="num">{atTarget} of {stores.length}</strong><span>Stores at target</span></div>
                <div><strong className="num">{f.moneyK(t.spend)}</strong><span>Ad spend</span></div>
              </>
            )}
          </div>
        </div>
        <div className="hero-right">
          {store ? (
            <>
              <h3>Daily ROAS for {store.name}</h3>
              <p>Attributed revenue ÷ store campaign spend, by day</p>
              <TrendChart data={chartData} height={190} left={v => `${+v.toFixed(1)}×`} series={[{ key: "roas", label: "ROAS", color: C.ink, type: "area" }]} refLine={{ y: target, label: `${target}× target` }} />
            </>
          ) : (
            <>
              <h3>Where every store sits against target</h3>
              <p>{atTarget} stores at or above {target}×. {ranked.filter(s => s.t.roas < target * 0.6).length} stores below {(target * 0.6).toFixed(1)}× need attention.</p>
              <RoasRuler stores={stores.map(s => ({ id: s.store.id, name: s.store.name, roas: s.t.roas, spend: s.t.spend }))} target={target} onPick={id => setStoreIdx(demo.stores.findIndex(s => s.id === id))} />
            </>
          )}
        </div>
      </section>

      <Kpis items={[
        { label: "Net sales", value: f.money(t.net), delta: pct(t.net, p.net), note: "vs prior period" },
        { label: "Orders", value: f.num(t.orders), delta: pct(t.orders, p.orders) },
        { label: "Average order", value: f.money2(t.aov), delta: pct(t.aov, p.aov) },
        { label: "Attributed sales", value: f.money(t.rev), delta: pct(t.rev, p.rev), info: "POS revenue from orders matched to a paid Google or Meta session." },
        { label: "Attributed orders", value: f.num(t.attOrd), delta: pct(t.attOrd, p.attOrd) },
        { label: "Ad spend", value: f.money(t.spend), delta: pct(t.spend, p.spend), invert: true },
        { label: "New customers", value: f.num(t.newC), delta: pct(t.newC, p.newC) },
      ]} />

      <div className="grid g-2-1">
        <Card title="Ad spend and attributed revenue" sub="Daily, store campaigns only" info={ROAS_INFO} actions={<Legend items={[{ label: "Attributed revenue", color: C.basil }, { label: "Ad spend", color: C.ink }]} />}>
          <TrendChart data={chartData} height={270} series={[{ key: "spend", label: "Ad spend", color: C.ink, type: "bar" }, { key: "revenue", label: "Attributed revenue", color: C.basil, type: "area" }]} />
        </Card>
        <ChannelCard t={t} p={p} />
      </div>

      {store ? <StoreCampaigns /> : (
        <div className="grid g2">
          <Card title="Top 5 stores by ROAS" sub="Stores with ad spend in the period">
            <BarList items={ranked.slice(0, 5).map(s => ({ id: String(s.store.idx), label: s.store.name, value: s.t.roas, display: f.x(s.t.roas), color: C.basil }))} max={ranked[0]?.t.roas} onClick={id => setStoreIdx(Number(id))} />
          </Card>
          <Card title="Bottom 5 stores by ROAS" sub="Highest spend at risk is listed first in Store Insights">
            <BarList items={ranked.slice(-5).reverse().map(s => ({ id: String(s.store.idx), label: s.store.name, value: s.t.roas, display: f.x(s.t.roas), color: s.t.roas < target * 0.6 ? C.berry : C.saffron }))} max={ranked[0]?.t.roas} onClick={id => setStoreIdx(Number(id))} />
          </Card>
        </div>
      )}

      <div className="grid g-2-1">
        <Card title="Net sales against last year" sub={`Same weekdays last year. ${f.delta(pct(t.net, lyNet))} year over year.`} actions={<Legend items={[{ label: "This period", color: C.ember, kind: "line" }, { label: "Last year", color: C.grey, kind: "dash" }]} />}>
          <TrendChart data={salesData} height={240} series={[{ key: "net", label: "This period", color: C.ember, type: "area" }, { key: "ly", label: "Last year", color: C.grey, dashed: true }]} />
        </Card>
        <Card title="Sales by order source" sub="Net sales in the period">
          <Donut data={SOURCES.map((s, j) => ({ name: s, value: t.srcSales[j], color: SOURCE_COLORS[j] }))} center={{ value: f.pct((t.srcSales[0] + t.srcSales[1] + t.srcSales[2]) / (t.net || 1), 0), label: "first-party" }} height={180} />
          <div style={{ marginTop: 12 }}><Legend items={SOURCES.map((s, j) => ({ label: `${s} ${f.pct(t.srcSales[j] / (t.net || 1), 0)}`, color: SOURCE_COLORS[j] }))} /></div>
        </Card>
      </div>
    </>
  );
}

function ChannelCard({ t, p }: { t: ReturnType<typeof totals>; p: ReturnType<typeof totals> }) {
  const { platform, target } = useApp();
  const rows = [
    { name: "Google Ads", color: C.sky, spend: t.gSpend, rev: t.gRev, ord: t.gOrd, prev: p.gSpend ? p.gRev / p.gSpend : 0, on: platform !== "meta" },
    { name: "Meta Ads", color: C.violet, spend: t.mSpend, rev: t.mRev, ord: t.mOrd, prev: p.mSpend ? p.mRev / p.mSpend : 0, on: platform !== "google" },
  ];
  const total = rows.reduce((a, r) => a + r.spend, 0) || 1;
  return (
    <Card title="Google vs Meta" sub="Share of spend and return on each">
      <div className="meter" style={{ height: 10, marginBottom: 16 }}>
        {rows.map(r => <i key={r.name} style={{ width: `${(r.spend / total) * 100}%`, background: r.color, opacity: r.on ? 1 : 0.25 }} />)}
      </div>
      <div className="stack" style={{ gap: 14 }}>
        {rows.map(r => {
          const roas = r.spend ? r.rev / r.spend : 0;
          return (
            <div key={r.name} style={{ opacity: r.on ? 1 : 0.45 }}>
              <div className="row"><span className="dot" style={{ background: r.color }} /><b>{r.name}</b><span className="spacer" /><RoasPill roas={roas} target={target} /></div>
              <dl className="kv" style={{ gridTemplateColumns: "1fr auto", marginTop: 8 }}>
                <dt>Spend</dt><dd className="num">{f.money(r.spend)}</dd>
                <dt>Attributed revenue</dt><dd className="num">{f.money(r.rev)}</dd>
                <dt>Attributed orders</dt><dd className="num">{f.num(r.ord)}</dd>
                <dt>ROAS vs prior period</dt><dd><Delta value={pct(roas, r.prev)} /></dd>
              </dl>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function StoreCampaigns() {
  const { demo, cur, storeIdx, target } = useApp();
  const list = [...campaignStats(demo, cur, "google", storeIdx), ...campaignStats(demo, cur, "meta", storeIdx)];
  return (
    <Card title="Campaigns mapped to this store" sub="Matched by the store token in the campaign name" flush>
      <DataTable rows={list} rowKey={r => r.id} initialSort={{ key: "spend", dir: "desc" }} cols={[
        { key: "name", label: "Campaign", render: r => <span className="store">{r.name}</span>, sort: r => r.name },
        { key: "platform", label: "Platform", render: r => <Pill tone={r.platform === "google" ? "info" : "violet"}>{r.platform === "google" ? "Google" : "Meta"}</Pill> },
        { key: "status", label: "Status", render: r => <Pill tone={r.status === "Active" ? "good" : "neutral"}>{r.status}</Pill> },
        { key: "spend", label: "Spend", align: "r", render: r => f.money(r.spend), sort: r => r.spend },
        { key: "rev", label: "Attributed revenue", align: "r", render: r => f.money(r.revenue), sort: r => r.revenue },
        { key: "conv", label: "Orders", align: "r", render: r => f.num(r.conversions), sort: r => r.conversions },
        { key: "roas", label: "ROAS", align: "r", render: r => <RoasPill roas={r.spend ? r.revenue / r.spend : 0} target={target} />, sort: r => (r.spend ? r.revenue / r.spend : 0) },
      ]} />
    </Card>
  );
}

function StoreTable() {
  const { demo, cur, prev, platform, target, setStoreIdx, role, storeIdx } = useApp();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const p = byStore(demo, prev, platform);
    return byStore(demo, cur, platform).map((s, i) => ({ ...s, prevRoas: p[i].t.roas }));
  }, [demo, cur, prev, platform]);
  const shown = rows.filter(r => (role === "admin" || r.store.idx === storeIdx) && `${r.store.name} ${r.store.market}`.toLowerCase().includes(q.toLowerCase()));
  const all = totals(slice(demo, cur), platform);
  const cols: Col<StoreTotals & { prevRoas: number }>[] = [
    { key: "store", label: "Store", render: r => <span><span className="store">{r.store.name}</span> <span className="sub">{r.store.market}</span>{r.isNew && <> <Pill tone="info">New</Pill></>}</span>, sort: r => r.store.name, foot: `All stores (${shown.length})` },
    { key: "spend", label: "Ad spend", align: "r", render: r => f.money(r.t.spend), sort: r => r.t.spend, foot: f.money(all.spend) },
    { key: "rev", label: "Attributed revenue", align: "r", render: r => f.money(r.t.rev), sort: r => r.t.rev, foot: f.money(all.rev) },
    { key: "ord", label: "Attr. orders", align: "r", render: r => f.num(r.t.attOrd), sort: r => r.t.attOrd, foot: f.num(all.attOrd) },
    { key: "roas", label: "ROAS", align: "r", render: r => <RoasPill roas={r.t.roas} target={target} />, sort: r => r.t.roas, foot: f.x(all.roas) },
    { key: "gap", label: "Gap to target", align: "r", render: r => <span className={r.t.roas >= target ? "pos" : "neg"}>{r.t.roas >= target ? "+" : "−"}{Math.abs(r.t.roas - target).toFixed(1)}×</span>, sort: r => r.t.roas - target },
    { key: "chg", label: "ROAS vs prior", align: "r", render: r => <Delta value={pct(r.t.roas, r.prevRoas)} />, sort: r => pct(r.t.roas, r.prevRoas) ?? 0 },
    { key: "net", label: "Net sales", align: "r", render: r => f.money(r.t.net), sort: r => r.t.net, foot: f.money(all.net) },
    { key: "share", label: "Paid share of sales", align: "r", render: r => f.pct(r.t.net ? r.t.rev / r.t.net : 0), sort: r => (r.t.net ? r.t.rev / r.t.net : 0), foot: f.pct(all.rev / (all.net || 1)) },
  ];
  return (
    <Card title="Per-store ROAS" sub={`${rows.filter(r => r.t.roas >= target).length} of ${rows.length} stores at or above ${target}×. Click a row to open that store.`} info={ROAS_INFO}
      actions={<div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "var(--faint)" }} /><input className="input" style={{ paddingLeft: 30 }} placeholder="Find a store" value={q} onChange={e => setQ(e.target.value)} /></div>} flush>
      <DataTable rows={shown} cols={cols} rowKey={r => r.store.id} initialSort={{ key: "roas", dir: "desc" }} onRow={r => setStoreIdx(r.store.idx)} maxHeight={640} />
    </Card>
  );
}

function OrdersFeed() {
  const { demo, storeIdx, platform } = useApp();
  const orders = useMemo(() => recentAttributedOrders(demo, storeIdx, platform, 80), [demo, storeIdx, platform]);
  return (
    <Card title="Recent attributed orders" sub="Latest POS orders matched to a paid session in the last three business days" flush>
      <DataTable rows={orders} rowKey={r => r.id} cols={[
        { key: "id", label: "Order", render: r => <span className="num">{r.id}</span> },
        { key: "when", label: "Placed", render: r => <span>{fmtDate(r.date)} <span className="sub">{r.time}</span></span>, sort: r => r.date },
        { key: "store", label: "Store", render: r => r.store.name, sort: r => r.store.name },
        { key: "src", label: "Order source", render: r => r.source },
        { key: "sm", label: "Session source / medium", render: r => <span className="sub" style={{ color: "var(--ink-2)" }}>{r.sourceMedium}</span> },
        { key: "camp", label: "Campaign", render: r => <span className="sub" style={{ color: "var(--ink-2)" }}>{r.campaign}</span> },
        { key: "cust", label: "Customer", render: r => <Pill tone={r.customer === "New" ? "good" : "neutral"}>{r.customer}</Pill> },
        { key: "amt", label: "Order total", align: "r", render: r => f.money2(r.amount), sort: r => r.amount },
      ]} />
    </Card>
  );
}
