"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAdminAuth } from "@/store/auth.store"
import { User, Mail, Shield } from "lucide-react"

export default function AdminProfilePage() {
  const { admin: user } = useAdminAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const res = await api.get("/profile")
      return res.data.data
    },
  })

  const display = profile ?? user

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {display?.profileImage
                ? <img src={display.profileImage} className="w-16 h-16 rounded-full object-cover" alt="avatar" />
                : <User size={28} className="text-gray-400" />
              }
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {display?.firstName} {display?.lastName}
              </p>
              <p className="text-sm text-gray-500">@{display?.username}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center gap-3 py-3">
              <Mail size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{display?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Shield size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Role</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{display?.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
