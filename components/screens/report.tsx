"use client";

import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import { SOURCES } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { fleetFindings, storeFindings } from "@/lib/insights";
import { byStore, campaignStats, daily, pct, productStats, slice, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, SOURCE_COLORS, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Kpis } from "@/components/ui/primitives";

const SECTIONS = [
  { id: "summary", label: "Executive summary" },
  { id: "trend", label: "Sales trend" },
  { id: "roas", label: "ROAS by store" },
  { id: "sources", label: "Order sources" },
  { id: "menu", label: "Top items" },
  { id: "paid", label: "Paid media by platform" },
  { id: "recs", label: "Recommendations" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

export function ReportBuilder() {
  const { demo, cur, prev, ly, storeIdx, store, target, platform } = useApp();
  const [title, setTitle] = useState(`${store ? store.name : BRAND.name} performance review`);
  const [preparedFor, setPreparedFor] = useState("Leadership team");
  const [on, setOn] = useState<SectionId[]>(["summary", "trend", "roas", "sources", "paid", "recs"]);
  const t = totals(slice(demo, cur, storeIdx), platform), p = totals(slice(demo, prev, storeIdx), platform), l = totals(slice(demo, ly, storeIdx), platform);
  const stores = useMemo(() => byStore(demo, cur, platform).filter(s => s.t.spend > 0).sort((a, b) => b.t.roas - a.t.roas), [demo, cur, platform]);
  const series = useMemo(() => daily(demo, cur, storeIdx).map(s => ({ date: s.date, net: s.net })), [demo, cur, storeIdx]);
  const items = useMemo(() => productStats(demo, slice(demo, cur, storeIdx)).sort((a, b) => b.sales - a.sales).slice(0, 6), [demo, cur, storeIdx]);
  const recs = useMemo(() => (storeIdx == null ? fleetFindings(demo, cur, prev, target, platform) : storeFindings(demo, cur, prev, target, platform, storeIdx)).slice(0, 4), [demo, cur, prev, target, platform, storeIdx]);
  const g = campaignStats(demo, cur, "google", storeIdx), m = campaignStats(demo, cur, "meta", storeIdx);
  const sumC = (c: typeof g) => c.reduce((a, x) => ({ spend: a.spend + x.spend, rev: a.rev + (x.inRoas ? x.revenue : 0), clicks: a.clicks + x.clicks }), { spend: 0, rev: 0, clicks: 0 });
  const has = (id: SectionId) => on.includes(id);

  return (
    <div className="grid g-report">
      <div className="no-print stack" style={{ position: "sticky", top: 88 }}>
        <Card title="Report setup" sub={`${fmtDate(cur.start)} to ${fmtDate(cur.end)}, ${store ? store.name : "all stores"}`}>
          <div className="stack" style={{ gap: 12 }}>
            <label className="stack" style={{ gap: 4 }}><span className="note">Title</span><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></label>
            <label className="stack" style={{ gap: 4 }}><span className="note">Prepared for</span><input className="input" value={preparedFor} onChange={e => setPreparedFor(e.target.value)} /></label>
            <div className="stack" style={{ gap: 6 }}>
              <span className="note">Sections</span>
              {SECTIONS.map(s => (
                <label key={s.id} className="row" style={{ gap: 8, fontSize: 13.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={has(s.id)} onChange={() => setOn(o => (o.includes(s.id) ? o.filter(x => x !== s.id) : SECTIONS.map(x => x.id).filter(x => o.includes(x) || x === s.id)))} style={{ accentColor: "var(--ink)" }} />{s.label}
                </label>
              ))}
            </div>
            <button className="btn primary" onClick={() => window.print()}><Printer size={14} />Save as PDF</button>
            <p className="note">Uses your browser's print dialog. Choose "Save as PDF" as the destination.</p>
          </div>
        </Card>
      </div>
      <div className="report-page">
        <div>
          <div className="row"><div className="side-mark" style={{ width: 28, height: 28 }}><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2l2.6 6.9L22 9.3l-5.7 4.7L18.2 22 12 17.8 5.8 22l1.9-8L2 9.3l7.4-.4z" fill="#fff" /></svg></div><span className="note">{BRAND.name}, prepared by MetrixMate</span></div>
          <h2 style={{ marginTop: 14 }}>{title}</h2>
          <p className="muted" style={{ marginTop: 4 }}>{fmtDate(cur.start, { month: "long", day: "numeric" })} to {fmtDate(cur.end, { month: "long", day: "numeric", year: "numeric" })}. Prepared for {preparedFor}.</p>
        </div>
        {has("summary") && (
          <section className="stack" style={{ gap: 12 }}>
            <h3>Executive summary</h3>
            <Kpis items={[
              { label: "Net sales", value: f.money(t.net), delta: pct(t.net, p.net) },
              { label: "vs last year", value: f.delta(pct(t.net, l.net)) },
              { label: "Attributed ROAS", value: f.x(t.roas), delta: pct(t.roas, p.roas) },
              { label: "Ad spend", value: f.money(t.spend) },
            ]} />
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: "72ch" }}>
              Net sales were {f.money(t.net)} across {f.num(t.orders)} orders, {pct(t.net, p.net)! >= 0 ? "up" : "down"} {f.delta(pct(t.net, p.net)).replace(/[+−]/, "")} on the prior period and {f.delta(pct(t.net, l.net))} against last year. Paid media returned {f.x(t.roas)} on {f.money(t.spend)}, {t.roas >= target ? "above" : "below"} the {target}× target{storeIdx == null ? `, with ${stores.filter(s => s.t.roas >= target).length} of ${stores.length} stores at or above it` : ""}.
            </p>
          </section>
        )}
        {has("trend") && <section className="stack" style={{ gap: 10 }}><h3>Sales trend</h3><TrendChart data={series} height={200} series={[{ key: "net", label: "Net sales", color: C.ember, type: "area" }]} /></section>}
        {has("roas") && storeIdx == null && (
          <section className="stack" style={{ gap: 10 }}>
            <h3>ROAS by store</h3>
            <div className="grid g2">
              <div><div className="note" style={{ marginBottom: 8 }}>Highest</div><BarList items={stores.slice(0, 6).map(s => ({ label: s.store.name, value: s.t.roas, display: f.x(s.t.roas), color: C.basil }))} max={stores[0]?.t.roas} /></div>
              <div><div className="note" style={{ marginBottom: 8 }}>Lowest</div><BarList items={stores.slice(-6).reverse().map(s => ({ label: s.store.name, value: s.t.roas, display: f.x(s.t.roas), color: C.berry }))} max={stores[0]?.t.roas} /></div>
            </div>
          </section>
        )}
        {has("sources") && <section className="stack" style={{ gap: 10 }}><h3>Order sources</h3><BarList items={SOURCES.map((s, j) => ({ label: s, value: t.srcSales[j], display: `${f.money(t.srcSales[j])} (${f.pct(t.srcSales[j] / (t.net || 1), 0)})`, color: SOURCE_COLORS[j] }))} /></section>}
        {has("menu") && <section className="stack" style={{ gap: 10 }}><h3>Top items</h3><BarList items={items.map(i => ({ label: i.name, value: i.sales, display: `${f.money(i.sales)}, ${f.num(i.units)} units`, color: C.ink }))} /></section>}
        {has("paid") && (
          <section className="stack" style={{ gap: 10 }}>
            <h3>Paid media by platform</h3>
            <table className="tbl"><thead><tr><th>Platform</th><th className="r">Spend</th><th className="r">Clicks</th><th className="r">Attributed revenue</th><th className="r">ROAS</th></tr></thead>
              <tbody>{[["Google Ads", sumC(g)], ["Meta Ads", sumC(m)]].map(([n, v]) => { const x = v as ReturnType<typeof sumC>; return <tr key={n as string}><td>{n as string}</td><td className="r num">{f.money(x.spend)}</td><td className="r num">{f.num(x.clicks)}</td><td className="r num">{f.money(x.rev)}</td><td className="r num">{f.x(x.rev / (x.spend || 1))}</td></tr>; })}</tbody></table>
            <p className="note">Spend includes brand and awareness campaigns. Revenue counts store campaigns only, so platform ROAS here reads lower than store ROAS.</p>
          </section>
        )}
        {has("recs") && (
          <section className="stack" style={{ gap: 10 }}>
            <h3>Recommendations</h3>
            {recs.map(r => <div key={r.id}><b>{r.title}</b><p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 3 }}>{r.action}</p></div>)}
          </section>
        )}
        <p className="note">Simulated data for demonstration.</p>
      </div>
    </div>
  );
}
