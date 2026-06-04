"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import {
  DollarSign, ShoppingCart, Users, Package,
  Clock, CheckCircle, ChevronRight, TicketCheck,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"

// ─── data fetchers ────────────────────────────────────────────────────────────

function useOverview() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await api.get("/dashboard/overview")
      return res.data.data ?? res.data
    },
    refetchInterval: 30_000,
  })
}

function useRevenueDaily() {
  return useQuery({
    queryKey: ["dashboard-revenue-daily"],
    queryFn: async () => {
      const res = await api.get("/dashboard/revenue-daily")
      const rows: any[] = res.data.data ?? res.data ?? []
      return rows.map((r: any) => ({
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: Number(r.revenue ?? 0),
      }))
    },
  })
}

function useRecentOrders() {
  return useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const res = await api.get("/orders?limit=6&page=1")
      const rows: any[] = res.data.data ?? res.data ?? []
      return rows.slice(0, 6)
    },
  })
}

function useTickets() {
  return useQuery({
    queryKey: ["dashboard-tickets"],
    queryFn: async () => {
      const res = await api.get("/support-tickets?limit=5&page=1")
      const rows: any[] = res.data.data ?? res.data ?? []
      return rows.slice(0, 5)
    },
  })
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  COMPLETED:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAID:            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CANCELLED:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED:        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

const TICKET_STATUS_STYLE: Record<string, string> = {
  OPEN:        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED:      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── components ───────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string
  value: string | number
  sub?: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-5 flex items-center gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Revenue (Daily)</h2>
        <span className="text-xs text-gray-400">Completed orders only</span>
      </div>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              formatter={(v: any) => [`$${fmt(Number(v))}`, "Revenue"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function RecentOrders({ orders }: { orders: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Recent Orders</h2>
        <Link href="/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
          View all <ChevronRight size={12} />
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o: any) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{o.orderNumber}</p>
                <p className="text-xs text-gray-400 truncate">
                  {o.user?.username ?? o.user?.email ?? "—"} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {o.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold">${fmt(Number(o.total ?? 0))}</span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentTickets({ tickets }: { tickets: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Support Tickets</h2>
        <Link href="/tickets" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
          View all <ChevronRight size={12} />
        </Link>
      </div>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tickets</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.subject ?? t.title ?? "No subject"}</p>
                <p className="text-xs text-gray-400 truncate">
                  {t.user?.username ?? t.user?.email ?? "—"} ·{" "}
                  {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_STYLE[t.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {t.status?.replace(/_/g, " ")}
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useOverview()
  const { data: revenueDaily = [] } = useRevenueDaily()
  const { data: recentOrders = [] } = useRecentOrders()
  const { data: tickets = [] } = useTickets()

  const kpis = [
    {
      title: "Total Revenue",
      value: loadingOverview ? "—" : `$${fmt(Number(overview?.revenue ?? 0))}`,
      sub: "Completed orders",
      icon: DollarSign,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30",
    },
    {
      title: "Total Orders",
      value: loadingOverview ? "—" : (overview?.totalOrders ?? 0),
      sub: `${overview?.paidOrders ?? 0} paid`,
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
    },
    {
      title: "Customers",
      value: loadingOverview ? "—" : (overview?.totalUsers ?? 0),
      sub: "Registered users",
      icon: Users,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
    },
    {
      title: "Products",
      value: loadingOverview ? "—" : (overview?.totalProducts ?? 0),
      sub: "In catalogue",
      icon: Package,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
    },
    {
      title: "Paid Orders",
      value: loadingOverview ? "—" : (overview?.paidOrders ?? 0),
      sub: "Awaiting fulfillment",
      icon: CheckCircle,
      color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30",
    },
    {
      title: "Open Tickets",
      value: tickets.filter((t: any) => t.status === "OPEN").length,
      sub: "Needs response",
      icon: TicketCheck,
      color: "bg-red-100 text-red-600 dark:bg-red-900/30",
    },
    {
      title: "Pending Orders",
      value: recentOrders.filter((o: any) => o.status === "PENDING_PAYMENT").length,
      sub: "Awaiting payment",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map(k => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Revenue chart — full width */}
      <RevenueChart data={revenueDaily} />

      {/* Orders + Tickets side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <RecentOrders orders={recentOrders} />
        <RecentTickets tickets={tickets} />
      </div>
    </div>
  )
}
