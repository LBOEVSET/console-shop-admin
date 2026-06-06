"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import {
  Search, Users, ShieldCheck, ShieldOff, ShoppingCart, UserCircle2,
  Star, Gift, X, Check, ChevronDown,
} from "lucide-react"
import Pagination from "@/components/Pagination"

const PAGE_SIZE = 20

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpendingTier {
  id: string; name: string; slug: string; color: string; badgeIcon: string
}

interface SubscriptionPlan {
  id: string; name: string; slug: string; color: string; badgeIcon: string; priceUsd: number; durationDays: number
}

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  birthday?: string
  profileImage: string | null
  role: "CUSTOMER" | "ADMIN"
  status: number
  createdAt: string
  totalSpend: number
  tier: SpendingTier | null
  subscription: { plan: SubscriptionPlan; endDate: string } | null
  _count: { orders: number }
}

type RoleTab   = "CUSTOMER" | "ADMIN"
type StatusTab = "ALL" | "ACTIVE" | "BANNED"

// ─── Tier / sub badge helpers ─────────────────────────────────────────────────

function TierBadge({ tier }: { tier: SpendingTier }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: tier.color, borderColor: tier.color + "55", background: tier.color + "18" }}
    >
      {tier.badgeIcon} {tier.name}
    </span>
  )
}

function SubBadge({ plan }: { plan: SubscriptionPlan }) {
  if (plan.slug === "normal") return null
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: plan.color, borderColor: plan.color + "55", background: plan.color + "18" }}
    >
      {plan.badgeIcon} {plan.name}
    </span>
  )
}

// ─── Grant subscription modal ─────────────────────────────────────────────────

