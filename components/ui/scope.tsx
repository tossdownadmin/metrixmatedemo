"use client";

import { MapPin } from "lucide-react";
import { useApp } from "@/components/context";

export function ScopeBanner({ note }: { note?: string }) {
  const { store, setStoreIdx, role } = useApp();
  if (!store) return null;
  return (
    <div className="scope-banner">
      <MapPin size={15} />
      <span>Showing <b>{store.name}</b> ({store.city}, {store.state}){note ? `. ${note}` : ""}</span>
      {role === "admin" && <button className="btn sm" onClick={() => setStoreIdx(null)}>Back to all stores</button>}
    </div>
  );
}
