"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Category, type CreatePostPayload } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  FolderTree,
  Send,
  Save,
} from "lucide-react";

export default function NewPostPage() {
  const router = useRouter();

  // Categories list for selection
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await api.categories.list();
        setCategories(data);
      } catch (err: unknown) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Auto-generate slug from title unless manually changed
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustom) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (submitStatus: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      setFeedback({
        type: "error",
        text: "Title and Content are required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: CreatePostPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim() || undefined,
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      categoryIds: selectedCategoryIds,
      tagIds: [],
      status: submitStatus,
    };

    try {
      const newPost = await api.posts.create(payload);
      setFeedback({
        type: "success",
        text: `Post created successfully as ${submitStatus}!`,
      });
      setTimeout(() => {
        router.push(`/dashboard/posts`);
      }, 1000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create post",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/posts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Posts</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create New Article
          </h1>
          <p className="text-xs text-slate-400">
            Write, categorize, and publish content to your platform.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
            className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-sm backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Form Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Editor) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 space-y-4 backdrop-blur-md">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Post Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Mastering Goroutines and Channels"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-base font-semibold text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Slug (URL Identifier)
              </label>
              <div className="flex rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden focus-within:border-cyan-500">
                <span className="px-3 py-2 text-xs text-slate-500 bg-white/[0.02] border-r border-white/5 select-none font-mono">
                  /posts/
                </span>
                <input
                  type="text"
                  placeholder="mastering-goroutines-and-channels"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugCustom(true);
                    setSlug(e.target.value);
                  }}
                  className="w-full bg-transparent px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Summary / Excerpt
              </label>
              <textarea
                rows={2}
                placeholder="A short hook describing what this article covers..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Content Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-400">
                  Article Content (Markdown supported) *
                </label>
                <span className="text-[10px] text-slate-500">
                  {content.length} characters
                </span>
              </div>
              <textarea
                rows={16}
                placeholder="Write your article in Markdown here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column (Meta & Settings) */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              <span>Cover Image</span>
            </div>
            <input
              type="text"
              placeholder="Path or URL (e.g. Uploads/coverimage/xyz.webp)"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            {coverImage && (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-2 overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={
                    coverImage.startsWith("http")
                      ? coverImage
                      : `http://localhost:5000/${coverImage.replace(/^\//, "")}`
                  }
                  alt="Cover preview"
                  className="h-full w-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <FolderTree className="h-4 w-4 text-cyan-400" />
              <span>Categories</span>
            </div>

            {loadingCategories ? (
              <div className="py-4 text-center text-slate-500 text-xs">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-cyan-400" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-xs text-slate-500">
                No categories found. Create categories first in Category Management.
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {categories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all text-xs ${
                        isChecked
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-[10px] font-mono opacity-60">
                        #{cat.slug}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}