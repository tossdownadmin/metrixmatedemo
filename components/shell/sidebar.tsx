"use client";

import { BarChart3, Building2, ClipboardList, FileText, GitCompareArrows, Globe, History, LayoutDashboard, Lightbulb, Map as MapIcon, Music2, Plug, Puzzle, Receipt, Search as SearchIcon, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useApp, type Role, type Screen } from "@/components/context";

export const NAV: { group: string; items: { id: Screen; label: string; Icon: LucideIcon; adminOnly?: boolean }[] }[] = [
  { group: "Performance", items: [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "sales-comparison", label: "Sales Comparison", Icon: ClipboardList, adminOnly: true },
    { id: "source-comparison", label: "Source Comparison", Icon: GitCompareArrows, adminOnly: true },
    { id: "pos", label: "POS Analysis", Icon: Receipt },
  ] },
  { group: "Decisions", items: [
    { id: "insights", label: "Store Insights", Icon: Lightbulb },
    { id: "fleet", label: "Fleet Strategy", Icon: MapIcon, adminOnly: true },
    { id: "report", label: "Report Builder", Icon: FileText },
  ] },
  { group: "Channels", items: [
    { id: "meta", label: "Meta Ads Analytics", Icon: BarChart3 },
    { id: "google", label: "Google Ads Analytics", Icon: SearchIcon },
    { id: "tiktok", label: "TikTok Ads Analytics", Icon: Music2, adminOnly: true },
    { id: "ga4", label: "Web Analytics (GA4)", Icon: Globe },
  ] },
  { group: "Workspace", items: [
    { id: "connections", label: "Connections", Icon: Plug, adminOnly: true },
    { id: "connectors", label: "Connectors", Icon: Puzzle, adminOnly: true },
    { id: "sync", label: "Sync History", Icon: History, adminOnly: true },
    { id: "settings", label: "Settings", Icon: Settings, adminOnly: true },
    { id: "admin", label: "Admin", Icon: ShieldCheck, adminOnly: true },
  ] },
];
export const SCREEN_LABEL = Object.fromEntries(NAV.flatMap(g => g.items.map(i => [i.id, i.label]))) as Record<Screen, string>;
export function allowed(screen: Screen, role: Role) {
  const item = NAV.flatMap(g => g.items).find(i => i.id === screen);
  return role === "admin" || !item?.adminOnly;
}

export function Sidebar({ open, onNavigate, onRole }: { open: boolean; onNavigate: () => void; onRole: (r: Role) => void }) {
  const { screen, go, role, store } = useApp();
  return (
    <aside className={`side ${open ? "open" : ""}`} aria-label="Main navigation">
      <div className="side-brand">
        <div className="side-mark" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2l2.6 6.9L22 9.3l-5.7 4.7L18.2 22 12 17.8 5.8 22l1.9-8L2 9.3l7.4-.4z" fill="#fff" /></svg>
        </div>
        <div><strong>{BRAND.name}</strong><small>MetrixMate demo workspace</small></div>
      </div>
      <nav className="side-scroll">
        {NAV.map(g => {
          const items = g.items.filter(i => role === "admin" || !i.adminOnly);
          if (!items.length) return null;
          return (
            <div className="side-group" key={g.group}>
              <h4>{g.group}</h4>
              {items.map(i => (
                <button key={i.id} className={`side-link ${screen === i.id ? "active" : ""}`} aria-current={screen === i.id ? "page" : undefined} onClick={() => { go(i.id); onNavigate(); }}>
                  <i.Icon size={16} />{i.label}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="side-foot">
        <div className="role-switch" role="radiogroup" aria-label="Demo role">
          <button className={role === "admin" ? "on" : ""} onClick={() => onRole("admin")} role="radio" aria-checked={role === "admin"}>Admin view</button>
          <button className={role === "manager" ? "on" : ""} onClick={() => onRole("manager")} role="radio" aria-checked={role === "manager"}>Store manager</button>
        </div>
        <div className="side-user">
          <span className="av">{role === "admin" ? "JR" : "MK"}</span>
          <div><strong>{role === "admin" ? "Jordan Reyes" : "Maya Kowalski"}</strong><small>{role === "admin" ? "Director of Marketing" : <span className="row" style={{ gap: 4 }}><Building2 size={11} />{store?.name} manager</span>}</small></div>
        </div>
      </div>
    </aside>
  );
}
