"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import {
  ArrowLeft, Save, Trash2,
  Eye, EyeOff, ToggleLeft, ToggleRight,
} from "lucide-react"

type ArticleType = "NEWS" | "PROMOTION" | "ANNOUNCEMENT"

interface ArticleFormProps {
  /** undefined = create mode */
  articleId?: string
  initial?: {
    type: ArticleType
    title: string
    slug: string
    summary: string
    content: string
    reference: string
    isPublished: boolean
    publishedAt: string
  }
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

const textareaCls =
  "w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const TYPE_COLORS: Record<ArticleType, string> = {
  NEWS:         "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  PROMOTION:    "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
  ANNOUNCEMENT: "border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
}

export default function ArticleForm({ articleId, initial }: ArticleFormProps) {
  const isEdit = !!articleId
  const router = useRouter()
  const qc = useQueryClient()

  const [type, setType] = useState<ArticleType>(initial?.type ?? "NEWS")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugManual, setSlugManual] = useState(false)
  const [summary, setSummary] = useState(initial?.summary ?? "")
  const [content, setContent] = useState(initial?.content ?? "")
  const [reference, setReference] = useState(initial?.reference ?? "")
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)
  const [publishedAt, setPublishedAt] = useState(
    initial?.publishedAt
      ? new Date(initial.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  /* auto-generate slug from title (unless manually edited) */
  useEffect(() => {
    if (!slugManual) setSlug(slugify(title))
  }, [title, slugManual])

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 2800)
  }

  /* save (create or update) */
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { type, title, slug, summary, content, reference, isPublished, publishedAt }
      return isEdit
        ? api.patch(`/articles/${articleId}`, payload)
        : api.post("/articles", payload)
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] })
      flash("Saved successfully", true)
      if (!isEdit) {
        const newId = res.data.data?.id
        if (newId) router.push(`/articles/${newId}`)
      }
    },
    onError: (err: any) => {
      flash(err?.response?.data?.message ?? "Save failed", false)
    },
  })

  /* delete */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/articles/${articleId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] })
      router.push("/articles")
    },
    onError: (err: any) => {
      flash(err?.response?.data?.message ?? "Delete failed", false)
    },
  })

  const handleDelete = () => {
    if (!confirm("Delete this article? This cannot be undone.")) return
    deleteMutation.mutate()
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/articles" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">{isEdit ? "Edit Article" : "New Article"}</h1>
        </div>

        <div className="flex items-center gap-2">
          {msg && (
            <span className={`text-sm px-3 py-1.5 rounded-lg ${
              msg.ok
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {msg.text}
            </span>
          )}
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Save size={15} />
            {saveMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: main content ─────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Core info */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Content</h2>

            <Field label="Title">
              <input
                className={inputCls}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Article title…"
              />
            </Field>

            <Field label="Slug">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                <input
                  className={inputCls + " pl-6"}
                  value={slug}
                  onChange={e => { setSlugManual(true); setSlug(e.target.value) }}
                  placeholder="auto-generated-from-title"
                />
              </div>
              {!slugManual && (
                <p className="text-[11px] text-gray-400 mt-0.5">Auto-generated — edit to override</p>
              )}
            </Field>

            <Field label="Summary">
              <textarea
                className={textareaCls}
                rows={2}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Short description shown in cards and feeds…"
              />
            </Field>

            <Field label="Content">
              <textarea
                className={textareaCls}
                rows={12}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Full article content…"
              />
            </Field>

            <Field label="Reference URL (optional)">
              <input
                className={inputCls}
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="https://…"
                type="url"
              />
            </Field>
          </div>
        </div>

        {/* ── RIGHT: settings sidebar ─────────────── */}
        <div className="space-y-5">

          {/* Publish status */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Publishing</h2>

            <button
              onClick={() => setIsPublished(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition ${
                isPublished
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPublished
                  ? <Eye size={15} className="text-green-500" />
                  : <EyeOff size={15} className="text-gray-400" />
                }
                <span className={`text-sm font-semibold ${isPublished ? "text-green-700 dark:text-green-400" : "text-gray-500"}`}>
                  {isPublished ? "Published" : "Draft"}
                </span>
              </div>
              {isPublished
                ? <ToggleRight size={22} className="text-green-500" />
                : <ToggleLeft size={22} className="text-gray-400" />
              }
            </button>

            <Field label="Publish Date">
              <input
                type="datetime-local"
                className={inputCls}
                value={publishedAt}
                onChange={e => setPublishedAt(e.target.value)}
              />
            </Field>
          </div>

          {/* Type */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Type</h2>

            <div className="space-y-2">
              {(["NEWS", "PROMOTION", "ANNOUNCEMENT"] as ArticleType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                    type === t
                      ? TYPE_COLORS[t]
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {t}
                  {type === t && (
                    <span className="text-[10px] border border-current px-1.5 py-0.5 rounded-full">selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview card */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Preview</h2>
            <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
              <div className="p-3 space-y-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[type]}`}>{type}</span>
                <p className="text-xs font-semibold line-clamp-2 mt-1">{title || "Untitled"}</p>
                <p className="text-[11px] text-gray-500 line-clamp-2">{summary || "No summary"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
