"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Star,
  Ticket,
  Newspaper,
} from "lucide-react"

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        "transition-all duration-300 bg-white dark:bg-gray-900 border-r",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 font-bold text-lg">
        {collapsed ? "🎮" : "Console Admin"}
      </div>

      <nav className="space-y-2 p-2">
        <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={collapsed} />
        <NavItem href="/products" icon={<Package size={18} />} label="Products" collapsed={collapsed} />
        <NavItem href="/orders" icon={<ShoppingCart size={18} />} label="Orders" collapsed={collapsed} />
        <NavItem href="/tickets" icon={<Ticket size={18} />} label="Tickets" collapsed={collapsed} />
        <NavItem href="/chat" icon={<MessageSquare size={18} />} label="Live Chat" collapsed={collapsed} />
        <NavItem href="/reviews" icon={<Star size={18} />} label="Reviews" collapsed={collapsed} />
        <NavItem href="/articles" icon={<Newspaper size={18} />} label="Articles" collapsed={collapsed} />
      </nav>
    </aside>
  )
}

function NavItem({
  href,
  icon,
  label,
  collapsed
}: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
