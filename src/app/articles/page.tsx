"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useState } from "react"
import { Newspaper, Plus, Search, ChevronRight, Eye, EyeOff } from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

const TYPE_COLORS: Record<string, string> = {
  NEWS:         "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PROMOTION:    "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  ANNOUNCEMENT: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
}

const FILTERS = ["ALL", "NEWS", "PROMOTION", "ANNOUNCEMENT"] as const

export default function ArticlesAdminPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-articles", page, typeFilter],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      if (typeFilter !== "ALL") q.set("type", typeFilter)
      const r = await api.get(`/articles/admin/all?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const articles: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  const filtered = search
    ? articles.filter((a: any) =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.summary?.toLowerCase().includes(search.toLowerCase()))
    : articles

  const published = articles.filter((a: any) => a.isPublished).length

  const handleTypeChange = (val: string) => { setTypeFilter(val); setPage(1) }
  const handleSearch = (val: string) => { setSearch(val); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total · {published} published</p>
        </div>
        <Link href="/articles/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> New Article
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {FILTERS.map(f => (
            <button key={f} onClick={() => handleTypeChange(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                typeFilter === f ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by title or summary…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Newspaper size={40} className="mb-3 opacity-40" /><p className="text-sm">No articles found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[72px_1fr_130px_130px_100px_44px] gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span></span><span>Article</span><span>Type</span><span>Published At</span><span>Status</span><span></span>
          </div>
          {filtered.map((a: any) => {
            const thumbnail = a.media?.[0]?.url
            const typeColor = TYPE_COLORS[a.type] ?? "bg-gray-100 text-gray-600"
            const publishedAt = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"
            return (
              <div key={a.id} className="grid grid-cols-[72px_1fr_130px_130px_100px_44px] gap-4 items-center px-4 py-3.5 border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <div className="w-16 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                  {thumbnail ? <img src={thumbnail} alt={a.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Newspaper size={18} /></div>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">/{a.slug}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.summary}</p>
                </div>
                <div><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>{a.type}</span></div>
                <div className="text-sm text-gray-500">{publishedAt}</div>
                <div className="flex items-center gap-1.5">
                  {a.isPublished ? <><Eye size={13} className="text-green-500" /><span className="text-xs font-medium text-green-600 dark:text-green-400">Published</span></>
                    : <><EyeOff size={13} className="text-gray-400" /><span className="text-xs font-medium text-gray-500">Draft</span></>}
                </div>
                <Link href={`/articles/${a.id}`} className="flex items-center justify-center text-gray-400 hover:text-blue-600 transition"><ChevronRight size={18} /></Link>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
