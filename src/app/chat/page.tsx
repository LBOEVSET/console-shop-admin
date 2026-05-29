"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { getChatSocket, destroyChatSocket } from "@/lib/socket"
import { Send, RefreshCw, UserCircle2, XCircle, CheckCircle2 } from "lucide-react"

interface ChatSession {
  id: string
  status: "WAITING" | "ACTIVE" | "CLOSED"
  startedAt: string | null
  endedAt:   string | null
  customerId: string | null
  adminId:    string | null
  customer: { id: string; firstName: string; lastName: string; email: string } | null
  messages: { message: string; createdAt: string }[]
}

interface ChatMessage {
  id:        string
  message:   string
  sender:    string
  createdAt: string
}

function statusBadge(status: ChatSession["status"]) {
  switch (status) {
    case "WAITING": return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Waiting</span>
    case "ACTIVE":  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/30">Active</span>
    case "CLOSED":  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30">Closed</span>
  }
}

function unwrap(res: any): any {
  return res?.data?.data ?? res?.data ?? res
}

export default function AdminChatPage() {
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState("")
  const [connected, setConnected] = useState(false)
  const [filter,    setFilter]    = useState<"ALL"|"WAITING"|"ACTIVE"|"CLOSED">("ALL")

  const socketRef   = useRef(getChatSocket())
  const activeIdRef = useRef<string | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const { data: sessions = [], refetch: refetchSessions } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await api.get("/chat/sessions")
      return unwrap(res) ?? []
    },
    refetchInterval: 15_000,
  })

  const filtered = filter === "ALL" ? sessions : sessions.filter(s => s.status === filter)

  const loadMessages = useCallback(async (sessionId: string) => {
    const res = await api.get(`/chat/sessions/${sessionId}/messages`)
    setMessages(unwrap(res) ?? [])
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    socket.connect()
    socket.on("connect",    () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))
    socket.on("newMessage", (msg: ChatMessage) => {
      if (!activeIdRef.current) return
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    })
    socket.on("closed", () => {
      setMessages(prev => [...prev, { id: "sys-closed", message: "This session has been closed.", sender: "__system__", createdAt: new Date().toISOString() }])
      refetchSessions()
    })
    return () => {
      socket.off("connect"); socket.off("disconnect"); socket.off("newMessage"); socket.off("closed")
      destroyChatSocket()
      setConnected(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function openSession(session: ChatSession) {
    if (session.status === "WAITING") {
      await api.post("/chat/assign")
      refetchSessions()
    }
    setActiveId(session.id)
    setMessages([])
    socketRef.current.emit("join", { sessionId: session.id })
    await loadMessages(session.id)
  }

  function sendMessage() {
    const sid = activeIdRef.current
    if (!input.trim() || !sid || !connected) return
    const text = input.trim()
    setInput("")
    socketRef.current.emit("sendMessage", { sessionId: sid, message: text })
    setMessages(prev => [...prev, { id: `opt-${Date.now()}`, message: text, sender: "__admin__", createdAt: new Date().toISOString() }])
  }

  function closeSession() {
    const sid = activeIdRef.current
    if (!sid) return
    socketRef.current.emit("close", { sessionId: sid })
    refetchSessions()
  }

  const activeSession = sessions.find(s => s.id === activeId) ?? null

  return (
    <div className="flex h-[calc(100vh-80px)] rounded-xl overflow-hidden border dark:border-gray-800 bg-white dark:bg-gray-900">

      {/* Session list */}
      <div className="w-72 flex-shrink-0 border-r dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Live Chat</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-400"}`} />
              <button onClick={() => refetchSessions()} className="text-gray-400 hover:text-gray-600 transition"><RefreshCw size={13} /></button>
            </div>
          </div>
          <div className="flex gap-1 text-[11px] font-semibold">
            {(["ALL","WAITING","ACTIVE","CLOSED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded-md transition ${filter === f ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-10">No sessions</p>}
          {filtered.map(s => {
            const name = s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : "Guest"
            const lastMsg = s.messages?.[0]?.message
            return (
              <button key={s.id} onClick={() => openSession(s)}
                className={`w-full text-left px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition
                  ${activeId === s.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold truncate max-w-[120px]">{name}</span>
                  {statusBadge(s.status)}
                </div>
                {lastMsg && <p className="text-[11px] text-gray-400 truncate">{lastMsg}</p>}
                {s.startedAt && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(s.startedAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
            <UserCircle2 size={48} className="opacity-20" />
            <p className="text-sm">Select a session to start chatting</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="font-semibold text-sm">
                  {activeSession.customer ? `${activeSession.customer.firstName} ${activeSession.customer.lastName}` : "Guest"}
                </p>
                <p className="text-xs text-gray-400">{activeSession.customer?.email ?? activeSession.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(activeSession.status)}
                {activeSession.status === "ACTIVE" && (
                  <button onClick={closeSession}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 border border-red-400/30 px-2 py-1 rounded-lg transition">
                    <XCircle size={12} /> Close
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.length === 0 && <p className="text-xs text-gray-400 text-center mt-10">No messages yet</p>}
              {messages.map((msg, i) => {
                const isAdmin  = msg.sender === "__admin__" || msg.sender === activeSession.adminId
                const isSystem = msg.sender === "__system__"
                if (isSystem) return (
                  <div key={msg.id ?? i} className="text-center">
                    <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{msg.message}</span>
                  </div>
                )
                return (
                  <div key={msg.id ?? i} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`px-3 py-2 rounded-2xl max-w-[72%] text-sm shadow
                      ${isAdmin ? "bg-indigo-600 text-white rounded-br-none" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"}`}>
                      <p>{msg.message}</p>
                      <p className="text-[10px] opacity-50 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEnd} />
            </div>

            {activeSession.status !== "CLOSED" ? (
              <div className="p-3 border-t dark:border-gray-800 flex gap-2 bg-white dark:bg-gray-900 flex-shrink-0">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={connected ? "Type a reply…" : "Connecting…"} disabled={!connected}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 transition" />
                <button onClick={sendMessage} disabled={!connected || !input.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-40 flex items-center gap-1">
                  <Send size={14} />
                </button>
              </div>
            ) : (
              <div className="p-3 border-t dark:border-gray-800 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <CheckCircle2 size={13} /> Session closed
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
