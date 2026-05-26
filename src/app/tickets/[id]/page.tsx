"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Send, ShieldCheck, User, Clock } from "lucide-react"

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]

const STATUS_STYLES: Record<string, string> = {
  OPEN:        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  CLOSED:      "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [reply, setReply] = useState("")
  const [statusMsg, setStatusMsg] = useState("")

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["admin-ticket", id],
    queryFn: async () => {
      const res = await api.get("/support")
      const all = res.data.data ?? []
      return all.find((t: any) => t.id === id) ?? null
    },
    enabled: !!id,
  })

  const { mutate: sendReply, isPending: sendingReply } = useMutation({
    mutationFn: async (message: string) => {
      await api.post(`/support/${id}/reply`, { message })
    },
    onSuccess: () => {
      setReply("")
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", id] })
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
  })

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/support/${id}/status`, { status })
    },
    onSuccess: (_, status) => {
      setStatusMsg(`Status updated to ${status.replace("_", " ")}`)
      setTimeout(() => setStatusMsg(""), 3000)
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", id] })
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-8 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400">
        <p className="text-sm">Ticket not found.</p>
        <Link href="/tickets" className="mt-3 text-blue-500 hover:underline text-sm">← Back to tickets</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
      >
        <ArrowLeft size={15} />
        All Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — thread */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                {ticket.status.replace("_", " ")}
              </span>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.title}</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{ticket.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={12} />
              Opened {formatDate(ticket.createdAt)}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {ticket.messages?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
            )}

            {ticket.messages?.map((msg: any) => {
              const isAdmin = msg.sender === "ADMIN"
              return (
                <div key={msg.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${isAdmin
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                      }`}
                  >
                    {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
                  </div>
                  <div className={`max-w-[80%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                    <span className="text-xs text-gray-400 px-1">
                      {isAdmin ? "Support (You)" : ticket.user?.username ?? "Customer"} · {formatDate(msg.createdAt)}
                    </span>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm
                        ${isAdmin
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                        }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reply box */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply to the customer…"
              rows={3}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && reply.trim()) {
                  sendReply(reply.trim())
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
              <button
                onClick={() => reply.trim() && sendReply(reply.trim())}
                disabled={!reply.trim() || sendingReply}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                           disabled:opacity-40 disabled:cursor-not-allowed
                           text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <Send size={14} />
                {sendingReply ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </div>
        </div>

        {/* Right — info + status */}
        <div className="space-y-4">
          {/* Customer info */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {ticket.user?.username ?? "Unknown"}
                </p>
                <p className="text-xs text-gray-400">{ticket.user?.email ?? ""}</p>
              </div>
            </div>
          </div>

          {/* Status change */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Status</h2>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={ticket.status === s || updatingStatus}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition
                    ${ticket.status === s
                      ? `${STATUS_STYLES[s]} cursor-default ring-2 ring-current ring-offset-1`
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                    }`}
                >
                  {s.replace("_", " ")}
                  {ticket.status === s && <span className="ml-2 text-xs opacity-70">current</span>}
                </button>
              ))}
            </div>
            {statusMsg && (
              <p className="text-xs text-green-600 dark:text-green-400">{statusMsg}</p>
            )}
          </div>

          {/* Ticket meta */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2 text-xs text-gray-400">
            <h2 className="font-semibold text-gray-500 uppercase tracking-wide">Details</h2>
            <p><span className="font-medium text-gray-500">ID:</span> <span className="font-mono">{ticket.id.slice(0, 8)}…</span></p>
            <p><span className="font-medium text-gray-500">Created:</span> {formatDate(ticket.createdAt)}</p>
            <p><span className="font-medium text-gray-500">Messages:</span> {ticket.messages?.length ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
