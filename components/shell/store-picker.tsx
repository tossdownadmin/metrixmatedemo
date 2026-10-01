"use client";

import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MARKETS } from "@/lib/data";
import { useApp } from "@/components/context";

export function StorePicker() {
  const { demo, storeIdx, setStoreIdx, store, role } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (role === "manager") return <span className="picker-btn" style={{ cursor: "default" }}><span className="row"><MapPin size={14} />{store?.name}</span><span className="note">Your store</span></span>;
  const ql = q.toLowerCase();
  return (
    <div className="picker" ref={ref}>
      <button className={`picker-btn ${store ? "scoped" : ""}`} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="listbox">
        <span className="row"><MapPin size={14} />{store ? store.name : `All stores (${demo.stores.length})`}</span>
        {store ? <X size={14} onClick={e => { e.stopPropagation(); setStoreIdx(null); }} aria-label="Clear store filter" /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="picker-pop" role="listbox">
          <div style={{ position: "relative" }}>
            <input className="input" autoFocus placeholder="Search stores or markets" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 30 }} />
            <Search size={14} style={{ position: "absolute", left: 21, top: 20, color: "var(--faint)" }} />
          </div>
          <div className="picker-list">
            <button className={storeIdx == null ? "on" : ""} onClick={() => { setStoreIdx(null); setOpen(false); }}>All stores <small>{demo.stores.length}</small></button>
            {MARKETS.map(m => {
              const list = demo.stores.filter(s => s.market === m && (`${s.name} ${s.city} ${m}`).toLowerCase().includes(ql));
              if (!list.length) return null;
              return (
                <div key={m}>
                  <h5>{m}</h5>
                  {list.map(s => (
                    <button key={s.id} className={storeIdx === s.idx ? "on" : ""} onClick={() => { setStoreIdx(s.idx); setOpen(false); setQ(""); }}>
                      <span>{s.name}</span>{storeIdx === s.idx ? <Check size={14} /> : <small>{s.city}, {s.state}</small>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
