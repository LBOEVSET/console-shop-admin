"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"

export default function ReviewListing() {
  const { data } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await api.get("/reviews")
      return res.data.data
    }
  })

  return (
    <div>
      {data?.map((r: any) => (
        <div key={r.id} className="border p-4 rounded mb-4">
          <p><b>{r.productTitle}</b></p>
          <p>{r.comment}</p>
          <p>Rating: {r.rating}</p>
        </div>
      ))}
    </div>
  )
}
