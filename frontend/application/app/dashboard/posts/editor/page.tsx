"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, X, AlertCircle } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { PostEditor } from "@/components/editor/PostEditor";
import { api, type Category } from "@/lib/api";

export default function PostEditorPage() {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  
  // Cover image states
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on load
  useEffect(() => {
    api.categories
      .list()
      .then((cats) => setAvailableCategories(cats))
      .catch(() => setAvailableCategories([]));
  }, []);

  // Validate landscape image on selection
  const handleImageSelect = (file: File) => {
    setImageError(null);

    // 1. File size check (<= 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Cover image must be 2MB or less.");
      return;
    }

    // 2. Validate dimensions (width >= 800 and width > height)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      if (img.width < 800) {
        setImageError("Cover image width must be at least 800px.");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      if (img.width <= img.height) {
        setImageError("Cover image must be landscape (width greater than height).");
        URL.revokeObjectURL(objectUrl);
        return;
      }

      setCoverFile(file);
      setCoverPreview(objectUrl);
    };

    img.onerror = () => {
      setImageError("Failed to parse image file.");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const removeCoverImage = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (publishStatus: "draft" | "published") => {
    setError(null);
    if (!title.trim()) {
      setError("Please provide a title for your article.");
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      setError("Article content cannot be empty.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create post record (receives slug from Go backend)
      const post = await api.posts.create({
        title: title.trim(),
        summary: summary.trim(),
        content,
        categorySlugs: selectedCategories,
        status: publishStatus,
      });

      // 2. Upload cover image using the slug route if provided
      if (coverFile) {
       // await api.posts.uploadCoverImage(post.slug, coverFile);
      }

      // 3. Redirect seamlessly to the new post
      router.push(`/posts/${post.slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create post.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <Link
          href="/dashboard/posts"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Articles</span>
        </Link>

        <div className="flex items-center gap-3">
          <GlassButton
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
          >
            Save Draft
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit("published")}
          >
            Publish Article
          </GlassButton>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-sm text-rose-300 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Writing Area (70% on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title..."
              className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold text-white placeholder-slate-600 focus:outline-none tracking-tight border-none"
            />
          </div>

          {/* Short Excerpt / Summary */}
          <div>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a short summary for feed cards and search results..."
              className="w-full rounded-xl liquid-glass-inset p-3.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
            />
          </div>

          {/* TipTap Rich Content Editor */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Content
            </label>
            <PostEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Right Column: Metadata Dock (30% on desktop) */}
        <div className="space-y-6">
          {/* Cover Image Upload Card */}
          <div className="rounded-2xl liquid-glass p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Cover Image</h3>
            <p className="text-xs text-slate-400 mb-4">
              Landscape only (width &gt; height, min 800px width, max 2MB).
            </p>

            {coverPreview ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="absolute top-2 right-2 rounded-full bg-slate-950/80 p-1.5 text-slate-300 hover:text-white hover:bg-rose-500/80 transition-colors backdrop-blur-md"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/40 transition-colors p-4 text-center group"
              >
                <ImagePlus className="h-8 w-8 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
                <span className="text-xs font-medium text-slate-300">
                  Upload landscape cover
                </span>
                <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />

            {imageError && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{imageError}</span>
              </p>
            )}
          </div>

          {/* Categories Selector */}
          <div className="rounded-2xl liquid-glass p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Categories</h3>
            <p className="text-xs text-slate-400 mb-3">
              Tag your post for relevant discovery.
            </p>

            {availableCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                          : "bg-white/5 text-slate-400 border border-white/10 hover:text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      #{cat.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No categories found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}