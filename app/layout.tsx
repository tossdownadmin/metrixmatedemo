import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "600", "700"] });
const ui = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Northstar Slice Co. | MetrixMate",
  description: "MetrixMate demo workspace with simulated data for a fictional pizza chain.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%23e4502a'/><path d='M12 4l2 5.3 5.6.3-4.3 3.6 1.4 5.5L12 15.6l-4.7 3.1 1.4-5.5L4.4 9.6 10 9.3z' fill='white'/></svg>" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
