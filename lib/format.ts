const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const f = {
  money: (n: number) => `${n < 0 ? "−" : ""}$${nf0.format(Math.abs(Math.round(n)))}`,
  money2: (n: number) => `${n < 0 ? "−" : ""}$${nf2.format(Math.abs(n))}`,
  moneyK: (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n) >= 10000 ? compact.format(Math.abs(n)) : nf0.format(Math.abs(Math.round(n)))}`,
  num: (n: number) => nf0.format(Math.round(n)),
  compact: (n: number) => compact.format(n),
  pct: (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`,
  delta: (n: number | null, digits = 1) => (n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}%`),
  x: (n: number) => `${n.toFixed(2)}×`,
  x1: (n: number) => `${n.toFixed(1)}×`,
};
