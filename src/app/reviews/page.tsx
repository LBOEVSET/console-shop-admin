"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown } from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

export default function ReviewListing() {
  const [page, setPage] = useState(1)

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-reviews", page],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page", String(page))
      q.set("limit", String(PAGE_SIZE))
      const r = await api.get(`/reviews?${q}`)
      return r.data.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const reviews: any[] = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number = res?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} total reviews</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Star size={40} className="mb-3 opacity-30" /><p className="text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_180px_80px_120px_80px] gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span>Review</span><span>Product</span><span>Rating</span><span>User</span><span>Status</span>
          </div>
          {reviews.map((r: any) => (
            <div key={r.id} className="grid grid-cols-[1fr_180px_80px_120px_80px] gap-4 items-center px-4 py-3.5 border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
              <div className="min-w-0">
                <p className="text-sm truncate">{r.comment || <span className="text-gray-400 italic">No comment</span>}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{r.product?.title ?? "—"}</div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              <div className="text-sm text-gray-500 truncate">{r.user?.username ?? r.user?.email ?? "—"}</div>
              <div>
                {r.isApproved
                  ? <span className="flex items-center gap-1 text-xs text-green-600"><ThumbsUp size={12} /> Approved</span>
                  : <span className="flex items-center gap-1 text-xs text-gray-400"><ThumbsDown size={12} /> Pending</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
