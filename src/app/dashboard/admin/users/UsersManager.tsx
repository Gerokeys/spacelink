"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"

type UserRole = "TENANT" | "LANDLORD" | "AGENT" | "ADMIN" | "SUPER_ADMIN"

interface UserRow {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  createdAt: string
  _count: { listings: number; inquiries: number }
}

const ROLES: UserRole[] = ["TENANT", "LANDLORD", "AGENT", "ADMIN", "SUPER_ADMIN"]

const ROLE_STYLES: Record<UserRole, string> = {
  TENANT: "bg-gray-100 text-gray-600",
  LANDLORD: "bg-blue-100 text-blue-700",
  AGENT: "bg-violet-100 text-violet-700",
  ADMIN: "bg-brand-100 text-brand-700",
  SUPER_ADMIN: "bg-rose-100 text-rose-700",
}

export function UsersManager({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  async function handleRoleChange(id: string, role: UserRole) {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      toast.success("User role updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setLoading(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or role..."
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Current Role</th>
              <th className="text-left px-5 py-3 font-medium">Listings</th>
              <th className="text-left px-5 py-3 font-medium">Inquiries</th>
              <th className="text-left px-5 py-3 font-medium">Joined</th>
              <th className="text-left px-5 py-3 font-medium">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
                      {user.name?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name ?? "—"}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[user.role]}`}>
                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">{user._count.listings}</td>
                <td className="px-5 py-4 text-gray-600">{user._count.inquiries}</td>
                <td className="px-5 py-4 text-gray-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={loading === user.id}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {loading === user.id && (
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No users found</div>
        )}
      </div>
    </div>
  )
}
