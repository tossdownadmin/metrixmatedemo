"use client";

import { useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { fmtDate } from "@/lib/dates";
import { f } from "@/lib/format";

export const C = {
  ink: "#13223a", ember: "#e4502a", basil: "#17936a", saffron: "#c98410", berry: "#c2364a",
  sky: "#2f6fe4", violet: "#6e56cf", teal: "#0e9f9a", grey: "#b7c0cd", line: "#e2e7ee", muted: "#6b778a",
};
export const SOURCE_COLORS = ["#13223a", "#2f6fe4", "#6e56cf", "#e4502a", "#c98410"];

const axisProps = { tick: { fontSize: 11.5, fill: C.muted }, axisLine: false, tickLine: false } as const;

type Fmt = (n: number) => string;
export type SeriesDef = { key: string; label: string; color: string; type?: "area" | "line" | "bar"; axis?: "left" | "right"; dashed?: boolean; stack?: string };

function TipBox({ active, payload, label, fmts, labelFmt }: { active?: boolean; payload?: { dataKey: string; value: number; color: string; name: string }[]; label?: string; fmts: Record<string, Fmt>; labelFmt?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1d33", color: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, boxShadow: "0 8px 20px rgba(15,29,51,.25)", minWidth: 160 }}>
      <div style={{ color: "#9fb0c8", marginBottom: 5 }}>{labelFmt ? labelFmt(String(label)) : label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />{p.name}</span>
          <b style={{ fontVariantNumeric: "tabular-nums" }}>{(fmts[p.dataKey] ?? f.num)(p.value)}</b>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ data, series, height = 260, left = f.moneyK, right, xKey = "date", xFmt, refLine }: { data: Record<string, number | string>[]; series: SeriesDef[]; height?: number; left?: Fmt; right?: Fmt; xKey?: string; xFmt?: (v: string) => string; refLine?: { y: number; label: string; axis?: "left" | "right" } }) {
  const fmts: Record<string, Fmt> = {};
  series.forEach(s => { fmts[s.key] = s.axis === "right" && right ? right : left; });
  const xf = xFmt ?? ((v: string) => fmtDate(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: right ? 4 : 8, left: 0, bottom: 0 }}>
        <defs>
          {series.filter(s => s.type === "area").map(s => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={C.line} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={xf} minTickGap={28} />
        <YAxis yAxisId="left" {...axisProps} tickFormatter={left} width={56} />
        {right && <YAxis yAxisId="right" orientation="right" {...axisProps} tickFormatter={right} width={48} />}
        <Tooltip content={<TipBox fmts={fmts} labelFmt={l => (xKey === "date" ? fmtDate(l, { weekday: "short", month: "short", day: "numeric" }) : l)} />} cursor={{ stroke: C.grey, strokeDasharray: "3 3" }} />
        {refLine && <ReferenceLine yAxisId={refLine.axis ?? "left"} y={refLine.y} stroke={C.saffron} strokeDasharray="5 4" label={{ value: refLine.label, position: "insideTopRight", fill: C.saffron, fontSize: 11.5 }} />}
        {series.map(s => {
          const common = { dataKey: s.key, name: s.label, yAxisId: s.axis ?? "left", isAnimationActive: false } as const;
          if (s.type === "bar") return <Bar key={s.key} {...common} fill={s.color} radius={s.stack ? 0 : [3, 3, 0, 0]} stackId={s.stack} maxBarSize={22} />;
          if (s.type === "area") return <Area key={s.key} {...common} type="monotone" stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} dot={false} />;
          return <Line key={s.key} {...common} type="monotone" stroke={s.color} strokeWidth={s.dashed ? 1.6 : 2} strokeDasharray={s.dashed ? "5 4" : undefined} dot={false} />;
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({ data, keys, height = 280, fmt = f.moneyK, catKey = "name", catWidth = 120 }: { data: Record<string, number | string>[]; keys: { key: string; label: string; color: string }[]; height?: number; fmt?: Fmt; catKey?: string; catWidth?: number }) {
  const fmts: Record<string, Fmt> = {}; keys.forEach(k => (fmts[k.key] = fmt));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={C.line} />
        <XAxis type="number" {...axisProps} tickFormatter={fmt} />
        <YAxis type="category" dataKey={catKey} {...axisProps} width={catWidth} tick={{ fontSize: 12, fill: C.ink }} />
        <Tooltip content={<TipBox fmts={fmts} />} cursor={{ fill: "rgba(19,34,58,0.04)" }} />
        {keys.map(k => <Bar key={k.key} dataKey={k.key} name={k.label} stackId="s" fill={k.color} isAnimationActive={false} maxBarSize={18} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 200, fmt = f.money, center }: { data: { name: string; value: number; color: string }[]; height?: number; fmt?: Fmt; center?: { value: string; label: string } }) {
  return (
    <div style={{ position: "relative", height }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={1.5} stroke="none" isAnimationActive={false}>
            {data.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e7ee", fontSize: 12.5 }} />
        </PieChart>
      </ResponsiveContainer>
      {center && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", textAlign: "center" }}><div><div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600 }}>{center.value}</div><div className="note">{center.label}</div></div></div>}
    </div>
  );
}

export function ScatterPlot({ data, xLabel, yLabel, xFmt, yFmt, height = 300, onClick, refX, refY }: { data: { x: number; y: number; z?: number; name: string; id: string; color?: string }[]; xLabel: string; yLabel: string; xFmt: Fmt; yFmt: Fmt; height?: number; onClick?: (id: string) => void; refX?: number; refY?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 16, bottom: 18, left: 0 }}>
        <CartesianGrid stroke={C.line} />
        <XAxis type="number" dataKey="x" name={xLabel} {...axisProps} tickFormatter={xFmt} label={{ value: xLabel, position: "insideBottom", offset: -10, fontSize: 11.5, fill: C.muted }} domain={["auto", "auto"]} />
        <YAxis type="number" dataKey="y" name={yLabel} {...axisProps} tickFormatter={yFmt} width={56} domain={["auto", "auto"]} />
        <ZAxis type="number" dataKey="z" range={[40, 260]} />
        {refX != null && <ReferenceLine x={refX} stroke={C.grey} strokeDasharray="4 4" />}
        {refY != null && <ReferenceLine y={refY} stroke={C.grey} strokeDasharray="4 4" />}
        <Tooltip cursor={false} content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const p = payload[0].payload as { name: string; x: number; y: number };
          return <div style={{ background: "#0f1d33", color: "#fff", borderRadius: 8, padding: "8px 11px", fontSize: 12.5 }}><b>{p.name}</b><div>{xLabel}: {xFmt(p.x)}</div><div>{yLabel}: {yFmt(p.y)}</div></div>;
        }} />
        <Scatter data={data} isAnimationActive={false} onClick={(d: { id?: string }) => d?.id && onClick?.(d.id)} style={{ cursor: onClick ? "pointer" : "default" }}>
          {data.map(d => <Cell key={d.id} fill={d.color ?? C.sky} fillOpacity={0.8} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function Spark({ values, color = C.ink, height = 34 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`).join(" ");
  return <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }} aria-hidden><polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" /></svg>;
}

/** Heatmap grid. rows = labels, cols = labels, values[row][col]. */
export function Heatmap({ rows, cols, values, fmt = f.num, color = "19,34,58" }: { rows: string[]; cols: string[]; values: number[][]; fmt?: Fmt; color?: string }) {
  const max = Math.max(1e-9, ...values.flat());
  return (
    <div style={{ overflowX: "auto" }}>
      <div className="heat" style={{ gridTemplateColumns: `44px repeat(${cols.length}, minmax(28px, 1fr))`, minWidth: 44 + cols.length * 31 }}>
        <span />
        {cols.map(c => <span key={c} className="hh">{c}</span>)}
        {rows.map((r, i) => [
          <span key={`l${r}`} className="hl">{r}</span>,
          ...cols.map((c, j) => <span key={`${r}${c}`} className="hc" title={`${r} ${c}: ${fmt(values[i][j])}`} style={{ background: `rgba(${color},${0.05 + 0.92 * Math.pow(values[i][j] / max, 0.85)})` }} />),
        ])}
      </div>
    </div>
  );
}

/** Signature visual: every store plotted on a ROAS ruler with the target line. */
export function RoasRuler({ stores, target, onPick }: { stores: { id: string; name: string; roas: number; spend: number }[]; target: number; onPick: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 1000, H = 178, pad = 18, axisY = 140, mid = 82;
  const maxX = Math.max(14, Math.ceil(Math.max(...stores.map(s => s.roas), target) + 1));
  const x = (v: number) => pad + (Math.min(v, maxX) / maxX) * (W - pad * 2);
  const maxSpend = Math.max(...stores.map(s => s.spend), 1);
  // simple beeswarm stacking
  const placed: { s: (typeof stores)[number]; cx: number; cy: number; r: number }[] = [];
  [...stores].sort((a, b) => b.spend - a.spend).forEach(s => {
    const r = 4 + 5.5 * Math.sqrt(s.spend / maxSpend);
    const cx = x(s.roas);
    let cy = mid;
    for (let k = 1; k < 40; k++) {
      const hit = placed.some(p => Math.hypot(p.cx - cx, p.cy - cy) < p.r + r + 1);
      if (!hit) break;
      cy = mid + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 5;
      cy = Math.max(30 + r, Math.min(axisY - 6 - r, cy));
    }
    placed.push({ s, cx, cy, r });
  });
  const h = placed.find(p => p.s.id === hover);
  const ticks = Array.from({ length: Math.floor(maxX / 2) + 1 }, (_, i) => i * 2);
  return (
    <div>
      <div className="ruler-wrap">
      <svg className="ruler" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Store ROAS distribution against a ${target}× target`}>
        <rect x={x(target)} y={26} width={W - pad - x(target)} height={axisY - 26} fill="#e6f4ee" opacity={0.6} rx={4} />
        <line x1={pad} x2={W - pad} y1={axisY} y2={axisY} stroke={C.line} strokeWidth={2} />
        {ticks.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={axisY} y2={axisY + 6} stroke={C.grey} /><text x={x(t)} y={axisY + 22} textAnchor="middle" fontSize={12} fill={C.muted}>{t}×</text></g>)}
        <line x1={x(target)} x2={x(target)} y1={22} y2={axisY + 6} stroke={C.saffron} strokeWidth={2} strokeDasharray="5 4" />
        <text x={x(target) + 6} y={18} fontSize={12.5} fill="#9a6408" fontWeight={600}>{target}× target</text>
        {placed.map(p => (
          <circle key={p.s.id} className="dotc" cx={p.cx} cy={p.cy} r={hover === p.s.id ? p.r + 2 : p.r}
            fill={p.s.roas >= target ? C.basil : p.s.roas >= target * 0.6 ? C.saffron : C.berry} fillOpacity={hover && hover !== p.s.id ? 0.35 : 0.85} stroke="#fff" strokeWidth={1.5}
            onMouseEnter={() => setHover(p.s.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick(p.s.id)}>
            <title>{`${p.s.name}: ${f.x(p.s.roas)} on ${f.money(p.s.spend)} spend`}</title>
          </circle>
        ))}

      </svg>
      </div>
      <div className="ruler-tip">{h ? <><b>{h.s.name}</b> · {f.x(h.s.roas)} ROAS on {f.money(h.s.spend)} spend</> : <span className="muted">Dot size shows ad spend. Hover for details, click to open the store.</span>}</div>
    </div>
  );
}
