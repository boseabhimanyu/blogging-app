import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { GlassNavbar } from "@/components/ui/GlassNavbar";
import { api, getAssetUrl, type Post } from "@/lib/api";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await api.posts.getBySlug(slug);
    return {
      title: `${post.title} | Lumina`,
      description: post.summary || post.title,
      openGraph: {
        title: post.title,
        description: post.summary,
        images: post.coverImage ? [getAssetUrl(post.coverImage)] : [],
      },
    };
  } catch {
    return {
      title: "Article Not Found | Lumina",
    };
  }
}

// Calculate rough reading time from HTML string
function getReadingTime(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  let post: Post;
  try {
    post = await api.posts.getBySlug(slug);
  } catch {
    notFound();
  }

  const readingTime = getReadingTime(post.content || "");
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen pb-24">
      <GlassNavbar />

      <main className="mx-auto max-w-4xl px-4 pt-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dispatches</span>
          </Link>
        </div>

        {/* Article Header Card */}
        <header className="rounded-3xl liquid-glass p-6 sm:p-10 mb-8">
          {/* Category Badges */}
          {post.categorySlugs && post.categorySlugs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categorySlugs.map((categorySlug) => (
                <Link
                  key={categorySlug}
                  href={`/categories/${categorySlug}`}
                  className="rounded-lg border border-cyan-500/25 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-300 backdrop-blur-md hover:border-cyan-400/50 transition-colors"
                >
                  #{categorySlug}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            {post.title}
          </h1>

          {/* Summary Excerpt */}
          {post.summary && (
            <p className="text-lg text-slate-300 leading-relaxed mb-6 font-light">
              {post.summary}
            </p>
          )}

          {/* Author & Timestamp Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Written by
                </span>
                {post.authorUsername ? (
                  <Link
                    href={`/authors/${post.authorUsername}`}
                    className="font-medium text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    @{post.authorUsername}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-200">Author</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                <time>{formattedDate}</time>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </header>

        {/* 16:9 Cover Banner (if present) */}
        {post.coverImage && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-white/10 aspect-[16/9] w-full shadow-2xl">
            <img
              src={getAssetUrl(post.coverImage)}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article className="rounded-3xl liquid-glass p-6 sm:p-12">
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
    </div>
  );
}