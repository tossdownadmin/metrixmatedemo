"use client";

import { useMemo } from "react";
import { f } from "@/lib/format";
import { campaignStats, daily, fleetDailySpend, pct, type Campaign } from "@/lib/select";
import { useApp } from "@/components/context";

export function usePlatform(platform: "google" | "meta") {
  const { demo, cur, prev, storeIdx } = useApp();
  return useMemo(() => {
    const camps = campaignStats(demo, cur, platform, storeIdx);
    const prevCamps = campaignStats(demo, prev, platform, storeIdx);
    const sum = (c: Campaign[]) => c.reduce((a, x) => ({ spend: a.spend + x.spend, imp: a.imp + x.impressions, clicks: a.clicks + x.clicks, conv: a.conv + x.conversions, rev: a.rev + (x.inRoas ? x.revenue : 0), storeSpend: a.storeSpend + (x.inRoas ? x.spend : 0) }), { spend: 0, imp: 0, clicks: 0, conv: 0, rev: 0, storeSpend: 0 });
    const t = sum(camps), p = sum(prevCamps);
    const k = platform === "google" ? 0 : 1;
    const storeDaily = daily(demo, cur, storeIdx);
    const fleet = storeIdx == null ? fleetDailySpend(demo, cur, platform) : null;
    const series = storeDaily.map((s, i) => ({ date: s.date, spend: (k === 0 ? s.gSpend : s.mSpend) + (fleet ? fleet[i].spend : 0), revenue: k === 0 ? s.gRev : s.mRev }));
    return { camps, t, p, series, roas: t.storeSpend ? t.rev / t.storeSpend : 0, prevRoas: p.storeSpend ? p.rev / p.storeSpend : 0, d: (a: number, b: number) => pct(a, b) };
  }, [demo, cur, prev, storeIdx, platform]);
}

export const ratio = (a: number, b: number) => (b ? a / b : 0);
export { f };
