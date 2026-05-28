import { db } from "@/lib/db"
import { UsersManager } from "./UsersManager"

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { listings: true, inquiries: true } },
    },
  })

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage user roles — change the dropdown and it saves immediately
        </p>
      </div>
      <UsersManager users={serialized} />
    </div>
  )
}
