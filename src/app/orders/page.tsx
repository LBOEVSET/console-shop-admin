"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useState } from "react"
import { ShoppingCart, Search, ChevronRight } from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  PAID:            "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  PROCESSING:      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  SHIPPED:         "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  COMPLETED:       "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  CANCELLED:       "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  FAILED:          "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
}

const STATUS_TABS = ["ALL", "PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "FAILED"]

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-orders", page, statusFilter, search],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      const r = await api.get(`/orders?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const orders: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  const filtered = orders.filter((o: any) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter
    const matchesSearch =
      !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.username?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleFilterChange = (val: string) => { setStatusFilter(val); setPage(1) }
  const handleSearch = (val: string) => { setSearch(val); setPage(1) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} total orders</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-wrap">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => handleFilterChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${statusFilter === s ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by order # or customer…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <ShoppingCart size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden min-w-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Order #</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Total</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition group">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="font-mono text-xs font-medium text-gray-900 dark:text-white">
                        {order.orderNumber ?? order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-700 dark:text-gray-300">{order.user?.username ?? "—"}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] ?? ""}`}>
                        {order.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-700 dark:text-gray-300">
                      ฿{Number(order.total ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/orders/${order.id}`}>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 transition" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
