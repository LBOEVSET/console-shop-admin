"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/store/auth.store"

export default function AdminLogin() {
  const { register, handleSubmit } = useForm()
  const router = useRouter()
  const { fetchProfile } = useAdminAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: any) => {
    try {
      setError(null)
      setLoading(true)

      // Use the shared auth login endpoint — sets httpOnly cookies on success
      await api.post("/auth/login", {
        identifier: data.email,
        password: data.password,
      })

      // Fetch profile and verify the account has ADMIN role
      await fetchProfile()

      const { admin } = useAdminAuth.getState()
      if (!admin) {
        setError("Access denied: this account does not have admin privileges.")
        await api.post("/auth/logout").catch(() => {})
        return
      }

      router.push("/")
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold">Admin Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...register("email")}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        <input
          {...register("password")}
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white w-full py-2 rounded disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  )
}
