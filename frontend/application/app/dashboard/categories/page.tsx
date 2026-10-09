"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Category } from "@/lib/api";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getCategories();
      setCategories(data);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load categories",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const openCreateModal = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setIsCreateOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const created = await api.admin.createCategory({
        name: formName.trim(),
        description: formDescription.trim(),
      });
      setCategories((prev) => [created, ...prev]);
      setIsCreateOpen(false);
      setFeedback({
        type: "success",
        text: `Category "${created.name}" created successfully.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create category",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formName.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const updated = await api.admin.updateCategory(editingCategory.id, {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim(),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setEditingCategory(null);
      setFeedback({
        type: "success",
        text: `Category "${updated.name}" updated successfully.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update category",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.admin.deleteCategory(deletingCategory.id);
      setCategories((prev) =>
        prev.filter((c) => c.id !== deletingCategory.id)
      );
      setFeedback({
        type: "success",
        text: `Category "${deletingCategory.name}" deleted successfully.`,
      });
      setDeletingCategory(null);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete category",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Category Management
          </h1>
          <p className="text-sm text-slate-400">
            Create, modify, and manage platform categories and slugs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Feedback Alerts */}
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

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search categories by name, slug, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Categories Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            {searchQuery
              ? "No categories match your search criteria."
              : "No categories found. Create the first one above."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Slug</th>
                  <th className="px-5 py-3.5 font-medium">Description</th>
                  <th className="px-5 py-3.5 font-medium">Created</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium text-white">
                      {cat.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-cyan-300/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-md">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-slate-400">
                      {cat.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 transition-all"
                          title="Edit Category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1.5 rounded-lg border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white">
                Create Category
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Space"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the category topics..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{isSubmitting ? "Creating..." : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white">
                Edit Category
              </h2>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. space-tech"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">
                  Unique identifier used in URLs.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <h2 className="text-base font-semibold text-white">
                Delete Category?
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                "{deletingCategory.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingCategory(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-medium text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{isSubmitting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}