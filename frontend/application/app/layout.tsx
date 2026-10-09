import "./globals.css";
import type { Metadata } from "next";
import { PublicNavbarWrapper } from "@/components/ui/PublicNavbarWrapper";

export const metadata: Metadata = {
  title: "Lumina",
  description: "Dispatches & Engineering Notes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        <PublicNavbarWrapper />
        {children}
      </body>
    </html>
  );
}