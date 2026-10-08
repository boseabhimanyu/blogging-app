"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserCheck, Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { api} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier) {
    setError("Please enter your username, email, or alternate email.");
    return;
  }

  setIsLoading(true);

  try {
    const response = await api.auth.login({
      identifier: cleanIdentifier,
      password,
    });

    const user = response.user;

    if (user.role === "admin" || user.role === "publisher") {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
    router.refresh();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid credentials.";
    setError(message);
    setIsLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 -z-10 pointer-events-none" />

      <div className="w-full max-w-md">
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
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Sign In
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Enter your username, primary email, or alternate email.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300 backdrop-blur-md">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                Account Identifier
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username, email, or alternate email"
                  className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl liquid-glass-inset py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
            </div>

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Sign In
              </GlassButton>
            </div>
          </form>

          <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs text-slate-500">
            <span>Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}