"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import ArticleForm from "../_components/ArticleForm"
import { Newspaper } from "lucide-react"

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>()

  const { data: article, isLoading } = useQuery({
    queryKey: ["admin-article", id],
    queryFn: async () => {
      const res = await api.get(`/articles/admin/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Newspaper size={40} className="mb-3 opacity-40" />
        <p className="text-sm">Article not found</p>
      </div>
    )
  }

  return (
    <ArticleForm
      articleId={id}
      initial={{
        type: article.type,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        reference: article.reference ?? "",
        isPublished: article.isPublished,
        publishedAt: article.publishedAt,
      }}
    />
  )
}
