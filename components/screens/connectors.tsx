"use client";

import { Card } from "@/components/ui/primitives";

type Connector = { name: string; category: string; description: string; coverage: "Modeled in demo" | "Via Meta Ads" | "Catalog listing"; initial: string; color: string };

const CONNECTORS: Connector[] = [
  { name: "Meta Ads", category: "Paid media", description: "Campaign spend and store-level attributed orders.", coverage: "Modeled in demo", initial: "M", color: "#6e56cf" },
  { name: "Google Ads", category: "Paid media", description: "Search and Performance Max campaign performance.", coverage: "Modeled in demo", initial: "G", color: "#2f6fe4" },
  { name: "TikTok", category: "Paid media", description: "Campaign and creative performance.", coverage: "Modeled in demo", initial: "T", color: "#0f1d33" },
  { name: "Google Analytics 4", category: "Web analytics", description: "Sessions, source/medium and ordering funnel.", coverage: "Modeled in demo", initial: "A", color: "#c98410" },
  { name: "GMB (Google Business Profile)", category: "Local presence", description: "Profile views, listing actions and local review signals.", coverage: "Modeled in demo", initial: "B", color: "#17936a" },
  { name: "Facebook", category: "Social", description: "Facebook campaign placement represented in Meta Ads.", coverage: "Via Meta Ads", initial: "F", color: "#2f6fe4" },
  { name: "Instagram", category: "Social", description: "Instagram campaign placement represented in Meta Ads.", coverage: "Via Meta Ads", initial: "I", color: "#c2364a" },
  { name: "YouTube", category: "Social", description: "Video and channel signals listed for future demos.", coverage: "Catalog listing", initial: "Y", color: "#c2364a" },
  { name: "Square", category: "Point of sale", description: "Restaurant transaction source in the connector catalog.", coverage: "Catalog listing", initial: "S", color: "#13223a" },
  { name: "Toast", category: "Point of sale", description: "Restaurant transaction source in the connector catalog.", coverage: "Catalog listing", initial: "T", color: "#e4502a" },
  { name: "Clover", category: "Point of sale", description: "Restaurant transaction source in the connector catalog.", coverage: "Catalog listing", initial: "C", color: "#17936a" },
  { name: "Foodtech", category: "Restaurant tech", description: "Restaurant operations source in the connector catalog.", coverage: "Catalog listing", initial: "F", color: "#0e9f9a" },
];

const GROUPS = ["Paid media", "Web analytics", "Local presence", "Social", "Point of sale", "Restaurant tech"];

export function Connectors() {
  return <div className="stack">
    <p className="note">Connector catalog for the pitch demo. All figures in this project are simulated; no external account is connected. “Catalog listing” does not claim a working integration.</p>
    {GROUPS.map(group => <section className="stack" key={group}>
      <h2 className="connector-group">{group}</h2>
      <div className="grid g3">
        {CONNECTORS.filter(c => c.category === group).map(c => <Card key={c.name}>
          <div className="connector-item">
            <span className="conn-logo" style={{ background: c.color }} aria-hidden>{c.initial}</span>
            <div><h3>{c.name}</h3><p>{c.description}</p></div>
          </div>
          <div className="connector-coverage"><span className={`connector-dot ${c.coverage === "Catalog listing" ? "catalog" : "modeled"}`} />{c.coverage}</div>
        </Card>)}
      </div>
    </section>)}
  </div>;
}
