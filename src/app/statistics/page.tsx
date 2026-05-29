"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, FunnelChart, Funnel, LabelList,
} from "recharts"
import { BarChart2, Plus, X, Search } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

type EntityType = "PRODUCT" | "ARTICLE" | "EVENT" | "MERCHANDISE"
type ChartType  = "line" | "bar" | "area" | "funnel"
type DateRange  = "7d" | "30d" | "90d" | "1y"

interface CompareItem {
  entityType: EntityType
  entityId:   string
  label:      string
  color:      string
}

const ENTITY_TYPES: EntityType[]    = ["PRODUCT", "ARTICLE", "EVENT", "MERCHANDISE"]
const CHART_TYPES: ChartType[]      = ["line", "bar", "area", "funnel"]
const DATE_RANGES: DateRange[]      = ["7d", "30d", "90d", "1y"]
const COLORS = ["#6366f1", "#22d3ee", "#f43f5e", "#f59e0b"]

function dateRangeToParams(range: DateRange): { from: string; to: string } {
  const to   = new Date()
  const from = new Date()
  if (range === "7d")  from.setDate(to.getDate()   - 7)
  if (range === "30d") from.setDate(to.getDate()   - 30)
  if (range === "90d") from.setDate(to.getDate()   - 90)
  if (range === "1y")  from.setFullYear(to.getFullYear() - 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

// ─── Entity picker ───────────────────────────────────────────────────────────

function EntityPicker({
  onSelect,
}: {
  onSelect: (item: { entityType: EntityType; entityId: string; label: string }) => void
}) {
  const [open,       setOpen]       = useState(false)
  const [entityType, setEntityType] = useState<EntityType>("PRODUCT")
  const [search,     setSearch]     = useState("")

  const { data: entities = [] } = useQuery({
    queryKey: ["stat-entities", entityType],
    queryFn: async () => {
      // Products uses the public list endpoint (no admin/all route exists)
      const endpoints: Record<EntityType, string> = {
        PRODUCT:     "/products",
        ARTICLE:     "/articles/admin/all",
        EVENT:       "/events/admin/all",
        MERCHANDISE: "/merchandise/admin/all",
      }
      const params = entityType === "PRODUCT" ? { limit: 100 } : undefined
      const res = await api.get(endpoints[entityType], { params })
      const payload = res.data?.data ?? res.data
      return Array.isArray(payload) ? payload : []
    },
    enabled: open,
  })

  const filtered = entities.filter((e: any) =>
    e.title?.toLowerCase().includes(search.toLowerCase())
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition"
      >
        <Plus size={15} /> Add item to compare
      </button>
    )
  }

  return (
    <div className="border dark:border-gray-700 rounded-xl p-4 space-y-3 bg-white dark:bg-gray-900">
      {/* Entity type tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {ENTITY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => { setEntityType(t); setSearch("") }}
            className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition ${
              entityType === t
                ? "bg-white dark:bg-gray-700 shadow"
                : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full pl-8 pr-3 py-1.5 border dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1">
        {filtered.slice(0, 20).map((e: any) => (
          <button
            key={e.id}
            onClick={() => {
              onSelect({ entityType, entityId: e.id, label: e.title })
              setOpen(false)
              setSearch("")
            }}
            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 truncate"
          >
            {e.title}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No results</p>
        )}
      </div>

      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </div>
  )
}

// ─── Single item aggregate data ──────────────────────────────────────────────

function useAggregate(item: CompareItem, range: DateRange) {
  const { from, to } = dateRangeToParams(range)
  return useQuery({
    queryKey: ["stat-agg", item.entityType, item.entityId, range],
    queryFn: async () => {
      const res = await api.get("/statistics/aggregate", {
        params: { entityType: item.entityType, entityId: item.entityId, from, to },
      })
      // envelope: res.data = { statusCode, message, data: [...] }
      const payload = res.data?.data ?? res.data
      return (Array.isArray(payload) ? payload : []) as { day: string; eventType: string; count: number }[]
    },
  })
}

// ─── Raw events for drill-down ───────────────────────────────────────────────

function DrillDownTable({ item }: { item: CompareItem }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["stat-drill", item.entityType, item.entityId],
    queryFn: async () => {
      const res = await api.get("/statistics", {
        params: { entityType: item.entityType, entityId: item.entityId, limit: 50 },
      })
      // findAll returns { data: [], total, page, limit } — unwrap the inner array
      const envelope = res.data?.data ?? res.data
      return Array.isArray(envelope) ? envelope : (envelope?.data ?? [])
    },
  })

  if (isLoading) return <div className="h-20 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b dark:border-gray-800 text-gray-500 uppercase tracking-wider">
            <th className="text-left px-3 py-2">Time</th>
            <th className="text-left px-3 py-2">Event</th>
            <th className="text-left px-3 py-2">IP</th>
            <th className="text-left px-3 py-2">Location</th>
            <th className="text-left px-3 py-2">User / Guest</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any) => {
            const geo = r.addressMetadata
            const location = geo
              ? `${geo.city ?? ""}, ${geo.regionName ?? ""}, ${geo.country ?? ""}`.replace(/^, |, $/g, "")
              : "—"
            return (
              <tr key={r.id} className="border-b last:border-0 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                <td className="px-3 py-2 text-gray-500">
                  {new Date(r.createdAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    r.eventType === "SEE"   ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"   :
                    r.eventType === "VIEW"  ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                    "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}>
                    {r.eventType}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-gray-500">{r.ip ?? "—"}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-[180px]">{location}</td>
                <td className="px-3 py-2 text-gray-500 truncate max-w-[140px]">
                  {r.userId ?? r.guestId ?? "anonymous"}
                </td>
              </tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-gray-400">No events recorded yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Chart for one item ───────────────────────────────────────────────────────

const EVENT_SERIES = [
  { key: "SEE",   stroke: "#6366f1", fill: "#6366f120", barFill: "#6366f1" },
  { key: "VIEW",  stroke: "#22d3ee", fill: "#22d3ee20", barFill: "#22d3ee" },
  { key: "CLICK", stroke: "#22c55e", fill: "#22c55e20", barFill: "#22c55e" },
] as const

type SeriesKey = "SEE" | "VIEW" | "CLICK"

function SeriesToggle({
  active,
  onChange,
}: {
  active:   Record<SeriesKey, boolean>
  onChange: (key: SeriesKey) => void
}) {
  return (
    <div className="flex gap-1.5 px-1">
      {EVENT_SERIES.map(({ key, stroke }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            active[key]
              ? "border-transparent text-white"
              : "border-gray-300 dark:border-gray-600 text-gray-400 bg-transparent"
          }`}
          style={active[key] ? { backgroundColor: stroke, borderColor: stroke } : {}}
        >
          <span
            className="w-2 h-2 rounded-full border"
            style={{ backgroundColor: active[key] ? "rgba(255,255,255,0.6)" : stroke, borderColor: stroke }}
          />
          {key}
        </button>
      ))}
    </div>
  )
}

function ItemChart({
  item,
  range,
  chartType,
}: {
  item:      CompareItem
  range:     DateRange
  chartType: ChartType
}) {
  const [active, setActive] = useState<Record<SeriesKey, boolean>>({ SEE: true, VIEW: true, CLICK: true })
  const toggle = (key: SeriesKey) => setActive(prev => ({ ...prev, [key]: !prev[key] }))

  const { data = [], isLoading } = useAggregate(item, range)

  // Pivot: { day, SEE, VIEW, CLICK }[]
  const pivoted = useMemo(() => {
    const map: Record<string, { day: string; SEE: number; VIEW: number; CLICK: number }> = {}
    for (const r of data) {
      const day = new Date(r.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (!map[day]) map[day] = { day, SEE: 0, VIEW: 0, CLICK: 0 }
      map[day][r.eventType as keyof typeof map[typeof day]] = r.count
    }
    return Object.values(map)
  }, [data])

  // Funnel data (total per event type)
  const funnelData = useMemo(() => {
    const totals = { SEE: 0, VIEW: 0, CLICK: 0 }
    for (const r of data) totals[r.eventType as keyof typeof totals] += r.count
    return [
      { name: "SEE",   value: totals.SEE,   fill: "#6366f1" },
      { name: "VIEW",  value: totals.VIEW,  fill: "#22d3ee" },
      { name: "CLICK", value: totals.CLICK, fill: "#22c55e" },
    ]
  }, [data])

  if (isLoading) return <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
  if (pivoted.length === 0 && chartType !== "funnel") {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
  }

  const commonProps = { data: pivoted, margin: { top: 5, right: 10, left: 0, bottom: 5 } }

  // Filter funnel data by active series
  const activeFunnelData = funnelData.filter(f => active[f.name as SeriesKey])

  return (
    <div className="space-y-2">
      <SeriesToggle active={active} onChange={toggle} />
      <ResponsiveContainer width="100%" height={200}>
        {chartType === "funnel" ? (
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={activeFunnelData} isAnimationActive>
              <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        ) : chartType === "bar" ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            {active.SEE   && <Bar dataKey="SEE"   fill="#6366f1" radius={[3,3,0,0]} />}
            {active.VIEW  && <Bar dataKey="VIEW"  fill="#22d3ee" radius={[3,3,0,0]} />}
            {active.CLICK && <Bar dataKey="CLICK" fill="#22c55e" radius={[3,3,0,0]} />}
          </BarChart>
        ) : chartType === "area" ? (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            {active.SEE   && <Area type="monotone" dataKey="SEE"   stroke="#6366f1" fill="#6366f120" strokeWidth={2} />}
            {active.VIEW  && <Area type="monotone" dataKey="VIEW"  stroke="#22d3ee" fill="#22d3ee20" strokeWidth={2} />}
            {active.CLICK && <Area type="monotone" dataKey="CLICK" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} />}
          </AreaChart>
        ) : (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            {active.SEE   && <Line type="monotone" dataKey="SEE"   stroke="#6366f1" strokeWidth={2} dot={false} />}
            {active.VIEW  && <Line type="monotone" dataKey="VIEW"  stroke="#22d3ee" strokeWidth={2} dot={false} />}
            {active.CLICK && <Line type="monotone" dataKey="CLICK" stroke="#22c55e" strokeWidth={2} dot={false} />}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// ─── Compare card ─────────────────────────────────────────────────────────────

function CompareCard({
  item,
  range,
  chartType,
  onRemove,
}: {
  item:      CompareItem
  range:     DateRange
  chartType: ChartType
  onRemove:  () => void
}) {
  const [showDrill, setShowDrill] = useState(false)

  return (
    <div
      className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden"
      style={{ borderTop: `3px solid ${item.color}` }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{item.entityType}</p>
          <p className="font-semibold text-sm mt-0.5 truncate max-w-xs">{item.label}</p>
        </div>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition">
          <X size={15} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <ItemChart item={item} range={range} chartType={chartType} />
      </div>

      <div className="border-t dark:border-gray-800 px-5 py-3">
        <button
          onClick={() => setShowDrill(d => !d)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
        >
          {showDrill ? "Hide raw events ↑" : "Show raw events ↓"}
        </button>
      </div>

      {showDrill && (
        <div className="border-t dark:border-gray-800">
          <DrillDownTable item={item} />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [items,     setItems]     = useState<CompareItem[]>([])
  const [range,     setRange]     = useState<DateRange>("30d")
  const [chartType, setChartType] = useState<ChartType>("line")

  function addItem(picked: { entityType: EntityType; entityId: string; label: string }) {
    if (items.length >= 4) return
    if (items.find(i => i.entityId === picked.entityId)) return
    setItems(prev => [
      ...prev,
      { ...picked, color: COLORS[prev.length] },
    ])
  }

  function removeItem(entityId: string) {
    setItems(prev => prev.filter(i => i.entityId !== entityId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Statistics</h1>
          <p className="text-sm text-gray-500 mt-0.5">SEE · VIEW · CLICK analytics per entity</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date range */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {DATE_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  range === r
                    ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {CHART_TYPES.map(c => (
              <button
                key={c}
                onClick={() => setChartType(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                  chartType === c
                    ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
          <BarChart2 size={48} className="opacity-20" />
          <p className="text-sm">Add items below to start comparing their stats</p>
        </div>
      )}

      {/* Compare grid */}
      {items.length > 0 && (
        <div className={`grid gap-5 ${items.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
          {items.map(item => (
            <CompareCard
              key={item.entityId}
              item={item}
              range={range}
              chartType={chartType}
              onRemove={() => removeItem(item.entityId)}
            />
          ))}
        </div>
      )}

      {/* Add item picker — show if under 4 */}
      {items.length < 4 && (
        <EntityPicker onSelect={addItem} />
      )}
    </div>
  )
}
