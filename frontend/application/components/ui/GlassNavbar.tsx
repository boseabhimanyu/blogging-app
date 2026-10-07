"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, LayoutDashboard, UserCircle, LogOut } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { clearTokens, type User } from "@/lib/api";

interface GlassNavbarProps {
  user?: User | null;
}

export function GlassNavbar({ user }: GlassNavbarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearTokens();
    window.location.href = "/";
  };

  const navLinks = [
    { label: "Feed", href: "/" },
    { label: "Categories", href: "/categories" },
  ];

  return (
    <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-6xl">
      <nav className="flex items-center justify-between rounded-2xl px-5 py-3 liquid-glass-elevated">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px]">
              <div className="h-full w-full rounded-[11px] bg-slate-950/80 flex items-center justify-center backdrop-blur-sm group-hover:bg-transparent transition-colors">
                <span className="font-bold text-sm text-cyan-300 group-hover:text-white">
                  L
                </span>
              </div>
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Lumina
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-cyan-300 bg-white/10 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Auth State */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {(user.role === "author" || user.role === "admin") && (
                <Link href="/dashboard/posts/editor">
                  <GlassButton variant="primary" size="sm">
                    <PenSquare className="h-3.5 w-3.5" />
                    <span>Write</span>
                  </GlassButton>
                </Link>
              )}

              <Link href="/dashboard/posts">
                <GlassButton variant="ghost" size="sm" title="Dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                </GlassButton>
              </Link>

              <Link href="/dashboard/settings">
                <GlassButton variant="ghost" size="sm" title="Profile">
                  <UserCircle className="h-4 w-4 text-slate-300" />
                  <span className="hidden sm:inline text-xs font-normal">
                    {user.username}
                  </span>
                </GlassButton>
              </Link>

              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-slate-400 hover:text-rose-400" />
              </GlassButton>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <GlassButton variant="ghost" size="sm">
                  Sign In
                </GlassButton>
              </Link>
              <Link href="/register">
                <GlassButton variant="primary" size="sm">
                  Get Started
                </GlassButton>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}