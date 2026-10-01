"use client";

import { useState } from "react";
import { Card, DataTable, Kpis, fmt, type AppContext, type Screen } from "@/components/demo-app";

const connections = [
  {name:"Northstar POS",type:"POS",status:"Demo connected",sync:"Today · 06:05"},
  {name:"Google Ads",type:"Paid media",status:"Demo connected",sync:"Today · 06:11"},
  {name:"Meta Ads",type:"Paid media",status:"Demo connected",sync:"Today · 06:12"},
  {name:"Google Analytics 4",type:"Web analytics",status:"Demo connected",sync:"Today · 06:16"},
  {name:"TikTok Ads",type:"Paid media",status:"Demo connected",sync:"Today · 06:18"},
  {name:"Google Business Profile",type:"Local search",status:"Demo connected",sync:"Today · 06:22"},
];
export function SystemScreen({screen,context}:{screen:Screen;context:AppContext}) {
  const [selected,setSelected]=useState("Northstar POS");
  const title={connections:"Connections",connectors:"Connectors",sync:"Sync History",settings:"Settings",admin:"Admin"}[screen as "connections"|"connectors"|"sync"|"settings"|"admin"];
  return <><div className="ref-page-head"><div><h1>{title}</h1><p>Fictional source and workspace status for the Northstar demo</p></div><span className="ref-status">Demo workspace</span></div>
    {screen==="connections"?<><Kpis values={[{label:"Connected sources",value:"6"},{label:"Active stores",value:"42"},{label:"Latest sync",value:"06:22"},{label:"Data window",value:"180 days"}]}/><Card title="Connections" sub="All source accounts are simulated"><DataTable headers={["Source","Category","Status","Last sync"]} rows={connections.map(c=>[c.name,c.type,c.status,c.sync])}/></Card></>:null}
    {screen==="connectors"?<div className="ref-connector-grid">{connections.map(c=><Card key={c.name} title={c.name} sub={c.type}><div className="ref-connector-status"><i/>{c.status}</div><p>Fictional data source for the Northstar pitch environment.</p></Card>)}</div>:null}
    {screen==="sync"?<><Kpis values={[{label:"Successful demo syncs",value:"6"},{label:"Rows available",value:fmt.number(context.demo.daily.length)},{label:"Stores",value:"42"},{label:"Errors",value:"0"}]}/><Card title="Sync History" sub="Simulated status entries"><DataTable headers={["Source","Status","Completed","Records"]} rows={connections.map((c,i)=>[c.name,"Completed",c.sync,fmt.number(context.demo.daily.length*(i+1)/6)])}/></Card></>:null}
    {screen==="settings"?<div className="ref-grid two"><Card title="Workspace settings"><label className="ref-field">Profile name<input value="Northstar Slice Co." readOnly/></label><label className="ref-field">ROAS target<input value="6.0×" readOnly/></label><label className="ref-field">Data mode<input value="Seeded demo data" readOnly/></label></Card><Card title="Data freshness"><p>Demo data rolls forward with the build date. No external source is connected.</p><DataTable headers={["Source","Status"]} rows={connections.map(c=>[c.name,c.status])}/></Card></div>:null}
    {screen==="admin"?<div className="ref-grid two"><Card title="Demo access"><Kpis values={[{label:"Admins",value:"1"},{label:"Store managers",value:"42"}]}/><p>Use the role selector in the top bar to preview store manager access.</p></Card><Card title="Page access"><select value={selected} onChange={e=>setSelected(e.target.value)} aria-label="Select source">{connections.map(c=><option key={c.name}>{c.name}</option>)}</select><DataTable headers={["Role","Analytics","System"]} rows={[["Admin","All screens","All screens"],["Store Manager","Assigned store","Hidden"]]}/><p className="ref-footnote">{selected} is a fictional connector.</p></Card></div>:null}</>;
}
