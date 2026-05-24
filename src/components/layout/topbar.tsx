"use client"

import { Menu } from "lucide-react"
import { useAdminAuth } from "@/store/auth.store"

export default function Topbar({
  collapsed,
  setCollapsed
}: {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}) {
  const { logout } = useAdminAuth()

  return (
    <header className="h-16 border-b flex items-center justify-between px-6 bg-white dark:bg-gray-900">
      <button onClick={() => setCollapsed(!collapsed)}>
        <Menu />
      </button>

      <button
        onClick={logout}
        className="text-sm bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </header>
  )
}
