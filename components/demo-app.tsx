"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, ChevronDown, ClipboardList, FileText, GitCompareArrows, History, Layers, LayoutDashboard, Lightbulb, Menu, Music2, Plug, Puzzle, Receipt, Settings, ShieldCheck, X, type LucideIcon } from "lucide-react";
import { BRAND, currentAnchor, dateOffset, makeDemo, PLATFORMS, STORES, sum, type Daily, type Demo } from "@/lib/demo-data";
import { AnalyticsScreen } from "@/components/demo-screens";
import { SystemScreen } from "@/components/system-screens";

export type Screen = "store-roas" | "sales-report" | "source-comparison" | "pos-insights" | "insights" | "fleet-strategy" | "report" | "meta" | "google-ads" | "tiktok" | "ga4" | "connections" | "connectors" | "sync" | "settings" | "admin";
export type AppContext = { demo: Demo; rows: Daily[]; period: string; storeId: string; setStoreId: (id: string) => void; setScreen: (screen: Screen) => void; role: string; selectedPlatform: string };
export const fmt = {
  money: (n: number) => "$" + Math.round(n).toLocaleString(),
  compact: (n: number) => Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n),
  number: (n: number) => Math.round(n).toLocaleString(),
  decimal: (n: number) => n.toFixed(2),
  pct: (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`,
};
export const NAV: { group: string; items: { id: Screen; label: string; Icon: LucideIcon }[] }[] = [
  { group: "Overview", items: [
    { id: "store-roas", label: "Dashboard", Icon: LayoutDashboard },
    { id: "sales-report", label: "Sales Comparison", Icon: ClipboardList },
    { id: "source-comparison", label: "Source Comparison", Icon: GitCompareArrows },
  ] },
  { group: "Channels", items: [
    { id: "pos-insights", label: "POS Analysis", Icon: Receipt },
    { id: "insights", label: "Store Insights", Icon: Lightbulb },
    { id: "fleet-strategy", label: "Fleet Strategy", Icon: Layers },
    { id: "report", label: "Report Builder", Icon: FileText },
    { id: "meta", label: "Meta Ads Analytics", Icon: BarChart3 },
    { id: "google-ads", label: "Google Ads Analytics", Icon: BarChart3 },
    { id: "tiktok", label: "TikTok Ads Analytics", Icon: Music2 },
    { id: "ga4", label: "Web Analytics (GA4)", Icon: BarChart3 },
  ] },
  { group: "System", items: [
    { id: "connections", label: "Connections", Icon: Plug },
    { id: "connectors", label: "Connectors", Icon: Puzzle },
    { id: "sync", label: "Sync History", Icon: History },
    { id: "settings", label: "Settings", Icon: Settings },
    { id: "admin", label: "Admin", Icon: ShieldCheck },
  ] },
];

export function Card({ title, sub, children, action, className = "" }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return <section className={`ref-card ${className}`}><div className="ref-card-head"><div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{action}</div>{children}</section>;
}
export function Kpis({ values }: { values: { label: string; value: string; sub?: string; tone?: string }[] }) {
  return <div className="ref-kpis">{values.map(item => <div className={`ref-kpi ${item.tone || ""}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.sub || "Demo data"}</small></div>)}</div>;
}
export function Tabs({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: { id: string; label: string }[] }) {
  return <div className="ref-tabs" role="tablist">{options.map(option => <button role="tab" aria-selected={value === option.id} className={value === option.id ? "active" : ""} key={option.id} onClick={() => setValue(option.id)}>{option.label}</button>)}</div>;
}
export function Bars({ values, color = "#2563eb" }: { values: { label: string; value: number; display?: string }[]; color?: string }) {
  const max = Math.max(1, ...values.map(item => item.value));
  return <div className="ref-bars">{values.map(item => <div className="ref-bar-row" key={item.label}><div><span>{item.label}</span><b>{item.display ?? fmt.number(item.value)}</b></div><span className="ref-bar-track"><i style={{ width: `${Math.max(2, item.value / max * 100)}%`, background: color }} /></span></div>)}</div>;
}
export function Chart({ values, color = "#2563eb", compare }: { values: number[]; color?: string; compare?: number[] }) {
  const max = Math.max(1, ...values, ...(compare || []));
  const points = (series: number[]) => series.map((v, i) => `${i / Math.max(1, series.length - 1) * 100},${100 - v / max * 84}`).join(" ");
  return <div className="ref-chart"><div className="ref-chart-grid" /> <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Performance trend chart">{compare && <polyline fill="none" stroke="#9bb4eb" strokeWidth="1.5" strokeDasharray="3 2" points={points(compare)} />}<polyline fill="none" stroke={color} strokeWidth="2.4" points={points(values)} /></svg><div className="ref-chart-axis"><span>Start</span><span>Middle</span><span>Latest</span></div></div>;
}
export function DataTable({ headers, rows, onRow }: { headers: string[]; rows: (string | number | React.ReactNode)[][]; onRow?: (index: number) => void }) {
  return <div className="ref-table-scroll"><table className="ref-table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} onClick={() => onRow?.(i)} className={onRow ? "clickable" : ""}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export default function DemoApp({ anchor }: { anchor: string }) {
  const [liveAnchor, setLiveAnchor] = useState(anchor);
  useEffect(() => { setLiveAnchor(currentAnchor()); }, []);
  const demo = useMemo(() => makeDemo(liveAnchor), [liveAnchor]);
  const [screen, setScreen] = useState<Screen>("store-roas");
  const [storeId, setStoreId] = useState("all");
  const [period, setPeriod] = useState("30");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [role, setRole] = useState("Admin");
  const [mobile, setMobile] = useState(false);
  const filtered = useMemo(() => demo.daily.filter(row => (storeId === "all" || row.storeId === storeId) && row.date >= dateOffset(liveAnchor, 1 - Number(period))).map(row => {
    if (selectedPlatform === "all") return row;
    const index = PLATFORMS.indexOf(selectedPlatform as typeof PLATFORMS[number]);
    const spendShare = [0.48, 0.36, 0.16][index];
    const revenueShare = [0.52, 0.36, 0.12][index];
    return { ...row, adSpend: row.adSpend * spendShare, attributedRevenue: row.attributedRevenue * revenueShare, attributedOrders: Math.round(row.attributedOrders * revenueShare) };
  }), [demo, storeId, period, liveAnchor, selectedPlatform]);
  const title = NAV.flatMap(group => group.items).find(item => item.id === screen)?.label || "Dashboard";
  const context: AppContext = { demo, rows: filtered, period, storeId, setStoreId, setScreen, role, selectedPlatform };
  const total = sum(filtered);
  return <div className="ref-shell">
    <aside className={`ref-sidebar ${mobile ? "open" : ""}`}><div className="ref-logo"><span className="ref-mark">M</span><div><strong>Metrix<span>Mate</span></strong><small>{BRAND.name} · Demo</small></div><button className="ref-mobile-close" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="ref-sidebar-scroll">{NAV.map(group => <div className="ref-nav-group" key={group.group}><div className="ref-nav-heading">{group.group}</div>{group.items.filter(item => group.group !== "System" || role === "Admin").map(item => <button className={screen === item.id ? "active" : ""} key={item.id} onClick={() => { setScreen(item.id as Screen); if (item.id === "meta") setSelectedPlatform("Meta Ads"); if (item.id === "google-ads") setSelectedPlatform("Google Ads"); if (item.id === "tiktok") setSelectedPlatform("TikTok Ads"); setMobile(false); }}><item.Icon size={15}/>{item.label}</button>)}</div>)}</div>
      <div className="ref-profile"><span>NS</span><div><strong>Northstar Demo</strong><small>{role} view</small></div><ChevronDown size={14}/></div>
    </aside>
    <main className="ref-main"><header className="ref-top"><button className="ref-mobile-menu" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={20}/></button><div className="ref-top-title"><strong>{title}</strong><span>Northstar Slice Co. · Fictional data</span></div><div className="ref-top-controls"><select aria-label="Store filter" value={storeId} onChange={e => setStoreId(e.target.value)}><option value="all">All Stores (42)</option>{STORES.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select><select aria-label="Platform filter" value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)}><option value="all">All Platforms</option><option>Google Ads</option><option>Meta Ads</option><option>TikTok Ads</option></select><label className="ref-date"><CalendarDays size={14}/><select aria-label="Date range" value={period} onChange={e => setPeriod(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option></select></label><div className="ref-fresh"><i/>Demo · {liveAnchor}</div><select aria-label="Demo role" value={role} onChange={e => { setRole(e.target.value); if (e.target.value !== "Admin" && ["connections","connectors","sync","settings","admin"].includes(screen)) setScreen("store-roas"); }}><option>Admin</option><option>Store Manager</option></select></div></header>
      <div className="ref-content"><div className="ref-data-note">SIMULATED DATA · {fmt.number(total.orders)} orders in selected range · No live integrations</div>{["connections","connectors","sync","settings","admin"].includes(screen) ? <SystemScreen screen={screen} context={context}/> : <AnalyticsScreen screen={screen} context={context}/>}</div>
    </main>
  </div>;
}
