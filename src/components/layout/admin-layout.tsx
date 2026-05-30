"use client"

import { ReactNode, useState } from "react"
import Sidebar from "./sidebar"
import Topbar from "./topbar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen */}
      <div
        className={`fixed md:relative z-50 md:z-auto h-full transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <Sidebar collapsed={collapsed} onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onMobileMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
