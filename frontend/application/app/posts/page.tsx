"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api, type Post, type Category, getAssetUrl } from "@/lib/api";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Loader2,
  AlertCircle,
  FolderTree,
} from "lucide-react";

export default function PublicPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [postsRes, categoriesRes] = await Promise.all([
          api.posts.list({ limit: 100 }),
          api.categories.list(),
        ]);
        setPosts(postsRes.data || []);
        setCategories(categoriesRes || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load articles");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Map category ID to category name/slug for quick badge lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Client-side filtering by active search & selected category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Category filter
      const matchesCategory =
        selectedCategoryId === "all" ||
        post.categoryIds?.includes(selectedCategoryId);

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Read & Explore</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            All Articles
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Discover in-depth engineering guides, open-source insights, and platform updates.
          </p>

          {/* Search Bar */}
          <div className="relative pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search articles by title, topic, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all shadow-lg shadow-black/20"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                selectedCategoryId === "all"
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                  : "bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                      : "bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="max-w-md mx-auto flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-xs">Loading articles...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-slate-900/30 p-8 space-y-2">
            <BookOpen className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-medium text-white">No articles found</p>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedCategoryId !== "all"
                ? "Try adjusting your search query or topic filter."
                : "No articles have been published yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const coverUrl = post.coverImage ? getAssetUrl(post.coverImage) : null;
              const primaryCategory =
                post.categoryIds && post.categoryIds.length > 0
                  ? categoryMap.get(post.categoryIds[0])
                  : null;

              return (
                <Link
                  key={post.id}
                  href={`/posts/${encodeURIComponent(post.slug)}`}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5"
                >
                  {/* Cover Image or Fallback Header */}
                  {coverUrl ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-white/5">
                      <img
                        src={coverUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-900/80 border-b border-white/5 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-slate-700 group-hover:text-cyan-500/40 transition-colors" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      {/* Topic Tag */}
                      {primaryCategory && (
                        <span className="inline-block font-mono text-[11px] text-cyan-400/90 bg-cyan-950/50 border border-cyan-800/30 px-2 py-0.5 rounded-md">
                          #{primaryCategory.slug}
                        </span>
                      )}

                      <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h2>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {post.summary || post.content.slice(0, 150)}
                      </p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}