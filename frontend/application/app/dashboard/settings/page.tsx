"use client";

import { useEffect, useState } from "react";
import { api, type AppSettings } from "@/lib/api";
import {
  ToggleLeft,
  ToggleRight,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.admin.getSettings();
      setSettings(data);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleRegistration = async () => {
    if (!settings || isUpdating) return;

    const nextState = !settings.allowRegistration;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const updated = await api.admin.updateSettings(nextState);
      setSettings(updated);
      setFeedback({
        type: "success",
        text: `Public registration is now ${
          nextState ? "open" : "restricted"
        }.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update setting",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            System Settings
          </h1>
          <p className="text-sm text-slate-400">
            Global access controls and registration policies.
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading || isUpdating}
          className="p-2 rounded-xl border border-white/10 hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all disabled:opacity-40"
          title="Reload settings"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-sm backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="liquid-glass rounded-2xl border border-white/10 p-6 space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-base font-semibold text-white">
            Authentication & Access
          </h2>
          <p className="text-xs text-slate-400">
            Control whether visitors can register new accounts on the platform.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-cyan-400 shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Allow Public Registration
                  </span>
                  {settings?.allowRegistration ? (
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      Enabled
                    </span>
                  ) : (
                    <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  When disabled, new users cannot create accounts via the public sign-up form.
                  Admins can still create accounts manually.
                </p>
                {settings?.updatedAt && (
                  <p className="text-[11px] text-slate-500 font-mono mt-2">
                    Last modified: {new Date(settings.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={handleToggleRegistration}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                settings?.allowRegistration
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-slate-700 bg-slate-900/80 text-slate-400 hover:text-white"
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Saving...</span>
                </>
              ) : settings?.allowRegistration ? (
                <>
                  <ToggleRight className="h-5 w-5 text-emerald-400" />
                  <span>Allowing Signups</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="h-5 w-5 text-slate-500" />
                  <span>Registration Closed</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Security Info Card */}
      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-slate-300">
        <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-cyan-200">Public Registration Enforcement</p>
          <p className="text-slate-400 mt-0.5">
            This setting immediately gates <code className="text-cyan-300">POST /api/v1/auth/register</code> on the backend.
            When toggled off, sign-up attempts will be rejected.
          </p>
        </div>
      </div>
    </div>
  );
}