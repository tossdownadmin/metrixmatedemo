"use client";

import { createContext, useContext } from "react";
import type { Demo, Store } from "@/lib/data";
import type { PlatformFilter, Range } from "@/lib/select";

export type Screen =
  | "dashboard" | "sales-comparison" | "source-comparison" | "pos" | "insights" | "local" | "fleet"
  | "meta" | "google" | "tiktok" | "ga4" | "connectors";

export type Ctx = {
  demo: Demo;
  days: number;
  setDays: (d: number) => void;
  storeIdx: number | null;
  setStoreIdx: (i: number | null) => void;
  store: Store | null;
  platform: PlatformFilter;
  target: number;
  setTarget: (t: number) => void;
  screen: Screen;
  go: (s: Screen, storeIdx?: number | null) => void;
  cur: Range;
  prev: Range;
  ly: Range;
};

export const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
