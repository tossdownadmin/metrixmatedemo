"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { addDays, fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { rnd } from "@/lib/rand";
import { useApp, type Screen } from "@/components/context";
import { Card, Kpis, Pill } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/table";

const SOURCES = [
  { id: "pos", name: "POS system", kind: "Point of sale", color: "#13223a", init: "P", rows: 42 * 3, detail: "42 locations, orders and items" },
  { id: "gads", name: "Google Ads", kind: "Paid media", color: "#2f6fe4", init: "G", rows: 90, detail: "1 account, 86 campaigns" },
  { id: "meta", name: "Meta Ads", kind: "Paid media", color: "#6e56cf", init: "M", rows: 92, detail: "1 ad account, 88 campaigns" },
  { id: "tt", name: "TikTok Ads", kind: "Paid media", color: "#0e9f9a", init: "T", rows: 7, detail: "1 advertiser, 2 campaigns" },
  { id: "ga4", name: "Google Analytics 4", kind: "Web analytics", color: "#c98410", init: "A", rows: 58, detail: "1 property, ordering site" },
  { id: "gbp", name: "Google Business Profile", kind: "Local listings", color: "#17936a", init: "B", rows: 42, detail: "42 listings" },
];
const CATALOG = [
  { name: "Delivery marketplaces", d: "Order-level marketplace data and fees", s: "On roadmap" },
  { name: "Loyalty and CRM", d: "Member profiles, points and offers", s: "On roadmap" },
  { name: "Email and SMS", d: "Campaign sends, clicks and revenue", s: "Available on request" },
  { name: "Reviews", d: "Ratings and review text by location", s: "Available on request" },
];
const USERS = [
  { n: "Jordan Reyes", e: "jordan@northstarslice.com", r: "Admin", s: "All stores", last: 0 },
  { n: "Priya Natarajan", e: "priya@northstarslice.com", r: "Admin", s: "All stores", last: 1 },
  { n: "Marcus Bell", e: "marcus@northstarslice.com", r: "Viewer", s: "All stores", last: 2 },
  { n: "Maya Kowalski", e: "maya@northstarslice.com", r: "Store manager", s: "Short North", last: 0 },
  { n: "Andre Thompson", e: "andre@northstarslice.com", r: "Store manager", s: "Royal Oak", last: 3 },
  { n: "Lena Fischer", e: "lena@northstarslice.com", r: "Store manager", s: "Wicker Park", last: 6 },
];
const PAGES = ["Dashboard", "Sales Comparison", "Source Comparison", "POS Analysis", "Store Insights", "Fleet Strategy", "Report Builder", "Meta Ads", "Google Ads", "TikTok Ads", "Web Analytics", "Workspace"];
const ACCESS: Record<string, boolean[]> = {
  Admin: PAGES.map(() => true),
  Viewer: PAGES.map(p => p !== "Workspace"),
  "Store manager": PAGES.map(p => !["Sales Comparison", "Source Comparison", "Fleet Strategy", "TikTok Ads", "Workspace"].includes(p)),
};

