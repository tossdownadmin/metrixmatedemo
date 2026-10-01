import type { Metadata } from "next";

export const metadata: Metadata = { title: "Northstar Slice Co. | Command Center", description: "Fictional restaurant performance demo" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><head><link rel="stylesheet" href="/demo.css" /></head><body>{children}</body></html>; }
