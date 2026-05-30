"use client"

import { Menu } from "lucide-react"
import { useAdminAuth } from "@/store/auth.store"

export default function Topbar({
  collapsed,
  setCollapsed,
  onMobileMenuClick,
}: {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  onMobileMenuClick?: () => void
}) {
  const { logout } = useAdminAuth()

  return (
    <header className="h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-900 flex-shrink-0">
      {/* Mobile: opens drawer */}
      <button className="md:hidden" onClick={onMobileMenuClick}>
        <Menu />
      </button>
      {/* Desktop: collapses sidebar */}
      <button className="hidden md:block" onClick={() => setCollapsed(!collapsed)}>
        <Menu />
      </button>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm"
      >
        Logout
      </button>
    </header>
  )
}
