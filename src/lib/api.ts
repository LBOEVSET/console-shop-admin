import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Cookies (httpOnly accessToken / refreshToken) are forwarded automatically
  withCredentials: true,
})

// ── 401 → refresh → retry ─────────────────────────────────────────────────────
// When the access token expires the backend returns 401.  We attempt a single
// token refresh and replay any requests that piled up while the refresh was
// in-flight.  If the refresh itself fails, we redirect to /login.

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

    // Only handle 401s that haven't already been retried
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    // Queue callers that arrive while a refresh is already in-flight
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
      // Only redirect if we're not already on the login page
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
