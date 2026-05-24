"use client"

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket"
import { useChatStore } from "@/store/chat.store"

export default function AdminChatPage() {
  const socket = getSocket()
  const { messages, addMessage } = useChatStore()
  const [input, setInput] = useState("")
  const [queue, setQueue] = useState<number>(0)

  useEffect(() => {
    const handleMessage = (msg: any) => addMessage(msg)
    const handleQueue = (count: number) => setQueue(count)

    socket.connect()
    socket.emit("admin:available")

    socket.on("chat:message", handleMessage)
    socket.on("admin:queue-update", handleQueue)

    return () => {
      socket.off("chat:message", handleMessage)
      socket.off("admin:queue-update", handleQueue)
      socket.disconnect()
    }
  }, [])

  const sendMessage = () => {
    socket.emit("chat:message", input)
    setInput("")
  }

  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow">
      <div className="w-64 border-r p-4">
        <h2 className="font-bold">Waiting Queue</h2>
        <p className="text-2xl mt-2">{queue}</p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {messages.map((m, i) => (
            <div key={i}>
              <b>{m.sender}:</b> {m.message}
            </div>
          ))}
        </div>

        <div className="flex border-t">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3"
          />
          <button
            onClick={sendMessage}
            className="px-6 bg-primary text-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
