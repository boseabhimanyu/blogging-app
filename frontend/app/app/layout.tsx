import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumina | Modern Publishing",
  description: "Next-generation publishing platform crafted with Go and Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {/* Ambient Fluid Background Spheres */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Top-left Electric Cyan */}
          <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-cyan-600/15 rounded-full blur-[140px]" />
          {/* Center-right Deep Purple */}
          <div className="absolute top-1/4 -right-40 w-[38rem] h-[38rem] bg-indigo-600/15 rounded-full blur-[160px]" />
          {/* Bottom-center Emerald subtle glow */}
          <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] bg-emerald-600/10 rounded-full blur-[150px]" />
        </div>

        {children}
      </body>
    </html>
  );
}