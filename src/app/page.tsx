"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/overview")
      return res.data.data
    }
  })

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Stat title="Total Sales" value={`$${data?.totalSales || 0}`} />
      <Stat title="Orders" value={data?.totalOrders || 0} />
      <Stat title="Pending Tickets" value={data?.pendingTickets || 0} />
      <Stat title="Active Chats" value={data?.activeChats || 0} />
    </div>
  )
}

function Stat({ title, value }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
      <h3 className="text-sm opacity-70">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}
