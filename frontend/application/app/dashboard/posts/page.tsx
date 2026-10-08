"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Clock,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { api, type Post, type PostStatus } from "@/lib/api";

export default function AuthorPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.posts.list({ limit: 50 });
      setPosts(data.posts || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load articles.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to permanently delete this article?")) {
      return;
    }

    setIsDeleting(slug);
    try {
      await api.posts.delete(slug);
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete article.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" ? true : post.status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [posts, statusFilter, searchQuery]);

  // Derived stats
  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === "published").length;
    const drafts = posts.filter((p) => p.status === "draft").length;
    return { total: posts.length, published, drafts };
  }, [posts]);

  return (
    <div className="space-y-8">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan-400" />
            <span>My Articles</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your written stories, revise drafts, and launch new publications.
          </p>
        </div>

        <Link href="/dashboard/posts/editor">
          <GlassButton variant="primary" size="md" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </GlassButton>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl liquid-glass p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Stories
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {stats.total}
          </div>
        </div>

        <div className="rounded-2xl liquid-glass p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Published Live
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-300">
            {stats.published}
          </div>
        </div>

        <div className="rounded-2xl liquid-glass p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Drafts in Progress
          </span>
          <div className="mt-2 text-3xl font-extrabold text-amber-300">
            {stats.drafts}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Pill Filters */}
        <div className="inline-flex rounded-xl p-1 liquid-glass-inset gap-1">
          {(["all", "published", "draft"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === status
                  ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {status === "all" ? "All Posts" : `${status}s`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-xl liquid-glass-inset py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="rounded-3xl liquid-glass p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading your articles...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-3xl liquid-glass p-12 text-center max-w-lg mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No articles found</h3>
          <p className="mt-1.5 text-xs text-slate-400">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filter or search criteria."
              : "You haven't written any stories yet. Start drafting your first article today."}
          </p>
          <div className="mt-6">
            <Link href="/dashboard/posts/editor">
              <GlassButton variant="primary" size="sm">
                Create First Article
              </GlassButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.slug}
              className="rounded-2xl liquid-glass p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-cyan-500/30 group"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      post.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {post.status}
                  </span>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {post.title}
                </h2>

                {post.summary && (
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {post.summary}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {post.status === "published" && (
                  <Link
                    href={`/posts/${post.slug}`}
                    target="_blank"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="View Live Article"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}

                <Link
                  href={`/dashboard/posts/editor?slug=${encodeURIComponent(post.slug)}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  title="Edit Article"
                >
                  <Edit3 className="h-4 w-4" />
                </Link>

                <button
                  onClick={() => handleDelete(post.slug)}
                  disabled={isDeleting === post.slug}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  title="Delete Article"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}