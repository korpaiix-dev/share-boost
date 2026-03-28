import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostPilot AI — บริการดูแลเพจ Facebook ด้วย AI",
  description: "บริการดูแลเพจ Facebook ด้วย AI ระดับพรีเมียม",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className="dark">
      <body className="bg-slate-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
