"use client";

import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import { makeDemo } from "@/lib/data";
import { currentAnchor, fmtDate } from "@/lib/dates";
import { periodRanges, type PlatformFilter } from "@/lib/select";
import { AppCtx, MANAGER_STORE, type Ctx, type Role, type Screen } from "@/components/context";
import { allowed, SCREEN_LABEL, Sidebar } from "@/components/shell/sidebar";
import { StorePicker } from "@/components/shell/store-picker";
import { Seg } from "@/components/ui/primitives";
import { Dashboard } from "@/components/screens/dashboard";
import { SalesComparison } from "@/components/screens/sales-comparison";
import { SourceComparison } from "@/components/screens/source-comparison";
import { PosAnalysis } from "@/components/screens/pos";
import { Insights } from "@/components/screens/insights";
import { FleetStrategy } from "@/components/screens/fleet";
import { ReportBuilder } from "@/components/screens/report";
import { MetaAds } from "@/components/screens/meta";
import { GoogleAds } from "@/components/screens/google";
import { TikTok } from "@/components/screens/tiktok";
import { Ga4 } from "@/components/screens/ga4";
import { SystemScreen } from "@/components/screens/system";

const SUBTITLE: Record<Screen, string> = {
  dashboard: "Store ROAS against target, with POS sales and paid media in one view",
  "sales-comparison": "Every store against its previous period and the same period last year",
  "source-comparison": "Where orders come from, store by store",
  pos: "Sales, menu, customers and channels from the point of sale",
  insights: "What changed, why it matters and what to do next",
  fleet: "Plays that move the whole chain, ranked by impact",
  report: "Build a client-ready report and save it as PDF",
  meta: "Facebook and Instagram campaigns, tied back to store revenue",
  google: "Search and Performance Max campaigns, tied back to store revenue",
  tiktok: "Fleet-level TikTok campaigns and creative performance",
  ga4: "Website and ordering funnel from Google Analytics 4",
  connections: "Data sources feeding this workspace",
  connectors: "Sources you can connect to MetrixMate",
  sync: "Every data refresh, with row counts and run times",
  settings: "Workspace preferences and targets",
  admin: "Users, roles and page access",
};
const PLATFORM_SCREENS: Screen[] = ["dashboard", "insights"];
const NO_RANGE: Screen[] = ["sales-comparison", "connections", "connectors", "sync", "settings", "admin"];

function readHash(): Screen | null {
  const h = window.location.hash.replace(/^#\/?/, "");
  return h && h in SCREEN_LABEL ? (h as Screen) : null;
}

export default function App() {
  const [anchor] = useState(currentAnchor);
  const demo = useMemo(() => makeDemo(anchor), [anchor]);
  const [screen, setScreen] = useState<Screen>(() => readHash() ?? "dashboard");
  const [days, setDays] = useState(30);
  const [storeIdx, setStoreIdxRaw] = useState<number | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [role, setRoleRaw] = useState<Role>("admin");
  const [target, setTarget] = useState<number>(BRAND.defaultTargetRoas);
  const [navOpen, setNavOpen] = useState(false);

  const setStoreIdx = useCallback((i: number | null) => { if (role === "admin") setStoreIdxRaw(i); }, [role]);
  const go = useCallback((s: Screen, idx?: number | null) => {
    setScreen(s);
    if (idx !== undefined && role === "admin") setStoreIdxRaw(idx);
    window.history.replaceState(null, "", `#/${s}`);
    window.scrollTo({ top: 0 });
  }, [role]);
  const setRole = (r: Role) => {
    setRoleRaw(r);
    setStoreIdxRaw(r === "manager" ? MANAGER_STORE : null);
    if (!allowed(screen, r)) go("dashboard");
  };
  useEffect(() => {
    const h = () => { const s = readHash(); if (s) setScreen(s); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  useEffect(() => { document.title = `${SCREEN_LABEL[screen]} | ${BRAND.name}`; }, [screen]);

  const { cur, prev, ly } = useMemo(() => periodRanges(demo, days), [demo, days]);
  const ctx: Ctx = { demo, days, setDays, storeIdx, setStoreIdx, store: storeIdx != null ? demo.stores[storeIdx] : null, platform, setPlatform, role, target, setTarget, screen, go, cur, prev, ly };
  const safeScreen = allowed(screen, role) ? screen : "dashboard";

  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} onRole={setRole} />
        {navOpen && <div className="overlay" onClick={() => setNavOpen(false)} />}
        <div className="main">
          <header className="top">
            <button className="burger" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
            <div className="top-title">
              <h1>{SCREEN_LABEL[safeScreen]}</h1>
              <p>{SUBTITLE[safeScreen]}</p>
            </div>
            <div className="top-controls">
              {PLATFORM_SCREENS.includes(safeScreen) && (
                <select className="select" value={platform} onChange={e => setPlatform(e.target.value as PlatformFilter)} aria-label="Ad platform">
                  <option value="all">Google + Meta</option>
                  <option value="google">Google Ads only</option>
                  <option value="meta">Meta Ads only</option>
                </select>
              )}
              {!NO_RANGE.includes(safeScreen) && (
                <Seg label="Date range" value={days} onChange={setDays} options={[7, 14, 30, 60, 90].map(d => ({ id: d, label: `${d}D` }))} />
              )}
              {!["connections", "connectors", "sync", "settings", "admin", "tiktok"].includes(safeScreen) && <StorePicker />}
              <span className="fresh" title="Simulated data, refreshed daily"><i />Data through {fmtDate(demo.anchor)}</span>
            </div>
          </header>
          <main className="content">
            {safeScreen === "dashboard" && <Dashboard />}
            {safeScreen === "sales-comparison" && <SalesComparison />}
            {safeScreen === "source-comparison" && <SourceComparison />}
            {safeScreen === "pos" && <PosAnalysis />}
            {safeScreen === "insights" && <Insights />}
            {safeScreen === "fleet" && <FleetStrategy />}
            {safeScreen === "report" && <ReportBuilder />}
            {safeScreen === "meta" && <MetaAds />}
            {safeScreen === "google" && <GoogleAds />}
            {safeScreen === "tiktok" && <TikTok />}
            {safeScreen === "ga4" && <Ga4 />}
            {["connections", "connectors", "sync", "settings", "admin"].includes(safeScreen) && <SystemScreen screen={safeScreen} />}
          </main>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
