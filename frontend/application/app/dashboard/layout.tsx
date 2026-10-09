"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Users,
  Settings,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Feather,
  BookOpen,
} from "lucide-react";
import { api, clearTokens, getAssetUrl, type User } from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"admin" | "publisher" | "visitor">;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "publisher"],
    exact: true,
  },
  {
    label: "Articles",
    href: "/dashboard/posts",
    icon: FileText,
    roles: ["publisher", "admin"],
  },
  {
    label: "New Article",
    href: "/dashboard/posts/editor",
    icon: PenSquare,
    roles: ["publisher", "admin"],
  },
  {
    label: "User Management",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin"],
  },
  {
  label: "Account & Profile",
  href: "/dashboard/profile",
  icon: Settings,
  roles: ["visitor", "publisher", "admin"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"], // only admins should access app settings
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth
      .me()
      .then((currentUser) => {
        if (currentUser.role === "visitor") {
          router.replace("/");
          return;
        }

        setUser(currentUser);
        setLoading(false);
      })
      .catch(() => {
        clearTokens();
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
            Authenticating Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const accessibleLinks = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Liquid Glass Sidebar */}
      <aside className="w-full md:w-64 md:min-h-screen flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col justify-between liquid-glass backdrop-blur-2xl">
        <div className="space-y-6">
          {/* Platform Identity */}
          {/* Platform Identity */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px]">
                <div className="h-full w-full rounded-[11px] bg-slate-950/80 flex items-center justify-center backdrop-blur-sm group-hover:bg-transparent transition-colors">
                  <span className="font-bold text-sm text-cyan-300 group-hover:text-white">
                    L
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-white">
                  Lumina
                </span>
                <span className="block text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                  Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile Capsule (Clickable -> Account & Profile) */}
          <Link
  href="/dashboard/settings"
  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-3 hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all group"
  title="Manage Account & Profile"
>
            <div className="h-10 w-10 rounded-full border border-white/15 overflow-hidden bg-slate-900 flex-shrink-0 flex items-center justify-center">
              {user.profilePic ? (
                <img
                  src={getAssetUrl(user.profilePic)}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-bold text-sm text-cyan-400">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                {user.firstName || user.username}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                )}
                {user.role === "publisher" && (
                  <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                    <Feather className="h-3 w-3" /> Publisher
                  </span>
                )}
                {user.role === "visitor" && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                    <BookOpen className="h-3 w-3" /> Visitor
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="block px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Navigation
            </span>
            {accessibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_16px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/5 mt-6 md:mt-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 overflow-y-auto min-h-screen p-6 sm:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}