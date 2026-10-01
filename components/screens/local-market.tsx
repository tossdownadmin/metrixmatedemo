"use client";

import { useMemo } from "react";
import { fmtDate } from "@/lib/dates";
import { BRAND } from "@/lib/brand";
import { f } from "@/lib/format";
import { localPeriod, localStanding, REVIEW_THEMES } from "@/lib/local-signals";
import { pct } from "@/lib/select";
import { useApp } from "@/components/context";
import { C, TrendChart } from "@/components/ui/charts";
import { BarList, Card, Kpis } from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/table";

const actions = (s: ReturnType<typeof localPeriod>) => s.calls + s.directions + s.websiteClicks;

export function LocalMarket() {
  const { demo, cur, prev, storeIdx, store, setStoreIdx } = useApp();
  const now = useMemo(() => localPeriod(demo, cur, storeIdx), [demo, cur, storeIdx]);
  const before = useMemo(() => localPeriod(demo, prev, storeIdx), [demo, prev, storeIdx]);
  const standings = useMemo(() => (store ? [store] : demo.stores).map(s => ({ store: s, ...localStanding(demo, s, cur.endIdx) })), [demo, store, cur.endIdx]);
  const own = store ? standings[0] : null;
  const allReviewCount = standings.reduce((n, s) => n + s.reviewCount, 0);
  const allStars = standings.reduce((n, s) => n + s.rating * s.reviewCount, 0);
  const rating = allReviewCount ? allStars / allReviewCount : 0;
  const positiveShare = now.reviewCount ? now.positive / now.reviewCount : 0;
  const socialShare = now.socialMentions ? now.favorableMentions / now.socialMentions : 0;
  const topConcern = [...REVIEW_THEMES].sort((a, b) => now.negativeThemes[b] - now.negativeThemes[a])[0];
  const nearby = own ? [
    { name: `${store!.name} · ${BRAND.short}`, rating: own.rating, reviews: own.reviewCount, distance: 0, yours: true },
    ...own.nearby.map(c => ({ ...c, yours: false })),
  ].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews) : [];

  return (
    <div className="stack">
      <p className="note">Demo data: local profile activity, reviews, social mentions and nearby competitors are fictional, not connected accounts.</p>
      <div className="local-kpis"><Kpis items={[
        { label: "Profile views", value: f.num(now.profileViews), delta: pct(now.profileViews, before.profileViews), note: "simulated local discovery" },
        { label: "Listing actions", value: f.num(actions(now)), delta: pct(actions(now), actions(before)), note: "calls, directions, website" },
        { label: "New reviews", value: f.num(now.reviewCount), delta: pct(now.reviewCount, before.reviewCount), note: `last ${cur.days} days` },
        { label: "Positive review share", value: f.pct(positiveShare, 0), note: "4–5 star modeled reviews" },
        { label: "Social mentions", value: f.num(now.socialMentions), delta: pct(now.socialMentions, before.socialMentions), note: `${f.pct(socialShare, 0)} favorable` },
      ]} /></div>

      <div className="grid g-2-1">
        <Card title="Local profile views" sub="Daily activity in the selected range; simulated listing data">
          <TrendChart data={now.days} height={260} left={f.compact} series={[{ key: "profileViews", label: "Profile views", color: C.sky, type: "bar" }]} />
        </Card>
        <Card title="Reputation snapshot" sub="Lifetime through the selected period end; review activity above is date-filtered">
          <div className="local-rating"><strong>{rating ? rating.toFixed(1) : "—"}<span>★</span></strong><div><b>{f.num(allReviewCount)} reviews</b><small>{own ? `#${own.rank} of 5 nearby by rating` : `${f.num(standings.length)} stores in the fleet`}</small></div></div>
          <div className="local-detail-row"><span>Calls</span><b>{f.num(now.calls)}</b></div>
          <div className="local-detail-row"><span>Direction requests</span><b>{f.num(now.directions)}</b></div>
          <div className="local-detail-row"><span>Website clicks</span><b>{f.num(now.websiteClicks)}</b></div>
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Review sentiment" sub={`${f.num(now.reviewCount)} new modeled reviews from ${fmtDate(cur.start)} to ${fmtDate(cur.end)}`}>
          <BarList items={[
            { label: "Positive · 4–5 stars", value: now.positive, display: f.num(now.positive), color: C.basil },
            { label: "Neutral · 3 stars", value: now.neutral, display: f.num(now.neutral), color: C.saffron },
            { label: "Negative · 1–2 stars", value: now.negative, display: f.num(now.negative), color: C.berry },
          ]} />
          <p className="note" style={{ marginTop: 16 }}>Most common low-rating theme: <b>{topConcern}</b> ({f.num(now.negativeThemes[topConcern])} mentions). This is a demo classification, not AI analysis of real reviews.</p>
        </Card>
        <Card title="Social signal" sub="Synthetic mentions and topics; no social listening connection">
          <div className="local-social"><strong>{f.num(now.socialMentions)}</strong><span>modeled mentions · {f.pct(socialShare, 0)} favorable</span></div>
          <TrendChart data={now.days} height={135} left={f.compact} series={[{ key: "socialMentions", label: "Mentions", color: C.ember, type: "area" }]} />
          <div className="local-themes">{[...REVIEW_THEMES].sort((a, b) => now.themes[b] - now.themes[a]).map(theme => <span key={theme}>{theme} <b>{f.num(now.themes[theme])}</b></span>)}</div>
        </Card>
      </div>

      {store ? (
        <Card title={`Nearby pizza competition · ${store.name}`} sub="Fictional businesses within roughly 2.5 miles; rating and review counts are illustrative, not live search results" flush>
          <DataTable rows={nearby} rowKey={r => r.name} cols={[
            { key: "rank", label: "Rank", render: (_, i) => <b>{i + 1}</b> },
            { key: "name", label: "Business", render: r => r.yours ? <span className="store">{r.name} (your store)</span> : r.name, sort: r => r.name },
            { key: "rating", label: "Rating", align: "r", render: r => `${r.rating.toFixed(1)} ★`, sort: r => r.rating },
            { key: "reviews", label: "Reviews", align: "r", render: r => f.num(r.reviews), sort: r => r.reviews },
            { key: "distance", label: "Distance", align: "r", render: r => r.yours ? "—" : `${r.distance.toFixed(1)} mi`, sort: r => r.distance },
          ]} />
        </Card>
      ) : (
        <Card title="Local reputation by store" sub="Click a store to see its nearby fictional competitors and review themes" flush>
          <DataTable rows={standings} rowKey={r => r.store.id} initialSort={{ key: "gap", dir: "asc" }} maxHeight={580} onRow={r => setStoreIdx(r.store.idx)} cols={[
            { key: "store", label: "Store", render: r => <span><span className="store">{r.store.name}</span> <span className="sub">{r.store.market}</span></span>, sort: r => r.store.name },
            { key: "rating", label: "Rating", align: "r", render: r => `${r.rating.toFixed(1)} ★`, sort: r => r.rating },
            { key: "reviews", label: "Lifetime reviews", align: "r", render: r => f.num(r.reviewCount), sort: r => r.reviewCount },
            { key: "median", label: "Nearby median", align: "r", render: r => f.num(r.medianReviews), sort: r => r.medianReviews },
            { key: "gap", label: "Review gap", align: "r", render: r => <span className={r.reviewCount >= r.medianReviews ? "pos" : "neg"}>{r.reviewCount >= r.medianReviews ? "+" : "−"}{f.num(Math.abs(r.reviewCount - r.medianReviews))}</span>, sort: r => r.reviewCount - r.medianReviews },
          ]} />
        </Card>
      )}

      <Card title="Recent review examples" sub="Fabricated sample comments; no real guest names or text">
        <div className="local-reviews">{now.recent.length ? now.recent.map(r => <div key={r.id}><div className="row"><span>{r.stars} ★</span><b>{r.theme}</b><span className="spacer" /><small>{demo.stores[r.storeIdx].name} · {fmtDate(r.date)}</small></div><p>“{r.text}”</p></div>) : <p className="note">No modeled reviews in this selection.</p>}</div>
      </Card>
    </div>
  );
}
