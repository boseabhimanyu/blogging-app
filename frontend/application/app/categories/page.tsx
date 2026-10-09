"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api, type Category } from "@/lib/api";
import {
  FolderTree,
  Search,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function PublicCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.categories.list();
        setCategories(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load categories"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Explore Topics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Browse by Category
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Discover articles, guides, and updates curated across our core topics.
          </p>

          {/* Search Bar */}
          <div className="relative pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all shadow-lg shadow-black/20"
            />
          </div>
        </div>

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
            <span className="text-xs">Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-slate-900/30 p-8 space-y-2">
            <FolderTree className="h-10 w-10 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-medium text-white">No categories found</p>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? `No topic matches "${searchQuery}". Try a different keyword.`
                : "No categories have been published yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/posts?category=${encodeURIComponent(category.slug)}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-cyan-400/90 bg-cyan-950/50 border border-cyan-800/30 px-2 py-0.5 rounded-md">
                      #{category.slug}
                    </span>
                    <span className="text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                      <FileText className="h-4 w-4" />
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {category.name}
                  </h2>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {category.description || "Browse articles under this topic."}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-cyan-300 transition-colors">
                  <span>View Articles</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}