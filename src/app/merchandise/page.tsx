"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useState } from "react"
import { ShoppingBag, Plus, Search, ChevronRight } from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

const TYPE_COLORS: Record<string, string> = {
  APPAREL:     "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  ACCESSORY:   "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  COLLECTIBLE: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  PERIPHERAL:  "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  OTHER:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
}

const FILTERS = ["ALL", "APPAREL", "ACCESSORY", "COLLECTIBLE", "PERIPHERAL", "OTHER"] as const

export default function MerchandiseAdminPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-merchandise", page, typeFilter, showInactive],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      if (typeFilter !== "ALL") q.set("type", typeFilter)
      if (!showInactive) q.set("isActive", "true")
      const r = await api.get(`/merchandise/admin/all?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const items: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  const filtered = search ? items.filter((m: any) => m.title?.toLowerCase().includes(search.toLowerCase())) : items

  const handleTypeChange = (val: string) => { setTypeFilter(val); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merchandise</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total</p>
        </div>
        <Link href="/merchandise/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> New Item
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg flex-wrap">
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
          <ShoppingBag size={40} className="mb-3 opacity-40" /><p className="text-sm">No merchandise found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[64px_1fr_140px_120px_80px_60px_60px_44px] gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span></span><span>Item</span><span>Type</span><span>Price</span><span>Stock</span><span>SEE</span><span>CLICK</span><span></span>
          </div>
          {filtered.map((m: any) => {
            const thumbnail = m.media?.[0]?.url
            const typeColor = TYPE_COLORS[m.type] ?? TYPE_COLORS.OTHER
            return (
              <div key={m.id} className="grid grid-cols-[64px_1fr_140px_120px_80px_60px_60px_44px] gap-4 items-center px-4 py-3.5 border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                <div className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {thumbnail ? <img src={thumbnail} alt={m.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={16} /></div>}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{m.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">/{m.slug}</p>
                </div>
                <div><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor}`}>{m.type}</span></div>
                <div className="text-sm font-medium">{Number(m.price) === 0 ? <span className="text-green-600">Free</span> : `$${Number(m.price).toFixed(2)}`}</div>
                <div className={`text-sm font-medium ${m.stock === 0 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>{m.stock}</div>
                <div className="text-sm text-gray-500">{m.seeCount ?? 0}</div>
                <div className="text-sm text-gray-500">{m.clickCount ?? 0}</div>
                <Link href={`/merchandise/${m.id}`} className="flex items-center justify-center text-gray-400 hover:text-blue-600 transition"><ChevronRight size={18} /></Link>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
