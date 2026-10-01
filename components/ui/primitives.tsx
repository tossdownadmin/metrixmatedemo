"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { f } from "@/lib/format";

export function Card({ title, sub, info, actions, children, flush, className = "" }: { title?: ReactNode; sub?: ReactNode; info?: string; actions?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}{info && <Info tip={info} />}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div className="actions">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${flush ? "flush" : ""}`}>{children}</div>
    </section>
  );
}

export function Info({ tip }: { tip: string }) {
  return <i className="infodot" tabIndex={0} data-tip={tip} aria-label={tip}>i</i>;
}

export function Delta({ value, invert = false, suffix }: { value: number | null; invert?: boolean; suffix?: string }) {
  if (value == null || !isFinite(value)) return <span className="delta flat">New</span>;
  const good = invert ? value < 0 : value > 0;
  const cls = Math.abs(value) < 0.05 ? "flat" : good ? "up" : "down";
  const Icon = Math.abs(value) < 0.05 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`delta ${cls}`}><Icon size={13} strokeWidth={2.4} />{f.delta(value).replace(/^[+−]/, "")}{suffix}</span>;
}

export type KpiItem = { label: string; value: string; delta?: number | null; invert?: boolean; note?: string; info?: string };
export function Kpis({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpis">
      {items.map(k => (
        <div className="kpi" key={k.label}>
          <div className="lbl">{k.label}{k.info && <Info tip={k.info} />}</div>
          <div className="val num">{k.value}</div>
          <div className="sub">{k.delta !== undefined && <Delta value={k.delta} invert={k.invert} />}{k.note && <span>{k.note}</span>}</div>
        </div>
      ))}
    </div>
  );
}

export function Seg<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(o => <button key={String(o.id)} role="radio" aria-checked={o.id === value} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="tabs" role="tablist">
      {options.map(o => <button key={o.id} role="tab" aria-selected={o.id === value} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "good" | "watch" | "bad" | "info" | "neutral" | "violet"; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function RoasPill({ roas, target }: { roas: number; target: number }) {
  if (!roas) return <Pill>No spend</Pill>;
  const tone = roas >= target ? "good" : roas >= target * 0.6 ? "watch" : "bad";
  return <Pill tone={tone}>{f.x(roas)}</Pill>;
}

export function BarList({ items, color = "var(--ink)", onClick, max: maxIn }: { items: { label: string; value: number; display: string; color?: string; sub?: string; id?: string }[]; color?: string; onClick?: (id: string) => void; max?: number }) {
  const max = maxIn ?? Math.max(1e-9, ...items.map(i => i.value));
  return (
    <div className="barlist">
      {items.map(i => (
        <div className="b-row" key={i.label}>
          {onClick && i.id ? <button onClick={() => onClick(i.id!)}>{i.label}</button> : <span>{i.label}{i.sub && <span className="muted"> · {i.sub}</span>}</span>}
          <b className="num">{i.display}</b>
          <div className="b-track"><i style={{ width: `${Math.max(1.5, (i.value / max) * 100)}%`, background: i.color ?? color }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; kind?: "box" | "line" | "dash" }[] }) {
  return (
    <div className="legend">
      {items.map(i => <span key={i.label}><i className={i.kind === "line" ? "line" : i.kind === "dash" ? "dash" : ""} style={i.kind === "dash" ? { color: i.color } : { background: i.color }} />{i.label}</span>)}
    </div>
  );
}

export function CellBar({ value, max, color, display }: { value: number; max: number; color: string; display: string }) {
  return <div className="cellbar"><b className="num" style={{ fontWeight: 500 }}>{display}</b><span><i style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color }} /></span></div>;
}
