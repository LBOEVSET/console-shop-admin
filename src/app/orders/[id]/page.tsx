"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Package, User, CreditCard, Clock } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  PAID:            "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  PROCESSING:      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  SHIPPED:         "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  COMPLETED:       "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  CANCELLED:       "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  FAILED:          "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
}

// Valid next states for each current status (mirrors backend state machine)
const NEXT_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "FAILED", "CANCELLED"],
  PAID:            ["PROCESSING", "CANCELLED"],
  PROCESSING:      ["SHIPPED", "CANCELLED"],
  SHIPPED:         ["COMPLETED"],
  COMPLETED:       [],
  CANCELLED:       [],
  FAILED:          [],
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [statusMsg, setStatusMsg] = useState("")

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      // Fetch from the all-orders list and find by id
      const res = await api.get("/orders")
      const all = res.data.data ?? []
      return all.find((o: any) => o.id === id) ?? null
    },
    enabled: !!id,
  })

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/orders/${id}/status`, { status })
    },
    onSuccess: (_, status) => {
      setStatusMsg(`Updated to ${status.replace(/_/g, " ")}`)
      setTimeout(() => setStatusMsg(""), 3000)
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] })
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-8 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400">
        <p className="text-sm">Order not found.</p>
        <Link href="/orders" className="mt-3 text-blue-500 hover:underline text-sm">← Back to orders</Link>
      </div>
    )
  }

  const nextStates = NEXT_TRANSITIONS[order.status] ?? []

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
      >
        <ArrowLeft size={15} />
        All Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — order detail */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-gray-400 font-mono">{order.orderNumber ?? order.id}</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">Order Detail</h1>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] ?? ""}`}>
                {order.status?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              {formatDate(order.createdAt)}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Package size={15} /> Items
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-5 py-2">Product</th>
                  <th className="text-right px-5 py-2">Qty</th>
                  <th className="text-right px-5 py-2">Price</th>
                  <th className="text-right px-5 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(order.items ?? []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{item.title}</td>
                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                    <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">฿{Number(item.price).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                      ฿{(Number(item.price) * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Total</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                    ฿{Number(order.total ?? 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment */}
          {order.payment && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <CreditCard size={15} /> Payment
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><span className="font-medium">Method:</span> {order.paymentMethod}</p>
                <p><span className="font-medium">Status:</span> {order.payment.status}</p>
                <p><span className="font-medium">Provider:</span> {order.payment.provider}</p>
                {order.payment.chargeId && (
                  <p><span className="font-medium">Charge ID:</span> <span className="font-mono text-xs">{order.payment.chargeId}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — customer + status control */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.user?.username ?? "Unknown"}</p>
                <p className="text-xs text-gray-400">{order.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Status transitions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Status</h2>
            <div className="space-y-2">
              {nextStates.length === 0 ? (
                <p className="text-xs text-gray-400">No further transitions available.</p>
              ) : (
                nextStates.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={isPending}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                               bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20
                               text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400
                               disabled:opacity-40 transition"
                  >
                    → {s.replace(/_/g, " ")}
                  </button>
                ))
              )}
            </div>
            {statusMsg && <p className="text-xs text-green-600 dark:text-green-400">{statusMsg}</p>}
          </div>

          {/* Meta */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-1 text-xs text-gray-400">
            <h2 className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</h2>
            <p><span className="font-medium text-gray-500">Order ID:</span> <span className="font-mono">{order.id.slice(0, 8)}…</span></p>
            <p><span className="font-medium text-gray-500">Items:</span> {order.items?.length ?? 0}</p>
            <p><span className="font-medium text-gray-500">Subtotal:</span> ฿{Number(order.subtotal ?? 0).toLocaleString()}</p>
            <p><span className="font-medium text-gray-500">Discount:</span> ฿{Number(order.discount ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
