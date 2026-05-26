"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"

export default function OrderListAdmin() {
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await api.get("/orders")
      return res.data.data
    }
  })

  return (
    <div>
      {data?.map((order: any) => (
        <Link key={order.id} href={`/orders/${order.id}`} className="block border p-4 rounded">
          {order.id} - {order.status}
        </Link>
      ))}
    </div>
  )
}
