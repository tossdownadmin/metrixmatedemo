"use client";

import { useMemo, useState, type ReactNode } from "react";

export type Col<T> = { key: string; label: ReactNode; align?: "r" | "l"; render: (row: T, i: number) => ReactNode; sort?: (row: T) => number | string; foot?: ReactNode; width?: number };

export function DataTable<T>({ cols, rows, onRow, initialSort, maxHeight, empty = "No rows match the current filters.", rowKey }: { cols: Col<T>[]; rows: T[]; onRow?: (row: T) => void; initialSort?: { key: string; dir: "asc" | "desc" }; maxHeight?: number; empty?: string; rowKey?: (row: T, i: number) => string }) {
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = cols.find(c => c.key === sort.key);
    if (!col?.sort) return rows;
    const s = col.sort;
    return [...rows].sort((a, b) => {
      const x = s(a), y = s(b);
      const r = typeof x === "string" && typeof y === "string" ? x.localeCompare(y) : (x as number) - (y as number);
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, cols]);
  const hasFoot = cols.some(c => c.foot !== undefined);
  return (
    <div className="tbl-wrap" style={maxHeight ? { maxHeight } : undefined}>
      <table className="tbl">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} className={`${c.align === "r" ? "r" : ""} ${c.sort ? "sortable" : ""}`} style={c.width ? { width: c.width } : undefined}
                onClick={() => c.sort && setSort(prev => prev?.key === c.key ? { key: c.key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key: c.key, dir: typeof c.sort!(rows[0]) === "string" ? "asc" : "desc" })}
                aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                {c.label}{sort?.key === c.key && <span className="arrow">{sort.dir === "asc" ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && <tr><td colSpan={cols.length} className="muted" style={{ padding: 24, textAlign: "center" }}>{empty}</td></tr>}
          {sorted.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i} className={onRow ? "click" : ""} onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map(c => <td key={c.key} className={c.align === "r" ? "r num" : ""}>{c.render(r, i)}</td>)}
            </tr>
          ))}
        </tbody>
        {hasFoot && sorted.length > 0 && <tfoot><tr>{cols.map(c => <td key={c.key} className={c.align === "r" ? "r num" : ""}>{c.foot ?? ""}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}
