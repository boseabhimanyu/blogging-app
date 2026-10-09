"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, type Post, type Category, getAssetUrl } from "@/lib/api";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Share2,
  Check,
  FolderTree,
  BookOpen,
} from "lucide-react";

interface SinglePostPageProps {
  params: Promise<{ slug: string }>;
}

export default function SinglePostPage({ params }: SinglePostPageProps) {
  const { slug } = use(params);

  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPostData() {
      setLoading(true);
      setError(null);
      try {
        const [postData, categoriesData] = await Promise.all([
          api.posts.getBySlug(slug),
          api.categories.list().catch(() => []),
        ]);
        setPost(postData);
        setCategories(categoriesData);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load this article"
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPostData();
    }
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find category details for all IDs assigned to this post
  const matchedCategories = categories.filter((cat) =>
    post?.categoryIds?.includes(cat.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <span className="text-xs">Loading article...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 max-w-md space-y-4">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Post Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || `No article found matching "${slug}".`}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Articles</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const coverUrl = post.coverImage ? getAssetUrl(post.coverImage) : null;

  return (
    <article className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation & Utilities */}
        <div className="flex items-center justify-between">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Articles</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            title="Copy post link"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Categories Badges */}
        {matchedCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {matchedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${encodeURIComponent(cat.slug)}`}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-400/90 bg-cyan-950/50 border border-cyan-800/30 px-2.5 py-1 rounded-lg hover:bg-cyan-900/40 hover:border-cyan-700/50 transition-all"
              >
                <FolderTree className="h-3 w-3" />
                <span>#{cat.slug}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Post Title & Metadata */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
              {post.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date(post.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
            </div>
            <span>•</span>
            <span className="capitalize">{post.status}</span>
          </div>
        </div>

        {/* Cover Image Banner */}
        {coverUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
            <img
              src={coverUrl}
              alt={post.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-6 sm:p-8 backdrop-blur-sm">
          <div className="text-slate-200 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base selection:bg-cyan-500/20 selection:text-cyan-200">
            {post.content}
          </div>
        </div>

        {/* Article Footer */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Articles</span>
          </Link>

          {matchedCategories.length > 0 && (
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Filed under:</span>
              <span className="text-cyan-300 font-medium">
                {matchedCategories.map((c) => c.name).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}