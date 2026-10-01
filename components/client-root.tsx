"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("@/components/app"), { ssr: false, loading: () => <div className="splash">Loading dashboard…</div> });
export default function ClientRoot() { return <App />; }
