"use client";

import { BarChart3, ClipboardList, GitCompareArrows, Globe, LayoutDashboard, Lightbulb, Map as MapIcon, MapPinned, Music2, PlugZap, Receipt, Search as SearchIcon, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useApp, type Screen } from "@/components/context";

export const NAV: { group: string; items: { id: Screen; label: string; Icon: LucideIcon }[] }[] = [
  { group: "Performance", items: [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "sales-comparison", label: "Sales Comparison", Icon: ClipboardList },
    { id: "source-comparison", label: "Source Comparison", Icon: GitCompareArrows },
    { id: "pos", label: "POS Analysis", Icon: Receipt },
  ] },
  { group: "Decisions", items: [
    { id: "insights", label: "Store Insights", Icon: Lightbulb },
    { id: "local", label: "Local Market & Reputation", Icon: MapPinned },
    { id: "fleet", label: "Fleet Strategy", Icon: MapIcon },
  ] },
  { group: "Channels", items: [
    { id: "meta", label: "Meta Ads Analytics", Icon: BarChart3 },
    { id: "google", label: "Google Ads Analytics", Icon: SearchIcon },
    { id: "tiktok", label: "TikTok Ads Analytics", Icon: Music2 },
    { id: "ga4", label: "Web Analytics (GA4)", Icon: Globe },
  ] },
  { group: "Settings", items: [
    { id: "connectors", label: "Connectors", Icon: PlugZap },
  ] },
];
export const SCREEN_LABEL = Object.fromEntries(NAV.flatMap(g => g.items.map(i => [i.id, i.label]))) as Record<Screen, string>;
export function allowed(screen: Screen) { return NAV.some(g => g.items.some(i => i.id === screen)); }

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { screen, go } = useApp();
  return (
    <aside className={`side ${open ? "open" : ""}`} aria-label="Main navigation">
      <div className="side-brand">
        <div className="side-mark" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2l2.6 6.9L22 9.3l-5.7 4.7L18.2 22 12 17.8 5.8 22l1.9-8L2 9.3l7.4-.4z" fill="#fff" /></svg>
        </div>
        <div><strong>{BRAND.name}</strong><small>MetrixMate analytics demo</small></div>
      </div>
      <nav className="side-scroll">
        {NAV.map(g => {
          return (
            <div className="side-group" key={g.group}>
              <h4>{g.group}</h4>
              {g.items.map(i => (
                <button key={i.id} className={`side-link ${screen === i.id ? "active" : ""}`} aria-current={screen === i.id ? "page" : undefined} onClick={() => { go(i.id); onNavigate(); }}>
                  <i.Icon size={16} />{i.label}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="side-foot">
        <div className="side-user">
          <span className="av">JR</span>
          <div><strong>Jordan Reyes</strong><small>Director of Marketing</small></div>
        </div>
      </div>
    </aside>
  );
}
