"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import EventForm from "../_components/EventForm"

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-event", id],
    queryFn: async () => {
      const res = await api.get(`/events/admin/${id}`)
      return res.data.data ?? res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return <EventForm initial={data} id={id} />
}
