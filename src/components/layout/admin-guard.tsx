"use client"

import { useEffect } from "react"
import { useAdminAuth } from "@/store/auth.store"
import { useRouter, usePathname } from "next/navigation"
import AdminLayout from "@/components/layout/admin-layout"

export default function AdminGuard({
  children
}: {
  children: React.ReactNode
}) {
  const { admin, loading, fetchProfile } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Never guard the login page — it has no session and never will
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (isLoginPage) return
    fetchProfile()
  }, [isLoginPage])

  useEffect(() => {
    if (isLoginPage) return
    if (!loading && !admin) {
      router.push("/login")
    }
  }, [loading, admin, isLoginPage])

  // Login page: full-page, no sidebar/topbar
  if (isLoginPage) return <>{children}</>

  // Hold render while the profile check is in flight
  if (loading) return null

  // Redirect is firing above; render nothing in the meantime
  if (!admin) return null

  // Authenticated — wrap with the admin shell
  return <AdminLayout>{children}</AdminLayout>
}
