import axios from "axios"
import { getConfig } from "@/lib/config"

// baseURL is resolved lazily on first request via the request interceptor
// so it comes from the runtime /api/config response, not a build-time var.
const api = axios.create({
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  if (!config.baseURL) {
    const { apiUrl } = await getConfig()
    config.baseURL = apiUrl
  }
  return config
})

// ── 401 → refresh → retry ─────────────────────────────────────────────────────
let isRefreshing = false
let waitQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

function flushQueue(error: unknown) {
  waitQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
  waitQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config as typeof err.config & { _retry?: boolean }

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({
          resolve: () => resolve(api(original)),
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      await api.post("/auth/refresh")
      flushQueue(null)
      return api(original)
    } catch (refreshErr) {
      flushQueue(refreshErr)
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
