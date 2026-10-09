"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type User, type UserRole, getAssetUrl } from "@/lib/api";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Feather,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Loader2,
} from "lucide-react";

// --- Date Helpers for DD-MM-YYYY & <input type="date"> (YYYY-MM-DD) ---
function toCalendarValue(dateStr?: string): string {
  if (!dateStr) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }
  return dateStr.split("T")[0];
}

function toBackendDate(calendarVal: string): string {
  if (!calendarVal) return "";
  const parts = calendarVal.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return calendarVal;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters — strictly "true" or "false" to satisfy backend query requirement
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<"true" | "false">("true");

  // Modals & Panels
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Status feedback banners
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Operations loading flags
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Password reset state inside edit drawer
  const [newPassword, setNewPassword] = useState("");

  // Forms
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    altEmail: "",
    phone: "",
    password: "",
  });

  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    altEmail: string;
    phone: string;
    role: UserRole;
    status: boolean;
    dateOfBirth: string; // DD-MM-YYYY format
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pinCode: string;
  }>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    altEmail: "",
    phone: "",
    role: "visitor",
    status: true,
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.admin.listUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter, // Always "true" or "false"
      });
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users";
      setFeedback({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      await api.admin.createUser(createForm);
      setFeedback({ type: "success", text: "User created successfully" });
      setIsCreateOpen(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        altEmail: "",
        phone: "",
        password: "",
      });
      fetchUsers();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Creation failed");
    }
  };

  // Open Edit Drawer
  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setModalError(null);
    setModalSuccess(null);
    setNewPassword("");
    setEditForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      username: u.username || "",
      email: u.email || "",
      altEmail: u.altEmail || "",
      phone: u.phone || "",
      role: u.role || "visitor",
      status: u.status ?? true,
      dateOfBirth: u.dateOfBirth
        ? (() => {
            const raw = u.dateOfBirth.split("T")[0].split("-");
            return raw.length === 3 ? `${raw[2]}-${raw[1]}-${raw[0]}` : "";
          })()
        : "",
      addressLine1: u.addressLine1 || "",
      addressLine2: u.addressLine2 || "",
      city: u.city || "",
      state: u.state || "",
      pinCode: u.pinCode || "",
    });
  };

 // Quick Table Row Status Toggle
  const handleQuickStatusToggle = async (u: User) => {
    try {
      const nextStatus = !u.status;
      await api.admin.updateUserStatus(u.id, nextStatus);

      // Instantly remove from the current filtered list for immediate feedback
      setUsers((prev) => prev.filter((item) => item.id !== u.id));

      setFeedback({
        type: "success",
        text: `User @${u.username} marked as ${nextStatus ? "active" : "inactive"}.`,
      });

      // Refresh list to pull the next record into the page and sync pagination
      fetchUsers();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Status update failed",
      });
    }
  };

  // Independent Modal Status Toggle (Direct Database Call)
  const handleModalStatusToggle = async () => {
    if (!editingUser || isTogglingStatus) return;

    setIsTogglingStatus(true);
    setModalError(null);
    setModalSuccess(null);

    const nextStatus = !editForm.status;

    try {
      await api.admin.updateUserStatus(editingUser.id, nextStatus);

      // Sync drawer form state
      setEditForm((prev) => ({ ...prev, status: nextStatus }));
      setEditingUser((prev) => (prev ? { ...prev, status: nextStatus } : null));

      // Remove the user from the current view list since their status no longer matches statusFilter
      setUsers((prev) => prev.filter((u) => u.id !== editingUser.id));

      setModalSuccess(`Account status changed to ${nextStatus ? "Active" : "Inactive"}.`);

      // Refresh data in background
      fetchUsers();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Save Changes (Profile Details & Role — Completely Decoupled from Status)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      // 1. Update role if modified
      if (editForm.role !== editingUser.role) {
        await api.admin.updateUserRole(editingUser.id, editForm.role);
      }

      // 2. Build profile update payload (does not include status)
      const payload: Record<string, any> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        username: editForm.username,
        email: editForm.email,
        phone: editForm.phone,
        addressLine1: editForm.addressLine1,
        addressLine2: editForm.addressLine2,
        city: editForm.city,
        state: editForm.state,
        pinCode: editForm.pinCode,
      };

      if (editForm.altEmail.trim()) {
        payload.altEmail = editForm.altEmail.trim();
      }
      if (editForm.dateOfBirth.trim()) {
        payload.dateOfBirth = editForm.dateOfBirth.trim();
      }

      await api.admin.updateUser(editingUser.id, payload);

      setFeedback({ type: "success", text: "User profile updated successfully." });
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Profile update failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Admin Reset User Password
  const handleAdminResetPassword = async () => {
    if (!editingUser || !newPassword.trim() || isResettingPassword) return;

    setIsResettingPassword(true);
    setModalError(null);
    setModalSuccess(null);

    try {
      const res = await api.admin.resetUserPassword(editingUser.id, newPassword);
      setModalSuccess(res.message || "Password reset successfully.");
      setNewPassword("");
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-sm text-slate-400">
            Search, inspect, update roles, credentials, and manage accounts.
          </p>
        </div>

        <GlassButton
          variant="primary"
          onClick={() => {
            setModalError(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 w-fit"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </GlassButton>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-3 text-sm border backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="liquid-glass rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, username, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none [color-scheme:dark]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="publisher">Publisher</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>

          {/* Status Filter — strictly active/inactive */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "true" | "false");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-cyan-500/50 focus:outline-none [color-scheme:dark]"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">City / State</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-slate-900 overflow-hidden flex items-center justify-center">
                          {u.profilePic ? (
                            <img
                              src={getAssetUrl(u.profilePic)}
                              alt={u.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-6 w-6 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {u.firstName || u.lastName
                              ? `${u.firstName} ${u.lastName}`.trim()
                              : u.username}
                          </div>
                          <div className="text-xs font-mono text-cyan-400">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4 text-xs">
                      <div className="text-slate-300">{u.email}</div>
                      <div className="text-slate-500 font-mono">{u.phone || "—"}</div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {u.role === "publisher" && (
                        <span className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-2 py-0.5 text-xs font-medium text-cyan-300">
                          <Feather className="h-3 w-3" /> Publisher
                        </span>
                      )}
                      {u.role === "visitor" && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-500/15 px-2 py-0.5 text-xs font-medium text-slate-300">
                          <BookOpen className="h-3 w-3" /> Visitor
                        </span>
                      )}
                    </td>

                    {/* Quick Inline Status Toggle */}
<td className="px-4 py-4">
  <button
    disabled={u.role === "admin"}
    onClick={() => handleQuickStatusToggle(u)}
    className="group flex items-center gap-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
    title={u.role === "admin" ? "Admin status cannot be modified" : "Click to toggle status"}
  >
    {u.status ? (
      <>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className={`text-emerald-300 ${u.role !== "admin" ? "group-hover:underline" : ""}`}>
          Active {u.role === "admin" && "(Locked)"}
        </span>
      </>
    ) : (
      <>
        <span className="h-2 w-2 rounded-full bg-slate-600" />
        <span className="text-slate-500">Inactive</span>
      </>
    )}
  </button>
</td>

                    {/* Location */}
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {u.city || u.state
                        ? `${u.city || ""}${u.city && u.state ? ", " : ""}${u.state || ""}`
                        : "—"}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-white/10 px-6 py-3.5 flex items-center justify-between text-xs text-slate-400 bg-white/[0.01]">
          <div>
            Showing <span className="font-semibold text-white">{users.length}</span> of{" "}
            <span className="font-semibold text-white">{pagination.total}</span> users
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/[0.05] disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- CREATE USER MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Alt Email (Optional)</label>
                  <input
                    type="email"
                    value={createForm.altEmail}
                    onChange={(e) => setCreateForm({ ...createForm, altEmail: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <GlassButton type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton type="submit" variant="primary">
                  Create User
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER SLIDE-OVER DRAWER --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="liquid-glass w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit User: @{editingUser.username}</h3>
                <p className="text-xs text-slate-400">ID: {editingUser.id}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* In-Modal Feedback Alerts */}
            {modalError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Role & Independent Status Direct Controls */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div>
  <label className="block text-xs font-medium text-slate-400 mb-1">
    Role Assignment
  </label>
  <select
    value={editForm.role}
    disabled={editingUser.role === "admin"} // Protect admins from edit
    onChange={(e) =>
      setEditForm({ ...editForm, role: e.target.value as UserRole })
    }
    className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none [color-scheme:dark] disabled:opacity-50"
  >
    <option value="visitor">Visitor</option>
    <option value="publisher">Publisher</option>
    {/* Show Admin only if the user already is one, disabled */}
    {editingUser.role === "admin" && (
      <option value="admin">Admin (Protected)</option>
    )}
  </select>
</div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400">Account Status</label>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">Live Toggle</span>
                </div>
                <button
  type="button"
  disabled={isTogglingStatus || editingUser.role === "admin"}
  onClick={handleModalStatusToggle}
  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-white hover:border-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span className={editForm.status ? "text-emerald-300 font-medium" : "text-slate-400 font-medium"}>
    {editingUser.role === "admin" ? "Active (Protected)" : editForm.status ? "Active" : "Inactive"}
  </span>
  {editForm.status ? (
    <ToggleRight className="h-5 w-5 text-emerald-400" />
  ) : (
    <ToggleLeft className="h-5 w-5 text-slate-500" />
  )}
</button>
              </div>
            </div>

            {/* Profile Fields Form (Submits profile attributes only) */}
            {/* Profile Fields Form (Submits profile attributes only) */}
<form onSubmit={handleEditSubmit} className="space-y-4">
  {/* Admin Protected Notice */}
  {editingUser.role === "admin" && (
    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-300">
      <ShieldCheck className="h-4 w-4 shrink-0" />
      <span>Administrator accounts are view-only and protected from direct profile edits.</span>
    </div>
  )}

  {/* Fieldset cleanly disables all child inputs when target is admin */}
  <fieldset
    disabled={editingUser.role === "admin"}
    className="space-y-4 disabled:opacity-60"
  >
    {/* Name Details */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
        <input
          type="text"
          value={editForm.firstName}
          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
        <input
          type="text"
          value={editForm.lastName}
          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>

    {/* Username & DOB */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
        <input
          type="text"
          value={editForm.username}
          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Date of Birth (DD-MM-YYYY)
        </label>
        <input
          type="date"
          value={toCalendarValue(editForm.dateOfBirth)}
          onChange={(e) => {
            const backendVal = toBackendDate(e.target.value);
            setEditForm((prev) => ({ ...prev, dateOfBirth: backendVal }));
          }}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert disabled:cursor-not-allowed"
        />
      </div>
    </div>

    {/* Contact info */}
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
        <input
          type="email"
          value={editForm.email}
          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Alt Email</label>
        <input
          type="email"
          value={editForm.altEmail}
          onChange={(e) => setEditForm({ ...editForm, altEmail: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
        <input
          type="tel"
          value={editForm.phone}
          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>

    {/* Address Section */}
    <div className="space-y-3 pt-2 border-t border-white/5">
      <span className="text-xs font-medium text-slate-400">Address Information</span>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Address Line 1"
          value={editForm.addressLine1}
          onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="Address Line 2"
          value={editForm.addressLine2}
          onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="City"
          value={editForm.city}
          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="State"
          value={editForm.state}
          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
        <input
          type="text"
          placeholder="PIN Code"
          value={editForm.pinCode}
          onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  </fieldset>

  {/* Footer Controls — Outside fieldset so Close/Cancel is always clickable */}
  <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
    <GlassButton type="button" variant="ghost" onClick={() => setEditingUser(null)}>
      {editingUser.role === "admin" ? "Close" : "Cancel"}
    </GlassButton>
    {editingUser.role !== "admin" && (
      <GlassButton type="submit" variant="primary" disabled={isSaving}>
        {isSaving ? "Saving Details..." : "Save Details"}
      </GlassButton>
    )}
  </div>
</form>

            {/* --- ADMIN RESET PASSWORD SECTION --- */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">Reset User Password</h4>
              </div>

              {editingUser.role === "admin" ? (
                <p className="text-xs text-slate-500">
                  Password reset by another admin is disabled for administrator accounts.
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <GlassButton
                    type="button"
                    variant="danger"
                    disabled={isResettingPassword || !newPassword.trim()}
                    onClick={handleAdminResetPassword}
                  >
                    {isResettingPassword ? "Updating..." : "Force Reset"}
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}