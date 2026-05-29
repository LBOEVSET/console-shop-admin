"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Trash2, Plus, Save, ArrowLeft } from "lucide-react"

const CATEGORIES = ["GAME", "TICKET", "MERCHANDISE", "OTHER"]

interface MediaItem { type: string; url: string; sortOrder: number }

interface EventFormData {
  title:       string
  slug:        string
  description: string
  category:    string
  date:        string
  venue:       string
  price:       string
  stock:       string
  isActive:    boolean
  media:       MediaItem[]
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export default function EventForm({ initial, id }: { initial?: any; id?: string }) {
  const router      = useRouter()
  const qc          = useQueryClient()
  const isEdit      = !!id

  const [form, setForm] = useState<EventFormData>({
    title:       initial?.title       ?? "",
    slug:        initial?.slug        ?? "",
    description: initial?.description ?? "",
    category:    initial?.category    ?? "OTHER",
    date:        initial?.date        ? new Date(initial.date).toISOString().slice(0, 16) : "",
    venue:       initial?.venue       ?? "",
    price:       String(initial?.price    ?? "0"),
    stock:       String(initial?.stock    ?? "0"),
    isActive:    initial?.isActive    ?? true,
    media:       initial?.media       ?? [],
  })
  const [error, setError] = useState("")

  const saveMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        stock: parseInt(data.stock)   || 0,
      }
      if (isEdit) {
        return api.patch(`/events/${id}`, payload)
      }
      return api.post("/events", payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] })
      router.push("/events")
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? "Save failed")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] })
      router.push("/events")
    },
  })

  function set(field: keyof EventFormData, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function autoSlug() {
    if (!form.slug) set("slug", slugify(form.title))
  }

  function addMedia() {
    set("media", [...form.media, { type: "IMAGE", url: "", sortOrder: form.media.length }])
  }

  function removeMedia(i: number) {
    set("media", form.media.filter((_, idx) => idx !== i))
  }

  function updateMedia(i: number, field: keyof MediaItem, val: string | number) {
    set("media", form.media.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push("/events")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft size={15} /> Back to Events
      </button>

      <h1 className="text-2xl font-bold">{isEdit ? "Edit Event" : "New Event"}</h1>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 space-y-5">
        {/* Title + Slug */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onBlur={autoSlug}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summer Gaming Fest"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Slug *</label>
            <input
              value={form.slug}
              onChange={e => set("slug", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="summer-gaming-fest"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description *</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => set("description", e.target.value)}
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Event description…"
          />
        </div>

        {/* Category + Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date *</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={e => set("date", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Venue + Price + Stock */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Venue</label>
            <input
              value={form.venue}
              onChange={e => set("venue", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bangkok Arena"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={e => set("price", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={e => set("stock", e.target.value)}
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("isActive", !form.isActive)}
            className={`w-10 h-5.5 rounded-full relative transition-colors ${form.isActive ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Active (visible to public)</span>
        </label>
      </div>

      {/* Media */}
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Media</h2>
          <button
            onClick={addMedia}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus size={13} /> Add media
          </button>
        </div>

        {form.media.length === 0 && (
          <p className="text-sm text-gray-400">No media added yet.</p>
        )}

        {form.media.map((m, i) => (
          <div key={i} className="flex gap-3 items-start">
            <select
              value={m.type}
              onChange={e => updateMedia(i, "type", e.target.value)}
              className="border dark:border-gray-700 rounded-lg px-2 py-2 text-xs bg-white dark:bg-gray-800 w-28"
            >
              <option value="IMAGE">IMAGE</option>
              <option value="VIDEO">VIDEO</option>
              <option value="EXTERNAL_VIDEO">EXT_VIDEO</option>
            </select>
            <input
              value={m.url}
              onChange={e => updateMedia(i, "url", e.target.value)}
              placeholder="https://..."
              className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={m.sortOrder}
              onChange={e => updateMedia(i, "sortOrder", parseInt(e.target.value) || 0)}
              className="border dark:border-gray-700 rounded-lg px-2 py-2 text-xs bg-white dark:bg-gray-800 w-16"
            />
            <button onClick={() => removeMedia(i)} className="text-red-400 hover:text-red-600 pt-2">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Save size={15} />
          {saveMutation.isPending ? "Saving…" : "Save Event"}
        </button>

        {isEdit && (
          <button
            onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate() }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm transition"
          >
            <Trash2 size={15} />
            Delete Event
          </button>
        )}
      </div>
    </div>
  )
}
