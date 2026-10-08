"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, getAssetUrl, type User } from "@/lib/api";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  UserCircle,
  ShieldCheck,
  Feather,
  BookOpen,
  Camera,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    altEmail: "",
    phone: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
  });

  // Password fields state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI status messages
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
  api.auth
    .me()
    .then((data) => {
      setUser(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        username: data.username || "",
        email: data.email || "",
        altEmail: data.altEmail || "",
        phone: data.phone || "",
        dateOfBirth: formatDateForInput(data.dateOfBirth), // 👈 Converts output back to "26-07-1986"
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        state: data.state || "",
        pinCode: data.pinCode || "",
      });
    })
    .catch(() => {
      router.push("/login");
    })
    .finally(() => setLoading(false));
}, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 1. Handle Profile Details Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSavingProfile(true);
  setProfileMsg(null);

  // Validate DD-MM-YYYY format before sending
  if (formData.dateOfBirth && !isValidDDMMYYYY(formData.dateOfBirth)) {
    setProfileMsg({
      type: "error",
      text: "Date of Birth must be in DD-MM-YYYY format (e.g., 16-07-1986).",
    });
    setSavingProfile(false);
    return;
  }

  try {
    const updatedUser = await api.auth.updateProfile(formData);
    setUser(updatedUser);
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: formatDateForInput(updatedUser.dateOfBirth),
    }));
    setProfileMsg({ type: "success", text: "Profile updated successfully" });
  } catch (err: unknown) {
    // Show exact raw backend error (e.g. from Gin binding validation)
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    setProfileMsg({ type: "error", text: message });
  } finally {
    setSavingProfile(false);
  }
  };

  // 2. Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMsg({ type: "success", text: res.message || "Password changed successfully." });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password.";
      setPasswordMsg({ type: "error", text: message });
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Handle Profile Picture Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPic(true);
    setProfileMsg(null);

    const body = new FormData();
    body.append("profile_pic", file);

    try {
      await api.auth.updateProfilePic(body);
      // Refresh current user to load new picture URL
      const refreshed = await api.auth.me();
      setUser(refreshed);
      setProfileMsg({ type: "success", text: "Profile picture updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setProfileMsg({ type: "error", text: message });
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;
// Converts "1986-07-26T00:00:00Z" -> "26-07-1986"
function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  // If already DD-MM-YYYY, keep it
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;

  // Split ISO date "1986-07-26T..." or "1986-07-26"
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

// Validate DD-MM-YYYY format
function isValidDDMMYYYY(dateStr: string): boolean {
  if (!dateStr) return true; // Optional field
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  return true;
}
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Account & Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal identity, contact details, address, and credentials.
          </p>
        </div>

        {/* Identity & Avatar Card */}
        <div className="liquid-glass rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="relative h-24 w-24 rounded-full border-2 border-white/20 overflow-hidden bg-slate-900 flex items-center justify-center">
              {user.profilePic ? (
                <img
                  src={getAssetUrl(user.profilePic)}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle className="h-16 w-16 text-slate-500" />
              )}
            </div>

            <button
              type="button"
              disabled={uploadingPic}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Upload new picture"
            >
              <Camera className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">
                {uploadingPic ? "..." : "Change"}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs font-mono text-cyan-400">@{user.username}</p>
            <p className="text-xs text-slate-400">{user.email}</p>

            <div className="pt-2">
              {user.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </span>
              )}
              {user.role === "publisher" && (
                <span className="inline-flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                  <Feather className="h-3.5 w-3.5" /> Publisher
                </span>
              )}
              {user.role === "visitor" && (
                <span className="inline-flex items-center gap-1 rounded bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-300">
                  <BookOpen className="h-3.5 w-3.5" /> Visitor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleProfileSubmit} className="liquid-glass rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-base font-semibold text-white">Personal & Contact Information</h3>
          </div>

          {profileMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm border ${
                profileMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
  <label className="block text-xs font-medium text-slate-400 mb-1.5">Date of Birth</label>
  <input
    type="text"
    name="dateOfBirth"
    placeholder="DD-MM-YYYY"
    value={formData.dateOfBirth}
    onChange={handleInputChange}
    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
  />
</div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Primary Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Alternate Email</label>
              <input
                type="email"
                name="altEmail"
                value={formData.altEmail}
                onChange={handleInputChange}
                placeholder="optional"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">PIN Code</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <GlassButton type="submit" variant="primary" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile Details"}
            </GlassButton>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="liquid-glass rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Change Password</h3>
          </div>

          {passwordMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-sm border ${
                passwordMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <GlassButton type="submit" variant="primary" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}