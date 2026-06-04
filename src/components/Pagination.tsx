import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  // Build page number list with ellipsis
  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border dark:border-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        <ChevronLeft size={15} /> Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition
                ${page === p
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border dark:border-gray-700
          disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        Next <ChevronRight size={15} />
      </button>
    </div>
  )
}
