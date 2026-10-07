import Link from "next/link";
import { GlassNavbar } from "@/components/ui/GlassNavbar";
import { LiquidPostCard } from "@/components/ui/LiquidPostCard";
import { api, getAssetUrl, type Post } from "@/lib/api";
import { Sparkles, PenLine, ArrowRight } from "lucide-react";

async function getInitialPosts(): Promise<{ posts: Post[] }> {
  try {
    const res = await api.posts.list({ page: 1, limit: 10 });
    // Normalize response whether backend returns raw array or { posts: [] }
    if (Array.isArray(res)) {
      return { posts: res };
    }
    return { posts: res?.posts ?? [] };
  } catch (error) {
    console.error("Failed to load initial posts:", error);
    return { posts: [] };
  }
}

export default async function HomePage() {
  const { posts } = await getInitialPosts();
  
  const safePosts = Array.isArray(posts) ? posts : [];
  const featuredPost = safePosts.length > 0 ? safePosts[0] : null;
  const feedPosts = safePosts.length > 1 ? safePosts.slice(1) : [];

  return (
    <div className="min-h-screen pb-24">
      <GlassNavbar />

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

        {/* Empty State */}
        {safePosts.length === 0 ? (
          <div className="rounded-3xl liquid-glass p-12 text-center my-8 border border-white/10 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-cyan-400">
              <PenLine className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No articles published yet</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              The publication system is live. Sign in to your dashboard studio to write and publish the first dispatch.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:bg-cyan-500/30 transition-all"
            >
              <span>Go to Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Article Card */}
            {featuredPost && (
              <section className="mb-14">
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Featured Dispatch
                  </span>
                </div>
                <Link
                  href={`/posts/${featuredPost.slug}`}
                  className="group block relative rounded-3xl liquid-glass-elevated overflow-hidden border border-white/15 p-6 sm:p-8 hover:border-cyan-400/40 transition-all duration-300 shadow-2xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Cover Preview */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                      {featuredPost.coverImage ? (
                        <img
                          src={getAssetUrl(featuredPost.coverImage)}
                          alt={featuredPost.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-cyan-950/40 to-slate-900">
                          <span className="text-xs font-mono text-cyan-500/50 uppercase tracking-widest">
                            No Cover Image
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Headline */}
                    <div className="flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {featuredPost.categorySlugs && featuredPost.categorySlugs.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {featuredPost.categorySlugs.map((cat) => (
                              <span
                                key={cat}
                                className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                              >
                                #{cat}
                              </span>
                            ))}
                          </div>
                        )}

                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                          {featuredPost.title}
                        </h2>

                        {featuredPost.summary && (
                          <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed font-light">
                            {featuredPost.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
                        <span>
                          By {featuredPost.authorUsername ? `@${featuredPost.authorUsername}` : "Author"}
                        </span>
                        <div className="inline-flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                          <span>Read Story</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Feed Grid */}
            {feedPosts.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Latest Dispatches
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {feedPosts.map((post) => (
                    <LiquidPostCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}