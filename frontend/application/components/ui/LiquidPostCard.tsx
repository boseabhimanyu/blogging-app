"use client";

import Link from "next/link";
import { Calendar, User, ArrowUpRight } from "lucide-react";
import { getAssetUrl, type Post } from "@/lib/api";

interface LiquidPostCardProps {
  post: Post & {
    authorUsername?: string;
    categorySlugs?: string[];
  };
  featured?: boolean;
}

export function LiquidPostCard({ post, featured = false }: LiquidPostCardProps) {
  const displayDate = post.publishedAt || post.createdAt;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <article
      className={`group relative flex flex-col rounded-2xl p-4 transition-all duration-300 liquid-glass hover:liquid-glass-elevated hover:-translate-y-1.5 ${
        featured ? "md:grid md:grid-cols-2 md:gap-6 md:p-6" : ""
      }`}
    >
      {/* Dynamic Specular Edge Highlight on Hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      {/* 16:9 Cover Image Container */}
      <Link
        href={`/posts/${encodeURIComponent(post.slug)}`}
        className={`block overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 aspect-[16/9] ${
          featured ? "mb-0 h-full w-full" : "mb-4 w-full"
        }`}
      >
        {post.coverImage ? (
          <img
            src={getAssetUrl(post.coverImage)}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-slate-600 text-xs tracking-wider uppercase font-semibold">
            No Cover
          </div>
        )}
      </Link>

      {/* Content Column */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Categories Pill List (if present) */}
          {post.categorySlugs && post.categorySlugs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categorySlugs.map((categorySlug: string) => (
                <Link
                  key={categorySlug}
                  href={`/category/${encodeURIComponent(categorySlug)}`}
                  className="rounded-md border border-cyan-500/20 bg-cyan-950/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-cyan-400 backdrop-blur-md transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
                >
                  #{categorySlug}
                </Link>
              ))}
            </div>
          )}

          {/* Title with Arrow Icon */}
          <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block">
            <h3
              className={`font-semibold tracking-tight text-white transition-colors group-hover:text-cyan-200 ${
                featured ? "text-xl md:text-2xl" : "text-lg line-clamp-2"
              }`}
            >
              {post.title}
              <ArrowUpRight className="inline-block ml-1 h-4 w-4 opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-cyan-400" />
            </h3>
          </Link>

          {/* Excerpt / Summary */}
          {(post.summary || post.content) && (
            <p className="mt-2 text-sm leading-relaxed text-slate-400 line-clamp-2">
              {post.summary || post.content.slice(0, 140)}
            </p>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {post.authorUsername ? `@${post.authorUsername}` : "Author"}
            </span>
          </div>

          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time>{formattedDate}</time>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}