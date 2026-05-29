import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

/**
 * Singleton socket connected to the backend /chat namespace.
 * Admin cookies are set for localhost:3012 (direct API, no proxy),
 * so the browser sends them on the WS upgrade — the gateway reads
 * accessToken from the cookie header automatically.
 */
export const getChatSocket = (): Socket => {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL!
    socket = io(`${base}/chat`, {
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
