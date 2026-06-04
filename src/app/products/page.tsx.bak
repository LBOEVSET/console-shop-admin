"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import { useState } from "react"
import { Package, Plus, Search, ChevronRight } from "lucide-react"

export default function ProductManagement() {
  const [search, setSearch] = useState("")

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await api.get("/products")
      return res.data.data ?? []
    }
  })

  const filtered = products.filter((p: any) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.platform?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} total</p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or platform…"
          className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden min-w-[700px]">
          {/* Table header */}
          <div className="grid grid-cols-[56px_1fr_140px_110px_110px_80px_80px_44px] gap-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <span></span>
            <span>Product</span>
            <span>Platform</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Reviews</span>
            <span></span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            filtered.map((p: any) => <ProductRow key={p.id} product={p} />)
          )}
        </div>
        </div>
      )}
    </div>
  )
}

function ProductRow({ product: p }: { product: any }) {
  const thumbnail = p.media?.find((m: any) => m.type === "IMAGE")?.url

  const basePrice = p.prices?.find((pr: any) => pr.region === "US")?.price
    ?? p.prices?.[0]?.price
    ?? p.price

  const salePrice = p.prices?.find((pr: any) => pr.region === "US")?.salePrice
    ?? p.prices?.[0]?.salePrice

  const hasSale = salePrice && Number(salePrice) > 0

  const categories: any[] = p.categories ?? []

  return (
    <div className="grid grid-cols-[56px_1fr_140px_110px_110px_80px_80px_44px] gap-4 items-center px-4 py-3.5 border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={20} />
          </div>
        )}
      </div>

      {/* Title + categories */}
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{p.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">/{p.slug}</p>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {categories.slice(0, 3).map((c: any) => (
              <span key={c.id} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                {c.name}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="text-[10px] text-gray-400">+{categories.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Platform */}
      <div>
        <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
          {p.platform?.name ?? p.platformName ?? "—"}
        </span>
      </div>

      {/* Price */}
      <div>
        {hasSale ? (
          <div>
            <span className="text-sm font-semibold text-green-600">${Number(salePrice).toFixed(2)}</span>
            <span className="text-xs text-gray-400 line-through ml-1">${Number(basePrice).toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-sm font-semibold">${Number(basePrice ?? 0).toFixed(2)}</span>
        )}
      </div>

      {/* Stock */}
      <div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          p.stock === 0
            ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : p.stock < 10
            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        }`}>
          {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
        </span>
      </div>

      {/* Active status */}
      <div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          p.isActive
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        }`}>
          {p.isActive ? "Active" : "Hidden"}
        </span>
      </div>

      {/* Reviews count */}
      <div className="text-sm text-gray-500 text-center">
        {p._count?.reviews ?? p.reviews?.length ?? "—"}
      </div>

      {/* Edit link */}
      <Link href={`/products/${p.id}`} className="flex items-center justify-center text-gray-400 hover:text-blue-600 transition">
        <ChevronRight size={18} />
      </Link>
    </div>
  )
}
