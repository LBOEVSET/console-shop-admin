"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Star,
  Ticket,
  Newspaper,
  CalendarDays,
  ShoppingBag,
  BarChart2,
  X,
} from "lucide-react"

function useChatBadge() {
  const { data } = useQuery<number>({
    queryKey: ["chat-waiting-count"],
    queryFn: async () => {
      const res = await api.get("/chat/waiting-count")
      // returns a plain number from getWaitingCount()
      const val = res.data?.data ?? res.data
      return typeof val === "number" ? val : 0
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  })
  return data ?? 0
}

export default function Sidebar({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const waitingCount = useChatBadge()

  return (
    <aside
      className={cn(
        "relative h-full transition-all duration-300 bg-white dark:bg-gray-900 border-r",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Close button — mobile only */}
      <button
        className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      <div className="p-4 font-bold text-lg">
        {collapsed ? "🎮" : "Console Admin"}
      </div>

      <nav className="space-y-2 p-2">
        <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={collapsed} />
        <NavItem href="/products" icon={<Package size={18} />} label="Products" collapsed={collapsed} />
        <NavItem href="/orders" icon={<ShoppingCart size={18} />} label="Orders" collapsed={collapsed} />
        <NavItem href="/tickets" icon={<Ticket size={18} />} label="Tickets" collapsed={collapsed} />
        <NavItem href="/chat" icon={<MessageSquare size={18} />} label="Live Chat" collapsed={collapsed} badge={waitingCount} />
        <NavItem href="/reviews" icon={<Star size={18} />} label="Reviews" collapsed={collapsed} />
        <NavItem href="/articles"     icon={<Newspaper    size={18} />} label="Articles"     collapsed={collapsed} />
        <NavItem href="/events"       icon={<CalendarDays size={18} />} label="Events"       collapsed={collapsed} />
        <NavItem href="/merchandise"  icon={<ShoppingBag  size={18} />} label="Merchandise"  collapsed={collapsed} />
        <NavItem href="/statistics"   icon={<BarChart2    size={18} />} label="Statistics"   collapsed={collapsed} />
      </nav>
    </aside>
  )
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
  badge = 0,
}: {
  href: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800 relative"
    >
      <span className="relative flex-shrink-0">
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full
            bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between">
          {label}
          {badge > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </span>
      )}
    </Link>
  )
}