export function SystemScreen({ screen }: { screen: Screen }) {
  const { demo, target, setTarget } = useApp();
  const runs = Array.from({ length: 28 }, (_, i) => {
    const src = SOURCES[i % SOURCES.length];
    const day = addDays(demo.anchor, 1 - Math.floor(i / SOURCES.length));
    const warn = rnd(i, 9) < 0.07;
    return { id: i, src, day, time: `${5 + (i % 3)}:${String(5 + ((i * 7) % 50)).padStart(2, "0")} AM`, rows: Math.round(src.rows * (src.id === "pos" ? 140 : 1) * (0.9 + rnd(i, 10) * 0.2)), secs: Math.round(20 + rnd(i, 11) * (src.id === "pos" ? 260 : 60)), warn };
  });

  if (screen === "connections") return (
    <div className="stack">
      <Kpis items={[{ label: "Connected sources", value: String(SOURCES.length) }, { label: "Locations mapped", value: "42 of 42" }, { label: "Last full refresh", value: "6:07 AM" }, { label: "History available", value: `${demo.days} days` }]} />
      <div className="grid g3">
        {SOURCES.map(s => (
          <Card key={s.id}>
            <div className="conn">
              <div className="row"><span className="conn-logo" style={{ background: s.color }}>{s.init}</span><div><b>{s.name}</b><div className="note">{s.kind}</div></div><span className="spacer" /><Pill tone="good"><CheckCircle2 size={11} />Healthy</Pill></div>
              <dl className="kv"><dt>Scope</dt><dd>{s.detail}</dd><dt>Last sync</dt><dd>Today, 6:0{SOURCES.indexOf(s) + 2} AM</dd><dt>Schedule</dt><dd>Daily at 6 AM ET</dd></dl>
            </div>
          </Card>
        ))}
      </div>
      <p className="note">This is a demo workspace. Sources and sync times are simulated.</p>
    </div>
  );

  if (screen === "connectors") return (
    <div className="stack">
      <Card title="Connected" sub="Live in this workspace"><div className="chips">{SOURCES.map(s => <span key={s.id} className="chip">{s.name}</span>)}</div></Card>
      <div className="grid g2">
        {CATALOG.map(c => (
          <Card key={c.name} title={c.name} sub={c.d} actions={<Pill tone={c.s === "On roadmap" ? "neutral" : "info"}>{c.s}</Pill>}><button className="btn sm">Ask about this source</button></Card>
        ))}
      </div>
    </div>
  );

  if (screen === "sync") return (
    <div className="stack">
      <Kpis items={[{ label: "Runs, last 5 days", value: String(runs.length) }, { label: "Succeeded", value: String(runs.filter(r => !r.warn).length) }, { label: "Retried", value: String(runs.filter(r => r.warn).length) }, { label: "Rows loaded", value: f.compact(runs.reduce((a, r) => a + r.rows, 0)) }]} />
      <Card title="Sync runs" sub="Newest first" flush>
        <DataTable rows={runs} rowKey={r => String(r.id)} cols={[
          { key: "s", label: "Source", render: r => <span className="store">{r.src.name}</span> },
          { key: "d", label: "Started", render: r => `${fmtDate(r.day)}, ${r.time}` },
          { key: "st", label: "Status", render: r => (r.warn ? <Pill tone="watch"><AlertTriangle size={11} />Succeeded on retry</Pill> : <Pill tone="good">Succeeded</Pill>) },
          { key: "r", label: "Rows", align: "r", render: r => f.num(r.rows) },
          { key: "t", label: "Duration", align: "r", render: r => `${Math.floor(r.secs / 60)}m ${r.secs % 60}s` },
        ]} />
      </Card>
    </div>
  );

  if (screen === "settings") return (
    <div className="grid g2" style={{ alignItems: "start" }}>
      <Card title="ROAS target" sub="Used for store status, insights and plays across the workspace">
        <div className="sim">
          <div className="row"><span>Target</span><span className="spacer" /><b style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{target.toFixed(1)}×</b></div>
          <input type="range" min={3} max={10} step={0.5} value={target} onChange={e => setTarget(Number(e.target.value))} aria-label="ROAS target" />
          <p className="note">Changes apply immediately to every screen.</p>
        </div>
      </Card>
      <Card title="Workspace">
        <dl className="kv"><dt>Brand</dt><dd>{BRAND.name}</dd><dt>Locations</dt><dd>42 across 9 markets</dd><dt>Time zone</dt><dd>America/New_York</dd><dt>Business day ends</dt><dd>3:00 AM</dd><dt>Week starts</dt><dd>Monday</dd><dt>Currency</dt><dd>USD</dd><dt>Campaign naming</dt><dd>NS | store token | type</dd></dl>
      </Card>
    </div>
  );

  return (
    <div className="stack">
      <Card title="Users" sub={`${USERS.length} people in this workspace`} flush>
        <DataTable rows={USERS} rowKey={r => r.e} cols={[
          { key: "n", label: "Name", render: r => <span className="store">{r.n}</span> },
          { key: "e", label: "Email", render: r => <span className="muted">{r.e}</span> },
          { key: "r", label: "Role", render: r => <Pill tone={r.r === "Admin" ? "info" : r.r === "Viewer" ? "neutral" : "violet"}>{r.r}</Pill> },
          { key: "s", label: "Store access", render: r => r.s },
          { key: "l", label: "Last active", render: r => (r.last === 0 ? "Today" : `${r.last} day${r.last > 1 ? "s" : ""} ago`) },
        ]} />
      </Card>
      <Card title="Page access by role" flush>
        <div className="tbl-wrap">
          <table className="tbl matrix">
            <thead><tr><th>Page</th>{Object.keys(ACCESS).map(r => <th key={r} style={{ textAlign: "center" }}>{r}</th>)}</tr></thead>
            <tbody>{PAGES.map((p, i) => <tr key={p}><td>{p}</td>{Object.values(ACCESS).map((a, j) => <td key={j} className="c">{a[i] ? <CheckCircle2 size={15} color="var(--basil)" /> : <span className="muted">—</span>}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