function GrantModal({
  user,
  plans,
  onClose,
}: {
  user: User
  plans: SubscriptionPlan[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [planId, setPlanId] = useState(plans[1]?.id ?? plans[0]?.id ?? "")
  const [days,   setDays]   = useState("")
  const [note,   setNote]   = useState("")

  const { mutate: grant, isPending } = useMutation({
    mutationFn: async () => {
      await api.post("/subscription/admin/grant", {
        userId: user.id,
        planId,
        durationDays: days ? Number(days) : undefined,
        note: note || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      onClose()
    },
  })

  const selectedPlan = plans.find((p) => p.id === planId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Gift size={18} className="text-indigo-400" /> Grant Subscription
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {user.firstName} {user.lastName} · @{user.username}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1">
            <X size={18} />
          </button>
        </div>

        {/* Current subscription */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
          <span className="text-xl">{user.subscription ? user.subscription.plan.badgeIcon : "🎮"}</span>
          <div>
            <p className="text-xs text-gray-500">Current subscription</p>
            <p className="text-sm font-semibold">
              {user.subscription ? user.subscription.plan.name : "Normal (no subscription)"}
            </p>
          </div>
        </div>

        {/* Plan selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Plan</label>
          <div className="relative">
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 text-sm rounded-lg border border-white/15 bg-white/5
                text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.badgeIcon} {p.name} {p.priceUsd > 0 ? `($${p.priceUsd}/month)` : "(Free)"}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {selectedPlan && (
            <p className="text-xs text-gray-500">
              Default duration: <span className="text-white">{selectedPlan.durationDays > 0 ? `${selectedPlan.durationDays} days` : "—"}</span>
            </p>
          )}
        </div>

        {/* Custom duration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Duration (days) <span className="font-normal text-gray-600">— leave blank to use plan default</span>
          </label>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder={selectedPlan ? String(selectedPlan.durationDays) : "30"}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-white/15 bg-white/5
              text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Note <span className="font-normal text-gray-600">— optional</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Manual grant for promotion"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-white/15 bg-white/5
              text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => grant()}
            disabled={isPending || !planId}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold
              rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
          >
            {isPending
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><Check size={15} /> Grant Subscription</>}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm border border-white/15 hover:border-white/30 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: User }) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
  if (user.profileImage) {
    return <img src={user.profileImage} alt={initials} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
  }
  const colors = user.role === "ADMIN"
    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
  return (
    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${colors}`}>
      {initials || "?"}
    </div>
  )
}

// ─── User Table ───────────────────────────────────────────────────────────────

function UserTable({
  users, toggling, plans, onToggle, isStaff,
}: {
  users: User[]
  toggling: boolean
  plans: SubscriptionPlan[]
  onToggle: (id: string, status: number) => void
  isStaff: boolean
}) {
  const [grantTarget, setGrantTarget] = useState<User | null>(null)

  if (users.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        No {isStaff ? "staff members" : "customers"} found
      </div>
    )
  }

  return (
    <>
      {grantTarget && (
        <GrantModal user={grantTarget} plans={plans} onClose={() => setGrantTarget(null)} />
      )}

      {/* Header */}
      <div className="grid gap-3 px-5 py-3 border-b dark:border-gray-800
        text-[11px] font-semibold uppercase tracking-wider text-gray-500
        grid-cols-[2fr_2fr_1fr_1fr_1fr_100px]">
        <span>User</span>
        <span>Email</span>
        <span>Tier / Sub</span>
        <span>Orders · Spend</span>
        <span>Joined</span>
        <span className="text-right">Actions</span>
      </div>

      {users.map((user) => {
        const banned = user.status === 0
        return (
          <div
            key={user.id}
            className="grid gap-3 items-center px-5 py-3 border-b last:border-0 dark:border-gray-800
              hover:bg-gray-50 dark:hover:bg-gray-800/50 transition
              grid-cols-[2fr_2fr_1fr_1fr_1fr_100px]"
          >
            {/* User */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 truncate">@{user.username}</p>
              </div>
            </div>

            {/* Email */}
            <div className="min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{user.email}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                ${banned
                  ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
                {banned ? "Banned" : "Active"}
              </span>
            </div>

            {/* Tier / Sub */}
            <div className="flex flex-col gap-1">
              {user.tier ? <TierBadge tier={user.tier} /> : <TierBadge tier={{ id: "", name: "Bronze", slug: "bronze", color: "#cd7f32", badgeIcon: "🥉" }} />}
              {user.subscription ? <SubBadge plan={user.subscription.plan} /> : null}
            </div>

            {/* Orders · Spend */}
            <div className="text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <ShoppingCart size={11} className="text-gray-400" />
                {user._count.orders} orders
              </div>
              <p className="text-xs text-gray-400">${(user.totalSpend ?? 0).toFixed(2)}</p>
            </div>

            {/* Joined */}
            <p className="text-xs text-gray-400">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
              {!isStaff && (
                <button
                  onClick={() => setGrantTarget(user)}
                  title="Grant subscription"
                  className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                onClick={() => onToggle(user.id, banned ? 1 : 0)}
                disabled={toggling || isStaff}
                title={isStaff ? "Cannot ban staff" : banned ? "Unban user" : "Ban user"}
                className={`p-1.5 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed
                  ${banned
                    ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
              >
                {banned ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              </button>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState("")
  const [query,     setQuery]     = useState("")
  const [roleTab,   setRoleTab]   = useState<RoleTab>("CUSTOMER")
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL")

  const queryClient = useQueryClient()

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-users", page, query],
    queryFn: async () => {
      const q = new URLSearchParams()
      q.set("page",  String(page))
      q.set("limit", String(PAGE_SIZE))
      if (query) q.set("search", query)
      const r = await api.get(`/profile/admin/users?${q}`)
      return r.data?.data ?? r.data
    },
    placeholderData: (prev: any) => prev,
  })

  const { data: plansData } = useQuery({
    queryKey: ["subscription-plans-admin"],
    queryFn: async () => {
      const r = await api.get("/subscription/admin/plans")
      return (r.data?.data ?? r.data) as SubscriptionPlan[]
    },
  })

  const { mutate: toggleStatus, isPending: toggling } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) => {
      await api.patch(`/profile/admin/users/${id}/status`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  })

  const allUsers: User[]   = res?.data ?? []
  const totalPages: number = res?.totalPages ?? 1
  const total: number      = res?.total ?? 0
  const plans              = plansData ?? []

  const byRole = allUsers.filter((u) => u.role === roleTab)
  const users  = byRole.filter((u) => {
    if (statusTab === "ACTIVE") return u.status === 1
    if (statusTab === "BANNED") return u.status === 0
    return true
  })

  const customerCount = allUsers.filter((u) => u.role === "CUSTOMER").length
  const staffCount    = allUsers.filter((u) => u.role === "ADMIN").length

  const handleSearch  = () => { setQuery(search); setPage(1) }
  const handleRoleTab = (tab: RoleTab) => { setRoleTab(tab); setStatusTab("ALL"); setPage(1) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={22} /> User Management
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} registered user{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name, email, or username…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border dark:border-gray-700
              bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
        >
          Search
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-3 border-b dark:border-gray-800">
        {([
          { value: "CUSTOMER", label: "Customers", icon: <UserCircle2 size={14} />, count: customerCount },
          { value: "ADMIN",    label: "Staff",     icon: <ShieldCheck  size={14} />, count: staffCount    },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => handleRoleTab(t.value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              roleTab === t.value
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              roleTab === t.value
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Status sub-filter */}
      {roleTab === "CUSTOMER" && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
          {(["ALL", "ACTIVE", "BANNED"] as StatusTab[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                statusTab === s
                  ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-gray-50 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : (
          <UserTable
            users={users}
            toggling={toggling}
            plans={plans}
            onToggle={(id, status) => toggleStatus({ id, status })}
            isStaff={roleTab === "ADMIN"}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }}
      />
    </div>
  )
}
