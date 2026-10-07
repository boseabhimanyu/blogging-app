"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ShieldCheck,
  Feather,
  BookOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { api, getAssetUrl, type User } from "@/lib/api";

type RoleOption = "reader" | "author" | "admin";

export default function UserManagementPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const me = await api.auth.me();
        if (me.role !== "admin") {
          router.push("/dashboard/posts");
          return;
        }
        setCurrentUser(me);

        // Uses admin property from your api.ts
        const adminApi = api.admin as Record<string, any>;
        const fetchFn = adminApi.listUsers || adminApi.getUsers || adminApi.users;
        const res = typeof fetchFn === "function" ? await fetchFn() : await (adminApi as any)();
        setUsers(Array.isArray(res) ? res : res.users || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load users.";
        setNotification({ type: "error", message: msg });
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const handleRoleChange = async (username: string, nextRole: RoleOption) => {
    setActionLoading(username);
    setNotification(null);

    try {
      const adminApi = api.admin as Record<string, any>;
      const updateFn = adminApi.updateUserRole || adminApi.updateRole;
      const updatedUser = await updateFn(username, nextRole);

      setUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, role: nextRole } : u))
      );
      setNotification({
        type: "success",
        message: `Updated @${username}'s role to ${nextRole}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      setNotification({ type: "error", message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (username === currentUser?.username) {
      setNotification({
        type: "error",
        message: "You cannot delete your own administrative account.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete @${username}?`
    );
    if (!confirmed) return;

    setActionLoading(username);
    setNotification(null);

    try {
      const adminApi = api.admin as Record<string, any>;
      const deleteFn = adminApi.deleteUser || adminApi.delete;
      await deleteFn(username);

      setUsers((prev) => prev.filter((u) => u.username !== username));
      setNotification({
        type: "success",
        message: `User @${username} has been deleted.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user.";
      setNotification({ type: "error", message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
            Loading directory...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              User Management
            </h1>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
              {users.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Control platform roles, user statuses, and administrative permissions.
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-sm backdrop-blur-md border ${
            notification.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/40 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, full name, or email..."
            className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "admin", "author", "reader"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                roleFilter === r
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  : "liquid-glass text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl liquid-glass overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Current Role</th>
                <th className="py-3.5 px-5">Role Assignment</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isCurrent = user.username === currentUser?.username;
                  const isPending = actionLoading === user.username;

                  return (
                    <tr
                      key={user.username}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-slate-900 flex items-center justify-center">
                            {user.profilePic ? (
                              <img
                                src={getAssetUrl(user.profilePic)}
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-xs text-cyan-300">
                                {user.username.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white truncate">
                                {user.name || user.username}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="block text-xs text-slate-400 truncate">
                              @{user.username} • {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {user.role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-300">
                            <ShieldCheck className="h-3.5 w-3.5" /> Admin
                          </span>
                        )}
                        {user.role === "author" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                            <Feather className="h-3.5 w-3.5" /> Author
                          </span>
                        )}
                        {user.role === "reader" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                            <BookOpen className="h-3.5 w-3.5" /> Reader
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <select
                          disabled={isCurrent || isPending}
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.username,
                              e.target.value as RoleOption
                            )
                          }
                          className="rounded-xl liquid-glass-inset px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                          <option value="reader" className="bg-slate-900 text-slate-200">
                            Reader (Read Only)
                          </option>
                          <option value="author" className="bg-slate-900 text-slate-200">
                            Author (Write & Publish)
                          </option>
                          <option value="admin" className="bg-slate-900 text-slate-200">
                            Admin (Full Control)
                          </option>
                        </select>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <GlassButton
                          variant="danger"
                          size="sm"
                          disabled={isCurrent || isPending}
                          onClick={() => handleDeleteUser(user.username)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </GlassButton>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-sm">No users matched your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}