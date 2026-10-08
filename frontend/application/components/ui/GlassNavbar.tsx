"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, LayoutDashboard, UserCircle, LogOut } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { api, clearTokens, type User } from "@/lib/api";

interface GlassNavbarProps {
  user?: User | null;
}

export function GlassNavbar({ user: initialUser }: GlassNavbarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser ?? null);

  // Sync or fetch current user on client mount / route change
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
      return;
    }

    api.auth
      .me()
      .then((res) => setCurrentUser(res))
      .catch(() => setCurrentUser(null));
  }, [initialUser, pathname]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      clearTokens();
      setCurrentUser(null);
      window.location.href = "/";
    }
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
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <>
              {/* Write button only for publisher/admin */}
              {(currentUser.role === "publisher" || currentUser.role === "admin") && (
                <Link href="/dashboard/posts/editor">
                  <GlassButton variant="primary" size="sm" className="flex items-center gap-1.5">
                    <PenSquare className="h-3.5 w-3.5" />
                    <span>Write</span>
                  </GlassButton>
                </Link>
              )}

              {/* Dashboard link for all logged-in roles */}
              <Link href="/dashboard">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-1.5 ${
                    pathname.startsWith("/dashboard")
                      ? "text-cyan-300 bg-white/10"
                      : "text-slate-300"
                  }`}
                  title="Dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-medium">Dashboard</span>
                </GlassButton>
              </Link>

              {/* Settings / Profile link */}
                <Link href="/profile">
                  <GlassButton variant="ghost" size="sm" title="Profile" className="flex items-center gap-1.5">
                    <UserCircle className="h-4 w-4 text-slate-300" />
                    <span className="hidden sm:inline text-xs font-normal text-slate-300">
                      {currentUser.username}
                    </span>
                  </GlassButton>
                </Link>

              {/* Sign out button */}
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Sign out"
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline text-xs">Sign Out</span>
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