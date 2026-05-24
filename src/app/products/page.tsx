"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"

export default function ProductManagement() {
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await api.get("/product/list")
      return res.data.data
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      {data?.map((p: any) => (
        <Link
          key={p.id}
          href={`/products/${p.id}`}
          className="block border p-4 rounded"
        >
          {p.title} - ${p.price}
        </Link>
      ))}
    </div>
  )
}
