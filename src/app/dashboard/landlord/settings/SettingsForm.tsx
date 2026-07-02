"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Shield, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SettingsData {
  name: string
  email: string
  phone: string
  company: string
  bio: string
  website: string
  city: string
  idVerificationStatus: string
}

export function SettingsForm({ initial }: { initial: SettingsData }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function set<K extends keyof SettingsData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          bio: form.bio,
          website: form.website,
          city: form.city,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        if (json.details) {
          const errs: Record<string, string> = {}
          for (const [field, messages] of Object.entries(json.details as Record<string, string[]>)) {
            errs[field] = messages[0]
          }
          setFieldErrors(errs)
        }
        throw new Error(json.error)
      }
      toast.success("Profile updated")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const verified = form.idVerificationStatus === "VERIFIED"

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Verification status */}
      <div
        className={
          verified
            ? "flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            : "flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        }
      >
        {verified ? <Shield className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
        {verified
          ? "Your identity is verified — listings show a Verified badge."
          : "Your identity is not verified yet. Verified landlords get more inquiries."}
      </div>

      {/* Account */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Account</h2>
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={fieldErrors.name}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            value={form.email}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Linked to your Google account and can't be changed here.</p>
        </div>
        <Input
          label="Phone number"
          placeholder="+254 7XX XXX XXX"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={fieldErrors.phone}
        />
      </div>

      {/* Public profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Public profile</h2>
        <Input
          label="Company (optional)"
          placeholder="e.g. Acme Properties Ltd"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
          error={fieldErrors.company}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">About you (optional)</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell tenants a little about yourself or your company..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {fieldErrors.bio && <p className="text-xs text-red-500 mt-1">{fieldErrors.bio}</p>}
        </div>
        <Input
          label="Website (optional)"
          placeholder="https://example.com"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          error={fieldErrors.website}
        />
        <Input
          label="City (optional)"
          placeholder="e.g. Nairobi"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          error={fieldErrors.city}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
