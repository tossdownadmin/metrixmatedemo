"use client";

import { Menu } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import { makeDemo } from "@/lib/data";
import { currentAnchor, fmtDate } from "@/lib/dates";
import { periodRanges } from "@/lib/select";
import { AppCtx, type Ctx, type Screen } from "@/components/context";
import { allowed, SCREEN_LABEL, Sidebar } from "@/components/shell/sidebar";
import { StorePicker } from "@/components/shell/store-picker";
import { Seg } from "@/components/ui/primitives";
import { Dashboard } from "@/components/screens/dashboard";
import { SalesComparison } from "@/components/screens/sales-comparison";
import { SourceComparison } from "@/components/screens/source-comparison";
import { PosAnalysis } from "@/components/screens/pos";
import { Insights } from "@/components/screens/insights";
import { FleetStrategy } from "@/components/screens/fleet";
import { Connectors } from "@/components/screens/connectors";
import { MetaAds } from "@/components/screens/meta";
import { GoogleAds } from "@/components/screens/google";
import { TikTok } from "@/components/screens/tiktok";
import { Ga4 } from "@/components/screens/ga4";
import { LocalMarket } from "@/components/screens/local-market";

const SUBTITLE: Record<Screen, string> = {
  dashboard: "Store ROAS against target, with POS sales and paid media in one view",
  "sales-comparison": "Every store against its previous period and the same period last year",
  "source-comparison": "Where orders come from, store by store",
  pos: "Sales, menu, customers and channels from the point of sale",
  insights: "What changed, why it matters and what to do next",
  local: "Local visibility, guest feedback and nearby competition",
  fleet: "Plays that move the whole chain, ranked by impact",
  meta: "Facebook and Instagram campaigns, tied back to store revenue",
  google: "Search and Performance Max campaigns, tied back to store revenue",
  tiktok: "Fleet-level TikTok campaigns and creative performance",
  ga4: "Website and ordering funnel from Google Analytics 4",
  connectors: "Available data sources and their demo coverage",
};

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
  const [target, setTarget] = useState<number>(BRAND.defaultTargetRoas);
  const [navOpen, setNavOpen] = useState(false);

  const setStoreIdx = useCallback((i: number | null) => setStoreIdxRaw(i), []);
  const go = useCallback((s: Screen, idx?: number | null) => {
    setScreen(s);
    if (idx !== undefined) setStoreIdxRaw(idx);
    window.history.replaceState(null, "", `#/${s}`);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const h = () => { setScreen(readHash() ?? "dashboard"); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  useEffect(() => { document.title = `${SCREEN_LABEL[screen]} | ${BRAND.name}`; }, [screen]);

  const { cur, prev, ly } = useMemo(() => periodRanges(demo, days), [demo, days]);
  const ctx: Ctx = { demo, days, setDays, storeIdx, setStoreIdx, store: storeIdx != null ? demo.stores[storeIdx] : null, platform: "all", target, setTarget, screen, go, cur, prev, ly };
  const safeScreen = allowed(screen) ? screen : "dashboard";

  return (
    <AppCtx.Provider value={ctx}>
      <div className="shell">
        <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
        {navOpen && <div className="overlay" onClick={() => setNavOpen(false)} />}
        <div className="main">
          <header className="top">
            <button className="burger" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
            <div className="top-title">
              <h1>{SCREEN_LABEL[safeScreen]}</h1>
              <p>{SUBTITLE[safeScreen]}</p>
            </div>
            {safeScreen !== "connectors" && <div className="top-controls">
              <Seg label="Date range" value={days} onChange={setDays} options={[7, 14, 30, 60, 90].map(d => ({ id: d, label: `${d}D` }))} />
              {!["tiktok", "fleet"].includes(safeScreen) && <StorePicker />}
              <span className="fresh" title="Simulated data, refreshed daily"><i />Data through {fmtDate(demo.anchor)}</span>
            </div>}
          </header>
          <main className="content">
            {safeScreen === "dashboard" && <Dashboard />}
            {safeScreen === "sales-comparison" && <SalesComparison />}
            {safeScreen === "source-comparison" && <SourceComparison />}
            {safeScreen === "pos" && <PosAnalysis />}
            {safeScreen === "insights" && <Insights />}
            {safeScreen === "local" && <LocalMarket />}
            {safeScreen === "fleet" && <FleetStrategy />}
            {safeScreen === "connectors" && <Connectors />}
            {safeScreen === "meta" && <MetaAds />}
            {safeScreen === "google" && <GoogleAds />}
            {safeScreen === "tiktok" && <TikTok />}
            {safeScreen === "ga4" && <Ga4 />}
          </main>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
