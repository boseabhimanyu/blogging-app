"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { api, type Post, type Category, type User, type PublicAuthor } from "@/lib/api";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";

export default function DashboardPostsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, PublicAuthor>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("all");

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Ref to track author IDs already fetched/in-flight
  const fetchedAuthorIdsRef = useRef<Set<string>>(new Set());

  // 1. Initial auth & category resolution
  useEffect(() => {
    async function init() {
      setAuthLoading(true);
      try {
        const [me, catRes] = await Promise.all([
          api.auth.me(),
          api.categories.list().catch(() => []),
        ]);
        setCurrentUser(me);
        setCategories(catRes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to authenticate session");
      } finally {
        setAuthLoading(false);
      }
    }
    init();
  }, []);

  // 2. Fetch posts based strictly on user role
  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;

      let res;
      if (currentUser.role === "admin") {
        if (selectedAuthorId === "me") {
          res = await api.posts.myPosts(params);
        } else {
          if (selectedAuthorId !== "all") {
            params.authorId = selectedAuthorId;
          }
          res = await api.posts.adminList(params);
        }
      } else {
        res = await api.posts.myPosts(params);
      }

      const postList = res.data || [];
      setPosts(postList);

      // 3. For admins, resolve missing author details using public GET /api/v1/authors/:id
      if (currentUser.role === "admin") {
        const uniqueAuthorIds = Array.from(
          new Set(
            postList
              .map((p) => p.authorId)
              .filter((id): id is string => typeof id === "string" && id.length > 0)
          )
        );

        const idsToFetch = uniqueAuthorIds.filter(
          (id) => !fetchedAuthorIdsRef.current.has(id)
        );

        if (idsToFetch.length > 0) {
          idsToFetch.forEach((id) => fetchedAuthorIdsRef.current.add(id));

          Promise.allSettled(
            idsToFetch.map((id) => api.authors.getById(id))
          ).then((results) => {
            const newMap: Record<string, PublicAuthor> = {};
            results.forEach((result, idx) => {
              if (result.status === "fulfilled" && result.value) {
                newMap[idsToFetch[idx]] = result.value;
              }
            });

            if (Object.keys(newMap).length > 0) {
              setAuthorMap((prev) => ({ ...prev, ...newMap }));
            }
          });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [currentUser, statusFilter, selectedAuthorId]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchPosts();
    }
  }, [authLoading, currentUser, fetchPosts]);

  const isAdmin = currentUser?.role === "admin";

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // Client-side text & category filters
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        categoryFilter === "all" ||
        (Boolean(post.categoryIds) && post.categoryIds!.includes(categoryFilter));
      const q = search.toLowerCase().trim();
      const title = post.title?.toLowerCase() || "";
      const slug = post.slug?.toLowerCase() || "";
      const matchesSearch = !q || title.includes(q) || slug.includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [posts, categoryFilter, search]);

  const handleDelete = async (slug?: string) => {
    if (!slug) return;
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    setActionLoading(slug);
    try {
      await api.posts.delete(slug);
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete article");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (post: Post) => {
    if (!post.slug) return;
    const nextStatus = post.status === "published" ? "draft" : "published";
    setActionLoading(post.slug);
    try {
      await api.posts.update(post.slug, {
        status: nextStatus,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : null,
      });
      setPosts((prev) =>
        prev.map((p) => (p.slug === post.slug ? { ...p, status: nextStatus } : p))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        <span className="text-xs">Authenticating...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Articles & Dispatches
            </h1>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                <ShieldCheck className="h-3 w-3" />
                <span>Admin View</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                <UserIcon className="h-3 w-3" />
                <span>Author Workspace</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? "Overseeing platform dispatches across all authors."
              : "Managing your authored publications and drafts."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPosts()}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <Link
            href="/dashboard/posts/editor"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
          >
            <Plus className="h-4 w-4" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className={`grid grid-cols-1 gap-3 ${isAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Admin Author Selector */}
        {isAdmin && (
          <div className="relative">
            <select
              value={selectedAuthorId}
              onChange={(e) => setSelectedAuthorId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Authors</option>
              <option value="me">★ My Articles Only</option>
              <optgroup label="Filter By Specific Author">
                {Object.values(authorMap)
                  .filter((author) => author.id !== currentUser?.id)
                  .map((author) => {
                    const name =
                      `${author.firstName} ${author.lastName}`.trim() || author.username;
                    return (
                      <option key={author.id} value={author.id}>
                        {name} ({author.role})
                      </option>
                    );
                  })}
              </optgroup>
            </select>
          </div>
        )}

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-xs">Loading articles...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-white">No articles found</p>
            <p className="text-xs text-slate-500">
              {search || statusFilter !== "all" || categoryFilter !== "all" || selectedAuthorId !== "all"
                ? "No matching articles for your selected filters."
                : "No articles are available in this view."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Article</th>
                  {isAdmin && <th className="px-5 py-3">Author</th>}
                  <th className="px-5 py-3">Categories</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredPosts.map((post) => {
                  const isBusy = Boolean(post.slug && actionLoading === post.slug);
                  const author = post.authorId ? authorMap[post.authorId] : null;
                  const authorDisplayName = author
                    ? `${author.firstName} ${author.lastName}`.trim() || author.username
                    : post.authorId
                    ? `${post.authorId.slice(0, 8)}...`
                    : "—";

                  return (
                    <tr key={post.id || post.slug} className="hover:bg-white/[0.02] transition-colors">
                      {/* Title & Slug */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-white line-clamp-1">{post.title}</div>
                        <div className="font-mono text-[11px] text-slate-500">/{post.slug}</div>
                      </td>

                      {/* Author Column (Admin View) */}
                      {isAdmin && (
                        <td className="px-5 py-4">
                          {post.authorId ? (
                            <button
                              onClick={() => {
                                if (post.authorId) setSelectedAuthorId(post.authorId);
                              }}
                              className="group inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
                              title={`Filter by author: ${authorDisplayName}`}
                            >
                              <UserIcon className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                              <span className="font-medium">{authorDisplayName}</span>
                              {author?.role && (
                                <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400 uppercase tracking-wider">
                                  {author.role}
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      )}

                      {/* Categories */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.categoryIds && post.categoryIds.length > 0 ? (
                            post.categoryIds.map((cid) => (
                              <span
                                key={cid}
                                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300"
                              >
                                {categoryMap.get(cid) || "Category"}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(post)}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            post.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                          }`}
                          title="Click to toggle status"
                        >
                          {post.status === "published" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span className="capitalize">{post.status}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {post.status === "published" && post.slug && (
                            <Link
                              href={`/posts/${encodeURIComponent(post.slug)}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                              title="View Public Post"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          {post.slug && (
                            <Link
                              href={`/dashboard/posts/editor?slug=${encodeURIComponent(post.slug)}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                              title="Edit Post"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(post.slug)}
                            disabled={isBusy || !post.slug}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            title="Delete Post"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}