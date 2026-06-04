"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useState } from "react"
import { CalendarDays, Plus, Search, ChevronRight } from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

const CATEGORY_COLORS: Record<string, string> = {
  GAME:        "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  TICKET:      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MERCHANDISE: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  OTHER:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
}

const FILTERS = ["ALL", "GAME", "TICKET", "MERCHANDISE", "OTHER"] as const

export default function EventsAdminPage() {
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState<string>("ALL")
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-events", page, catFilter, showInactive],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      if (catFilter !== "ALL") q.set("category", catFilter)
      if (!showInactive) q.set("isActive", "true")
      const r = await api.get(`/events/admin/all?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const events: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  const filtered = search ? events.filter((e: any) => e.title?.toLowerCase().includes(search.toLowerCase())) : events

  const handleCatChange = (val: string) => { setCatFilter(val); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <Link href="/events/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> New Event
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => handleCatChange(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                catFilter === f ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title…"
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer whitespace-nowrap self-center">
          <input type="checkbox" checked={showInactive} onChange={e => { setShowInactive(e.target.checked); setPage(1) }} className="rounded" />
          Show inactive
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CalendarDays size={40} className="mb-3 opacity-40" /><p className="text-sm">No events found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[64px_1fr_140px_140px_100px_80px_44px] gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span></span><span>Event</span><span>Category</span><span>Date</span><span>Price</span><span>Stock</span><span></span>
          </div>
          {filtered.map((ev: any) => {
            const thumbnail = ev.media?.[0]?.url
            const catColor = CATEGORY_COLORS[ev.category] ?? CATEGORY_COLORS.OTHER
            const dateStr = ev.date ? new Date(ev.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"
            return (
              <div key={ev.id} className="grid grid-cols-[64px_1fr_140px_140px_100px_80px_44px] gap-4 items-center px-4 py-3.5 border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <div className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {thumbnail ? <img src={thumbnail} alt={ev.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><CalendarDays size={16} /></div>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{ev.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">/{ev.slug}</p>
                  {ev.venue && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.venue}</p>}
                </div>
                <div><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>{ev.category}</span></div>
                <div className="text-sm text-gray-500">{dateStr}</div>
                <div className="text-sm font-medium">{Number(ev.price) === 0 ? <span className="text-green-600">Free</span> : `$${Number(ev.price).toFixed(2)}`}</div>
                <div className={`text-sm font-medium ${ev.stock === 0 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>{ev.stock}</div>
                <Link href={`/events/${ev.id}`} className="flex items-center justify-center text-gray-400 hover:text-blue-600 transition"><ChevronRight size={18} /></Link>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
