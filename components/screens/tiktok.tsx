"use client";

import { useMemo, useState } from "react";
import { fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";
import { pct } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, TrendChart } from "@/components/ui/charts";
import { Card, Kpis, Legend, Pill, Seg } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/table";

const BG = ["linear-gradient(160deg,#e4502a,#5a1606)", "linear-gradient(160deg,#13223a,#3c4a5e)", "linear-gradient(160deg,#c98410,#4a2f03)", "linear-gradient(160deg,#0e9f9a,#063f3d)", "linear-gradient(160deg,#2f6fe4,#0f1d33)", "linear-gradient(160deg,#17936a,#0b3d2c)", "linear-gradient(160deg,#6e56cf,#22184f)"];

export function TikTok() {
  const { demo, cur, prev } = useApp();
  const [camp, setCamp] = useState<"all" | "follows" | "web">("all");
  const ads = demo.tiktokAds.filter(a => camp === "all" || (camp === "follows" ? a.campaign.includes("Follows") : a.campaign.includes("Web")));
  const ids = new Set(ads.map(a => a.id));
  const inR = (date: string, r: typeof cur) => date >= r.start && date <= r.end;
  const agg = (r: typeof cur) => demo.tiktok.filter(x => ids.has(x.adId) && inR(x.date, r)).reduce((a, x) => ({ spend: a.spend + x.spend, imp: a.imp + x.impressions, reach: a.reach + x.reach, views: a.views + x.views, v6: a.v6 + x.views6s, follows: a.follows + x.follows, likes: a.likes + x.likes, shares: a.shares + x.shares, clicks: a.clicks + x.clicks, conv: a.conv + x.conversions, rev: a.rev + x.revenue }), { spend: 0, imp: 0, reach: 0, views: 0, v6: 0, follows: 0, likes: 0, shares: 0, clicks: 0, conv: 0, rev: 0 });
  const t = agg(cur), p = agg(prev);
  const series = useMemo(() => {
    const m = new Map<string, { spend: number; follows: number }>();
    demo.dates.slice(cur.startIdx, cur.endIdx + 1).forEach(d => m.set(d, { spend: 0, follows: 0 }));
    demo.tiktok.forEach(x => { const e = m.get(x.date); if (e && ids.has(x.adId)) { e.spend += x.spend; e.follows += x.follows; } });
    return [...m.entries()].map(([date, v]) => ({ date, ...v }));
  }, [demo, cur, camp]); // eslint-disable-line react-hooks/exhaustive-deps
  const first = demo.tiktok.filter(x => ids.has(x.adId)).reduce((a, x) => (x.date < a ? x.date : a), demo.anchor);
  const adRows = ads.map((a, i) => ({ a, i, s: demo.tiktok.filter(x => x.adId === a.id && inR(x.date, cur)).reduce((acc, x) => ({ spend: acc.spend + x.spend, imp: acc.imp + x.impressions, views: acc.views + x.views, follows: acc.follows + x.follows, clicks: acc.clicks + x.clicks, conv: acc.conv + x.conversions }), { spend: 0, imp: 0, views: 0, follows: 0, clicks: 0, conv: 0 }) })).filter(r => r.s.spend > 0);
  return (
    <div className="stack">
      <div className="toolbar">
        <Seg value={camp} onChange={setCamp} options={[{ id: "all", label: "All campaigns" }, { id: "follows", label: "Consideration (follows)" }, { id: "web", label: "Web conversions" }]} />
        <span className="note">Fleet-level campaigns, not mapped to stores. Delivering since {fmtDate(first, { month: "short", day: "numeric", year: "numeric" })}.</span>
      </div>
      <Kpis items={[
        { label: "Spend", value: f.money(t.spend), delta: pct(t.spend, p.spend), invert: true },
        { label: "Impressions", value: f.compact(t.imp), delta: pct(t.imp, p.imp) },
        { label: "Video views", value: f.compact(t.views), note: `${f.pct(t.v6 / (t.views || 1), 0)} watched 6s+` },
        { label: "Follows", value: f.num(t.follows), delta: pct(t.follows, p.follows), info: "Follows is the result metric for the consideration campaign." },
        { label: "Cost per follow", value: f.money2(t.spend / (t.follows || 1)), delta: pct(t.spend / (t.follows || 1), p.spend / (p.follows || 1)), invert: true },
        { label: "CPM", value: f.money2((t.spend / (t.imp || 1)) * 1000) },
        ...(camp !== "follows" ? [{ label: "Web orders", value: f.num(t.conv), note: t.conv ? `${f.money2(t.spend / t.conv)} each` : undefined }] : []),
      ]} />
      <Card title="Spend and follows" sub="Daily" actions={<Legend items={[{ label: "Spend", color: C.ink }, { label: "Follows", color: C.teal, kind: "line" }]} />}>
        <TrendChart data={series} height={260} right={f.num} series={[{ key: "spend", label: "Spend", color: C.ink, type: "bar" }, { key: "follows", label: "Follows", color: C.teal, axis: "right" }]} />
      </Card>
      <Card title="Creative" sub="Each ad in the selected campaigns, best cost per follow first">
        <div className="creative-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}>
          {[...adRows].sort((x, y) => x.s.spend / (x.s.follows || 1) - y.s.spend / (y.s.follows || 1)).map(r => (
            <div className="creative" key={r.a.id}>
              <div className="thumb tall" style={{ background: BG[r.i % BG.length] }}><span>{r.a.name}</span></div>
              <div className="note">{r.a.hook}</div>
              <dl className="kv"><dt>Spend</dt><dd className="num">{f.money(r.s.spend)}</dd><dt>Follows</dt><dd className="num">{f.num(r.s.follows)}</dd><dt>Per follow</dt><dd className="num">{f.money2(r.s.spend / (r.s.follows || 1))}</dd><dt>View rate</dt><dd className="num">{f.pct(r.s.views / (r.s.imp || 1), 0)}</dd></dl>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Ads" flush>
        <DataTable rows={adRows} rowKey={r => r.a.id} initialSort={{ key: "sp", dir: "desc" }} cols={[
          { key: "n", label: "Ad", render: r => <span className="store">{r.a.name}</span>, sort: r => r.a.name },
          { key: "c", label: "Campaign", render: r => <span className="sub" style={{ color: "var(--ink-2)" }}>{r.a.campaign}</span> },
          { key: "o", label: "Goal", render: r => <Pill tone={r.a.cpa ? "info" : "violet"}>{r.a.cpa ? "Web orders" : "Follows"}</Pill> },
          { key: "sp", label: "Spend", align: "r", render: r => f.money(r.s.spend), sort: r => r.s.spend },
          { key: "im", label: "Impressions", align: "r", render: r => f.compact(r.s.imp), sort: r => r.s.imp },
          { key: "v", label: "Views", align: "r", render: r => f.compact(r.s.views), sort: r => r.s.views },
          { key: "fo", label: "Follows", align: "r", render: r => f.num(r.s.follows), sort: r => r.s.follows },
          { key: "cpf", label: "Per follow", align: "r", render: r => f.money2(r.s.spend / (r.s.follows || 1)), sort: r => r.s.spend / (r.s.follows || 1) },
          { key: "cv", label: "Web orders", align: "r", render: r => (r.a.cpa ? f.num(r.s.conv) : "—"), sort: r => r.s.conv },
        ]} />
      </Card>
    </div>
  );
}
