import Link from "next/link";

import { api, getAssetUrl, type Post } from "@/lib/api";
import { Sparkles, Calendar, ArrowRight, FolderTree } from "lucide-react";

async function getInitialPosts(): Promise<Post[]> {
  try {
    const res = await api.posts.list({ page: 1, limit: 5 });
    // Normalize response from { data: Post[] } or fallback shapes
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray((res as any)?.posts)) return (res as any).posts;
    return [];
  } catch (error) {
    console.error("Failed to load initial posts:", error);
    return [];
  }
}

export default async function HomePage() {
  const posts = await getInitialPosts();
  const latestFive = posts.slice(0, 5);

  return (
    <div className="min-h-screen pb-24 bg-slate-950 text-slate-100">

      <main className="mx-auto max-w-6xl px-4 pt-10">
        {/* Hero Section */}
        <section className="mb-12 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dispatches & Engineering Notes</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Thoughts, architectures, <br className="hidden sm:block" />
            and liquid interfaces.
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            Exploring modern web platforms, distributed Go systems, and thoughtful UI design.
          </p>
        </section>

        {/* Translucent Container: Last 5 Posts + More Categories Button */}
        <section className="rounded-3xl liquid-glass p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl bg-slate-900/40 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Latest Publications
              </h2>
              <p className="text-xs text-slate-400">
                Recent articles, guides, and engineering updates
              </p>
            </div>

            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Explore Categories</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {latestFive.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-white">No articles published yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Check back soon or browse our topic categories below.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {latestFive.map((post) => {
                const cover = post.coverImage ? getAssetUrl(post.coverImage) : null;
                const displayDate = post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString()
                  : new Date(post.createdAt).toLocaleDateString();

                return (
                  <Link
                    key={post.id || post.slug}
                    href={`/posts/${encodeURIComponent(post.slug)}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 -mx-2 rounded-2xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {cover ? (
                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
                          <img
                            src={cover}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-20 shrink-0 rounded-xl border border-white/10 bg-slate-900/80 flex items-center justify-center text-slate-600">
                          <span className="text-[10px] font-mono">Article</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                          {post.summary || post.content.slice(0, 100)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{displayDate}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* More Button navigating to Categories */}
          <div className="pt-4 border-t border-white/10 flex justify-center">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]"
            >
              <FolderTree className="h-4 w-4" />
              <span>Explore More</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}