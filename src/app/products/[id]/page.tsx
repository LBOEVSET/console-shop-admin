"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Tag,
  Package,
  ToggleLeft,
  ToggleRight,
  Star,
} from "lucide-react"
import Link from "next/link"

/* ─── types ─────────────────────────────────────────── */
interface Platform { id: string; name: string }
interface Category { id: string; name: string; slug?: string }
interface ProductMedia { id: string; type: string; url: string; sortOrder: number }
interface ProductPrice { id: string; region: string; currency: string; price: number; salePrice?: number }

/* ─── small reusable components ─────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"

const textareaCls =
  "w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"

/* ─── page ───────────────────────────────────────────── */
export default function ProductDetailManagement() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  /* form state */
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [stock, setStock] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [platformId, setPlatformId] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  /* fetch product */
  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })

  /* fetch platforms + categories for dropdowns */
  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["platforms"],
    queryFn: async () => {
      const res = await api.get("/products/platforms")
      return res.data.data ?? []
    },
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/products/categories")
      return res.data.data ?? []
    },
  })

  /* seed form when product loads */
  useEffect(() => {
    if (!product) return
    setTitle(product.title ?? "")
    setSlug(product.slug ?? "")
    setDescription(product.description ?? "")

    // price — prefer US region price, fallback to top-level price field
    const usPrice = product.prices?.find((p: ProductPrice) => p.region === "US")
    setPrice(String(usPrice?.price ?? product.price ?? ""))
    setSalePrice(String(usPrice?.salePrice ?? product.salePrice ?? ""))

    setStock(String(product.stock ?? 0))
    setIsActive(product.isActive ?? true)
    setPlatformId(product.platformId ?? product.platform?.id ?? "")
    setSelectedCategories(
      (product.categories ?? []).map((c: Category) => c.id)
    )
  }, [product])

  /* save mutation */
  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/products/${id}`, {
        title,
        slug,
        description,
        price: Number(price),
        salePrice: Number(salePrice),
        stock: Number(stock),
        isActive,
        platformId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] })
      qc.invalidateQueries({ queryKey: ["admin-product", id] })
      setSaveMsg("Saved successfully")
      setTimeout(() => setSaveMsg(null), 2500)
    },
    onError: (err: any) => {
      setSaveMsg(err?.response?.data?.message ?? "Save failed")
      setTimeout(() => setSaveMsg(null), 3000)
    },
  })

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    )
  }

  const media: ProductMedia[] = product?.media ?? []
  const images = media.filter(m => m.type === "IMAGE").sort((a, b) => a.sortOrder - b.sortOrder)
  const reviews = product?.reviews ?? []

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Package size={40} className="mx-auto mb-3 opacity-40" />
        <p>Product not found</p>
        <Link href="/products" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">{product.title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">ID: {product.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm px-3 py-1.5 rounded-lg ${
              saveMsg.includes("fail") || saveMsg.includes("error")
                ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Save size={15} />
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: main form ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Core info card */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Core Info</h2>

            <Field label="Title">
              <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} />
            </Field>

            <Field label="Slug">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                <input
                  className={inputCls + " pl-6"}
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
            </Field>

            <Field label="Description">
              <textarea
                className={textareaCls}
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </Field>
          </div>

          {/* Pricing card */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pricing & Stock</h2>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Base Price ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </Field>

              <Field label="Sale Price ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  placeholder="0 = no sale"
                />
              </Field>

              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={inputCls}
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                />
              </Field>
            </div>

            {/* Regional prices (read-only display) */}
            {product.prices?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Regional prices (read-only)</p>
                <div className="flex flex-wrap gap-2">
                  {product.prices.map((pp: ProductPrice) => (
                    <div key={pp.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm">
                      <span className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{pp.region}</span>
                      <span className="font-semibold">{pp.currency} {Number(pp.price).toFixed(2)}</span>
                      {pp.salePrice && Number(pp.salePrice) > 0 && (
                        <span className="text-green-600 text-xs">→ {Number(pp.salePrice).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media gallery */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Media</h2>
              <span className="text-xs text-gray-400">({images.length} image{images.length !== 1 ? "s" : ""})</span>
            </div>

            {images.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700 text-gray-400 text-sm">
                No images uploaded
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={img.id} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-blue-400" : "border-transparent dark:border-gray-700"}`}>
                    <img src={img.url} alt={`media-${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: sidebar fields ──────────────────── */}
        <div className="space-y-5">

          {/* Status */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</h2>

            <button
              onClick={() => setIsActive(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition ${
                isActive
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }`}
            >
              <span className={`text-sm font-semibold ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-500"}`}>
                {isActive ? "Active (visible)" : "Hidden"}
              </span>
              {isActive
                ? <ToggleRight size={24} className="text-green-500" />
                : <ToggleLeft size={24} className="text-gray-400" />
              }
            </button>

            <div className="flex gap-3 text-sm">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{product.stock}</p>
                <p className="text-xs text-gray-500 mt-0.5">In stock</p>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Platform</h2>
            </div>

            <select
              value={platformId}
              onChange={e => setPlatformId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select platform…</option>
              {platforms.map((pl: Platform) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Categories</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat: Category) => {
                const selected = selectedCategories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition font-medium ${
                      selected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
              {categories.length === 0 && (
                <p className="text-xs text-gray-400">No categories found</p>
              )}
            </div>
          </div>

          {/* Reviews preview */}
          {reviews.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Star size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Latest Reviews</h2>
              </div>

              <div className="space-y-3">
                {reviews.slice(0, 4).map((r: any) => (
                  <div key={r.id} className="space-y-1 pb-3 border-b last:border-0 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{r.user?.username ?? r.user?.email ?? "User"}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={11}
                            className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
