import { io, Socket } from "socket.io-client"
import { getConfig } from "@/lib/config"

let socket: Socket | null = null

export const getChatSocket = async (): Promise<Socket> => {
  if (!socket) {
    const { socketUrl } = await getConfig()
    socket = io(`${socketUrl}/chat`, {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false,
    })
  }
  return socket
}

export const destroyChatSocket = () => {
  socket?.disconnect()
  socket = null
}
