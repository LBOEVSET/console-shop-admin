"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useForm } from "react-hook-form"

export default function ProductDetailManagement() {
  const { id } = useParams()

  const { data } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get("/product/detail", { params: { id } })
      return res.data.data
    }
  })

  const { register, handleSubmit } = useForm({
    values: data
  })

  const onSubmit = async (formData: any) => {
    await api.put("/product/update", formData)
    alert("Updated")
  }

  if (!data) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register("title")} className="w-full border p-2 rounded" />
      <input {...register("price")} className="w-full border p-2 rounded" />
      <textarea {...register("description")} className="w-full border p-2 rounded" />
      <button className="bg-primary text-white px-6 py-2 rounded">
        Save
      </button>
    </form>
  )
}
