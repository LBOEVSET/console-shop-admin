import { create } from "zustand"
import api from "@/lib/api"

interface Admin {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthState {
  admin: Admin | null
  loading: boolean
  fetchProfile: () => Promise<void>
  setAdmin: (admin: Admin | null) => void
  logout: () => Promise<void>
}

export const useAdminAuth = create<AuthState>((set) => ({
  admin: null,
  loading: true,

  fetchProfile: async () => {
    try {
      const res = await api.get("/profile")
      const user = res.data.data

      // Only accept ADMIN role — reject customers who reach this panel
      if (user?.role !== "ADMIN") {
        set({ admin: null, loading: false })
        return
      }

      set({ admin: user, loading: false })
    } catch {
      set({ admin: null, loading: false })
    }
  },

  setAdmin: (admin) => set({ admin }),

  logout: async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Continue logout even if the API call fails
    }
    set({ admin: null })
    window.location.href = "/login"
  },
}))
