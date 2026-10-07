"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    altEmail: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const passwordsMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        ...(formData.altEmail.trim()
          ? { altEmail: formData.altEmail.trim() }
          : {}),
      };

      await api.auth.register(payload);
      router.push("/login?registered=true");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to register account.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Feed</span>
        </Link>

        <div className="rounded-3xl liquid-glass p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create an Account
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Join the platform to write, read, and engage.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 backdrop-blur-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  First Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Priya"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Last Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Pathak"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            {/* Username & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Username <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="priyap"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Phone Number <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9685745896"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            {/* Primary & Alternate Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="priya@example.com"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Alternate Email <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    name="altEmail"
                    value={formData.altEmail}
                    onChange={handleChange}
                    placeholder="recovery@example.com"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Password <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Confirm Password <span className="text-cyan-400">*</span>
                  </label>
                  {passwordsMatch && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Matched
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400">
                      <XCircle className="h-3 w-3" />
                      Mismatch
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className={`w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
                      passwordsMatch
                        ? "border-emerald-500/50 focus:ring-emerald-400/50"
                        : passwordsMismatch
                        ? "border-rose-500/50 focus:ring-rose-400/50"
                        : "focus:ring-cyan-400/50"
                    }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {passwordsMatch && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {passwordsMismatch && (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={passwordsMismatch}
                className="w-full"
              >
                Create Account
              </GlassButton>
            </div>
          </form>

          <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}