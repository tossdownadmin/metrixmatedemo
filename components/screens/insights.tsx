"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fleetFindings, storeFindings, type Finding } from "@/lib/insights";
import { f } from "@/lib/format";
import { byStore, slice, totals } from "@/lib/select";
import { useApp } from "@/components/context";
import { Card, Pill } from "@/components/ui/primitives";
import { ScopeBanner } from "@/components/ui/scope";

const STEPS = ["Loading POS sales", "Matching orders to paid sessions", "Mapping campaigns to stores", "Comparing to the prior period", "Ranking stores by ROAS", "Checking order sources", "Reading menu mix", "Scoring opportunities", "Writing recommendations"];
let played = false;
const SEV_LABEL = { critical: "Act now", warning: "Watch", opportunity: "Opportunity", info: "Note" } as const;
const SEV_TONE = { critical: "bad", warning: "watch", opportunity: "good", info: "info" } as const;

export function Insights() {
  const { demo, cur, prev, target, platform, storeIdx, setStoreIdx } = useApp();
  const [step, setStep] = useState(played ? STEPS.length : 0);
  useEffect(() => {
    if (step >= STEPS.length) { played = true; return; }
    const id = setTimeout(() => setStep(s => s + 1), 320);
    return () => clearTimeout(id);
  }, [step]);
  const findings = useMemo<Finding[]>(() => (storeIdx == null ? fleetFindings(demo, cur, prev, target, platform) : storeFindings(demo, cur, prev, target, platform, storeIdx)), [demo, cur, prev, target, platform, storeIdx]);

  if (step < STEPS.length) {
    return (
      <Card title="Analyzing the last period" sub="This takes a few seconds the first time">
        <div className="checklist">
          {STEPS.map((s, i) => <div key={s} className={i < step ? "done" : i === step ? "now" : ""}><span className="tick">{i < step && <Check size={11} strokeWidth={3} />}</span>{s}</div>)}
        </div>
      </Card>
    );
  }
  const counts = findings.reduce<Record<string, number>>((a, x) => ((a[x.severity] = (a[x.severity] ?? 0) + 1), a), {});
  return (
    <div className="stack">
      <ScopeBanner />
      <div className="row wrap">
        {(["critical", "warning", "opportunity", "info"] as const).map(s => counts[s] ? <Pill key={s} tone={SEV_TONE[s]}>{counts[s]} {SEV_LABEL[s].toLowerCase()}</Pill> : null)}
        <span className="note">{findings.length} findings for the last {cur.days} days, most urgent first</span>
      </div>
      <div className={storeIdx == null ? "grid g-2-1" : "stack"} style={{ alignItems: "start" }}>
        <div className="stack" style={{ gap: 12 }}>
          {findings.map(x => (
            <article key={x.id} className={`finding sev-${x.severity}`}>
              <div className="rail" />
              <div className="finding-body">
                <div className="row"><Pill tone={SEV_TONE[x.severity]}>{SEV_LABEL[x.severity]}</Pill>{x.impact && <span className="note" style={{ marginLeft: "auto" }}>{x.impact}</span>}</div>
                <h4>{x.title}</h4>
                <p>{x.body}</p>
                <div className="do"><strong>Do this</strong><span>{x.action}</span></div>
                {x.stores && storeIdx == null && <div className="chips">{x.stores.map(s => <button key={s.idx} className="chip" onClick={() => setStoreIdx(s.idx)}>{s.label}</button>)}</div>}
              </div>
            </article>
          ))}
        </div>
        {storeIdx == null && <Simulator />}
      </div>
    </div>
  );
}

function Simulator() {
  const { demo, cur, target, platform } = useApp();
  const [share, setShare] = useState(25);
  const stores = byStore(demo, cur, platform).filter(s => s.t.spend > 0 && !s.isNew);
  const low = stores.filter(s => s.t.roas < target * 0.6), high = stores.filter(s => s.t.roas >= target);
  const T = totals(slice(demo, cur), platform);
  const lowSpend = low.reduce((a, s) => a + s.t.spend, 0), lowRoas = low.reduce((a, s) => a + s.t.rev, 0) / (lowSpend || 1);
  const highSpend = high.reduce((a, s) => a + s.t.spend, 0), highRoas = high.reduce((a, s) => a + s.t.rev, 0) / (highSpend || 1);
  const moved = lowSpend * (share / 100);
  const lost = moved * lowRoas, gained = moved * highRoas * 0.7;
  const newRoas = (T.rev - lost + gained) / (T.spend || 1);
  return (
    <Card title="Budget reallocation" sub="Move spend from stores under 60% of target to stores at target" info="Projection only. Added spend at the receiving stores is assumed to return 70% of their current ROAS, to account for diminishing returns.">
      <div className="sim">
        <dl className="kv" style={{ gridTemplateColumns: "1fr auto" }}>
          <dt>Giving stores ({low.length})</dt><dd className="num">{f.money(lowSpend)} at {f.x1(lowRoas)}</dd>
          <dt>Receiving stores ({high.length})</dt><dd className="num">{f.money(highSpend)} at {f.x1(highRoas)}</dd>
        </dl>
        <label>
          <div className="row"><span>Share of budget to move</span><span className="spacer" /><b className="num">{share}%</b></div>
          <input type="range" min={0} max={60} step={5} value={share} onChange={e => setShare(Number(e.target.value))} aria-label="Share of budget to move" />
        </label>
        <div className="sim-out">
          <div><strong className="num">{f.money(moved)}</strong><span>Spend moved</span></div>
          <div><strong className="num" style={{ color: "var(--basil)" }}>+{f.money(gained - lost)}</strong><span>Attributed revenue</span></div>
          <div><strong className="num">{f.x1(newRoas)}</strong><span>Fleet ROAS, from {f.x1(T.roas)}</span></div>
        </div>
        <p className="note">Same total budget. Run it as a two-week test before committing.</p>
      </div>
    </Card>
  );
}
