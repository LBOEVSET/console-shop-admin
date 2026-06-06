"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useState } from "react"
import { CreditCard, Search, Ban } from "lucide-react"
import Pagination from "@/components/Pagination"
import Image from "next/image"

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  EXPIRED:   "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
}

const STATUS_TABS = ["ALL", "ACTIVE", "EXPIRED", "CANCELLED"]

export default function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page, statusFilter],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      if (statusFilter !== "ALL") q.set("status", statusFilter)
      const r = await api.get(`/subscription/admin/transactions?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/subscription/admin/transactions/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-subscriptions"] }),
  })

  const transactions: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  const filtered = transactions.filter((t: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.user?.email?.toLowerCase().includes(q) ||
      t.user?.username?.toLowerCase().includes(q) ||
      t.plan?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} total transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-wrap">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${statusFilter === s
                  ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by user or plan…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">End</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No transactions found.</td></tr>
            ) : filtered.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {t.user?.profileImage ? (
                      <Image src={t.user.profileImage} alt="" width={28} height={28} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        {t.user?.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium leading-tight">{t.user?.username ?? "—"}</p>
                      <p className="text-xs text-gray-400">{t.user?.email}</p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: `${t.plan?.color}20`, color: t.plan?.color }}
                  >
                    {t.plan?.name ?? "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[t.status] ?? ""}`}>
                    {t.status}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-4 py-3 font-medium">${Number(t.amountPaid).toFixed(2)}</td>

                {/* Dates */}
                <td className="px-4 py-3 text-gray-500 text-xs">{fmt(t.startDate)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{fmt(t.endDate)}</td>

                {/* Note */}
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{t.note ?? "—"}</td>

                {/* Action */}
                <td className="px-4 py-3">
                  {t.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        if (confirm(`Cancel ${t.user?.username}'s ${t.plan?.name} subscription?`)) {
                          cancelMutation.mutate(t.id)
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                    >
                      <Ban size={12} /> Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function fmt(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
