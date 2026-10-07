"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from "lucide-react";

interface PostEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function PostEditor({
  content,
  onChange,
  placeholder = "Write your story here...",
}: PostEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              "rounded-xl bg-slate-950/90 border border-white/10 p-4 font-mono text-sm text-cyan-300 my-4 overflow-x-auto",
          },
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-cyan-400 underline underline-offset-4 hover:text-cyan-300",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[380px] text-slate-200 leading-relaxed text-base px-5 py-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col rounded-2xl liquid-glass-inset overflow-hidden">
      {/* Liquid Glass Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/5 bg-white/[0.02] px-3 py-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("bold")
              ? "bg-cyan-500/20 text-cyan-300 font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("italic")
              ? "bg-cyan-500/20 text-cyan-300 font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("strike")
              ? "bg-cyan-500/20 text-cyan-300 font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("link")
              ? "bg-cyan-500/20 text-cyan-300 font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("bulletList")
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("orderedList")
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("blockquote")
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded-lg text-xs transition-colors ${
            editor.isActive("codeBlock")
              ? "bg-white/15 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  );
}