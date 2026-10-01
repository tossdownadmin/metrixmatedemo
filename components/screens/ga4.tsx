"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { f } from "@/lib/format";
import { byStore, daily, GA4_CHANNELS, pct, slice, SOURCE_MEDIUMS, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Kpis, Legend, Pill, Tabs } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";
import { DataTable } from "@/components/ui/table";

export function Ga4() {
  const { demo, cur, prev, storeIdx, role } = useApp();
  const [tab, setTab] = useState<"overview" | "acq" | "pages" | "funnel">("overview");
  const t = totals(slice(demo, cur, storeIdx)), p = totals(slice(demo, prev, storeIdx));
  const series = useMemo(() => daily(demo, cur, storeIdx).map(s => ({ date: s.date, sessions: s.sessions, purchases: s.webPurchases })), [demo, cur, storeIdx]);
  const revenue = t.srcSales[1] + t.srcSales[2];
  const chanTotal = GA4_CHANNELS.reduce((a, c) => a + c.share * c.conv, 0);
  const smTotal = SOURCE_MEDIUMS.reduce((a, c) => a + c.share * c.conv, 0);
  const pages = useMemo(() => {
    const st = byStore(demo, cur).sort((a, b) => b.t.sessions - a.t.sessions);
    const base = [{ path: "/", share: 0.21 }, { path: "/menu", share: 0.17 }, { path: "/deals", share: 0.08 }, { path: "/locations", share: 0.05 }];
    const store = (storeIdx == null ? st.slice(0, 10) : st.filter(s => s.store.idx === storeIdx)).map(s => ({ path: `/order/${s.store.slug}`, share: storeIdx == null ? (s.t.sessions / (t.sessions || 1)) * 0.49 : 0.49 }));
    return [...base, ...store].map(x => ({ ...x, sessions: t.sessions * x.share, conv: x.path.startsWith("/order") ? 0.072 : x.path === "/deals" ? 0.041 : 0.018 }));
  }, [demo, cur, storeIdx, t.sessions]);
  const funnel = [{ n: "Sessions", v: t.sessions }, { n: "Viewed menu", v: t.sessions * 0.61 }, { n: "Added to cart", v: t.sessions * 0.17 }, { n: "Began checkout", v: t.sessions * 0.083 }, { n: "Purchased", v: t.webPurchases }];
  return (
    <div className="stack">
      <ScopeBanner />
      <Kpis items={[
        { label: "Sessions", value: f.num(t.sessions), delta: pct(t.sessions, p.sessions) },
        { label: "Users", value: f.num(t.users), delta: pct(t.users, p.users) },
        { label: "Purchases", value: f.num(t.webPurchases), delta: pct(t.webPurchases, p.webPurchases) },
        { label: "Conversion rate", value: f.pct(t.convRate, 2), delta: pct(t.convRate, p.convRate) },
        { label: "Web and app revenue", value: f.money(revenue), delta: pct(revenue, p.srcSales[1] + p.srcSales[2]) },
        { label: "Order match rate", value: "94%", info: "Share of web and app POS orders matched to a GA4 purchase event. This is what makes store-level attribution possible." },
      ]} />
      <Tabs value={tab} onChange={setTab} options={[{ id: "overview", label: "Overview" }, { id: "acq", label: "Source / medium" }, { id: "pages", label: "Pages" }, { id: "funnel", label: "Ordering funnel" }]} />
      {tab === "overview" && (
        <div className="grid g-2-1">
          <Card title="Sessions and purchases" sub="Daily" actions={<Legend items={[{ label: "Sessions", color: C.sky }, { label: "Purchases", color: C.ember, kind: "line" }]} />}>
            <TrendChart data={series} height={270} left={f.compact} right={f.num} series={[{ key: "sessions", label: "Sessions", color: C.sky, type: "area" }, { key: "purchases", label: "Purchases", color: C.ember, axis: "right" }]} />
          </Card>
          <Card title="Default channel group" sub="Share of sessions and purchases">
            <BarList items={GA4_CHANNELS.map(c => ({ label: c.name, value: c.share, display: `${f.num(t.sessions * c.share)} · ${f.num((t.webPurchases * c.share * c.conv) / chanTotal)} orders`, color: c.name.startsWith("Paid") ? C.ember : C.ink }))} />
          </Card>
        </div>
      )}
      {tab === "acq" && (
        <Card title="Session source / medium" sub="Checked rows feed paid attribution for store ROAS. TikTok runs on its own report." flush>
          <DataTable rows={SOURCE_MEDIUMS} rowKey={r => r.sm} initialSort={{ key: "s", dir: "desc" }} cols={[
            { key: "sm", label: "Source / medium", render: r => <span className="store">{r.sm}</span>, sort: r => r.sm },
            { key: "s", label: "Sessions", align: "r", render: r => f.num(t.sessions * r.share), sort: r => r.share },
            { key: "u", label: "Users", align: "r", render: r => f.num(t.users * r.share), sort: r => r.share },
            { key: "p", label: "Purchases", align: "r", render: r => f.num((t.webPurchases * r.share * r.conv) / smTotal), sort: r => r.share * r.conv },
            { key: "cr", label: "Conv. rate", align: "r", render: r => f.pct((t.convRate * r.conv) / smTotal, 2), sort: r => r.conv },
            { key: "a", label: "Paid attribution", render: r => (r.paid ? <Pill tone="good"><Check size={11} />Counted</Pill> : <span className="sub">Not counted</span>), sort: r => (r.paid ? 1 : 0) },
          ]} />
        </Card>
      )}
      {tab === "pages" && (
        <Card title="Landing pages" sub={role === "admin" && storeIdx == null ? "Top store ordering pages plus site pages" : "Site pages and this store's ordering page"} flush>
          <DataTable rows={pages} rowKey={r => r.path} initialSort={{ key: "s", dir: "desc" }} cols={[
            { key: "p", label: "Page path", render: r => <span className="store">{r.path}</span>, sort: r => r.path },
            { key: "s", label: "Sessions", align: "r", render: r => f.num(r.sessions), sort: r => r.sessions },
            { key: "e", label: "Engagement rate", align: "r", render: r => f.pct(r.path.startsWith("/order") ? 0.71 : 0.58, 0) },
            { key: "c", label: "Conv. rate", align: "r", render: r => f.pct(r.conv, 1), sort: r => r.conv },
          ]} />
        </Card>
      )}
      {tab === "funnel" && (
        <Card title="Ordering funnel" sub="Sessions through to purchase in the period">
          <div className="funnel">
            {funnel.map((s, i) => (
              <div className="funnel-row" key={s.n}>
                <span>{s.n}</span>
                <div className="bar" style={{ width: `${Math.max(1.5, (s.v / funnel[0].v) * 100)}%`, opacity: 1 - i * 0.13 }} />
                <b className="num" style={{ textAlign: "right" }}>{f.num(s.v)}</b>
                <span className="note" style={{ textAlign: "right" }}>{i === 0 ? "" : `${f.pct(s.v / funnel[i - 1].v, 0)} of prior`}</span>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 14 }}>The largest drop is menu to cart. Store pages with photos on every item convert about 20% better.</p>
        </Card>
      )}
    </div>
  );
}
