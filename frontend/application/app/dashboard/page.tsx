"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Feather,
  FileText,
  PenSquare,
  Globe,
  Calendar,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { api, type User, type Post } from "@/lib/api";

export default function DashboardHubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
const router = useRouter();
  // Platform Metrics (for admin)
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [totalPublishers, setTotalPublishers] = useState<number>(0);
  const [totalPublishedPosts, setTotalPublishedPosts] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch current user session
      const currentUser = await api.auth.me();

      if (currentUser.role === "admin" || currentUser.role === "publisher") {
  router.push("/dashboard");
} else {
  // visitor / standard user
  router.push("/");
}
      setUser(currentUser);

      // 2. Fetch data based on role
      if (currentUser.role === "admin") {
        const [visitorsRes, publishersRes, myPostsRes, publishedPostsRes] =
          await Promise.all([
            api.admin.listUsers({ role: "visitor", limit: 1 }),
            api.admin.listUsers({ role: "publisher", limit: 1 }),
            api.posts.list({ limit: 10 }), // admin's own posts
            api.posts.list({ status: "published", limit: 1 }), // total platform published
          ]);

        setTotalVisitors(visitorsRes.pagination?.total || 0);
        setTotalPublishers(publishersRes.pagination?.total || 0);
        setMyPosts(myPostsRes.posts || []);
        setTotalPublishedPosts(
  publishedPostsRes.pagination?.total ??
  publishedPostsRes.total ??
  publishedPostsRes.posts?.length ??
  0
);
      } else if (currentUser.role === "publisher") {
        const myPostsRes = await api.posts.list({ limit: 10 });
        setMyPosts(myPostsRes.posts || []);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
            Loading Workspace...
          </span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
        <span>{error || "Could not retrieve user session."}</span>
      </div>
    );
  }

  // Personal Editorial Stats
  const myTotalCount = myPosts.length;
  const myPublishedCount = myPosts.filter((p) => p.status === "published").length;
  const myDraftCount = myPosts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-7 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300 mb-3">
              {user.role === "admin" && <ShieldCheck className="h-3.5 w-3.5" />}
              {user.role === "publisher" && <Feather className="h-3.5 w-3.5" />}
              {user.role === "visitor" && <BookOpen className="h-3.5 w-3.5" />}
              <span className="capitalize">{user.role} Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user.firstName || user.username}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              {user.role === "admin" &&
                "Platform oversight and your personal writing headquarters."}
              {user.role === "publisher" &&
                "Manage your published publications, draft stories, and write new articles."}
              {user.role === "visitor" &&
                "Discover thoughtfully curated articles and personalize your account."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user.role !== "visitor" && (
              <Link href="/dashboard/posts/editor">
                <GlassButton variant="primary" size="md" className="flex items-center gap-2">
                  <PenSquare className="h-4 w-4" />
                  <span>Write Story</span>
                </GlassButton>
              </Link>
            )}
            <Link href="/">
              <GlassButton variant="default" size="md" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Visit Site</span>
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ADMIN PLATFORM METRICS (TOP TIER)                     */}
      {/* ======================================================== */}
      {user.role === "admin" && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Platform Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Visitors */}
            <div className="rounded-2xl liquid-glass p-5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Visitors
                </span>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  {totalVisitors}
                </div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            {/* Total Publishers */}
            <div className="rounded-2xl liquid-glass p-5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Publishers
                </span>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  {totalPublishers}
                </div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 flex items-center justify-center">
                <Feather className="h-5 w-5" />
              </div>
            </div>

            {/* Total Published Posts */}
            <div className="rounded-2xl liquid-glass p-5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Published Posts
                </span>
                <div className="mt-2 text-3xl font-extrabold text-emerald-300">
                  {totalPublishedPosts}
                </div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. EDITORIAL SECTION (MY POSTS, DRAFTS, PUBLISHED)       */}
      {/* ======================================================== */}
      {(user.role === "admin" || user.role === "publisher") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Feather className="h-4 w-4 text-cyan-400" />
                <span>Editorial Section</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your personal publications, drafts, and editing workspace.
              </p>
            </div>
            <Link
              href="/dashboard/posts"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All Articles</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Metric Badges for Admin/Publisher's own work */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl liquid-glass p-4 border border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                My Total Posts
              </span>
              <div className="mt-1 text-2xl font-bold text-white">
                {myTotalCount}
              </div>
            </div>

            <div className="rounded-2xl liquid-glass p-4 border border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                My Published
              </span>
              <div className="mt-1 text-2xl font-bold text-emerald-300">
                {myPublishedCount}
              </div>
            </div>

            <div className="rounded-2xl liquid-glass p-4 border border-white/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                My Drafts
              </span>
              <div className="mt-1 text-2xl font-bold text-amber-300">
                {myDraftCount}
              </div>
            </div>
          </div>

          {/* Recent Stories List */}
          <div className="rounded-3xl liquid-glass p-6 border border-white/10">
            {myPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                You haven't created any articles yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {myPosts.slice(0, 5).map((post) => (
                  <div
                    key={post.slug}
                    className="py-3 flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            post.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {post.status}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {post.status === "published" && (
                        <Link
                          href={`/posts/${post.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          title="View live article"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/posts/editor?slug=${encodeURIComponent(
                          post.slug
                        )}`}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. VISITOR VIEW                                          */}
      {/* ======================================================== */}
      {user.role === "visitor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl liquid-glass p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Browse Stories</h2>
              <p className="mt-1 text-xs text-slate-400">
                Explore articles published by community writers across different topics.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Read Articles on Feed</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl liquid-glass p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Account Profile</h2>
              <p className="mt-1 text-xs text-slate-400">
                View your registered details and manage contact settings.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>Account Settings</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}