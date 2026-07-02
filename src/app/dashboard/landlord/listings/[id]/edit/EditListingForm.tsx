"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KENYA_CITIES, NAIROBI_NEIGHBOURHOODS } from "@/types"

const emptyToUndef = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v))

const schema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(120),
  description: z.string().min(30, "Description must be at least 30 characters").max(5000),
  address: z.string().min(5, "Enter a valid address"),
  neighbourhood: z.string().optional(),
  city: z.string().min(2, "Select a city"),
  price: z.coerce.number().positive("Enter a valid price"),
  pricePeriod: z.enum(["NIGHTLY", "WEEKLY", "MONTHLY", "YEARLY"]),
  deposit: z.preprocess(emptyToUndef, z.number().min(0).optional()),
  depositMonths: z.preprocess(emptyToUndef, z.number().int().min(0).max(12).optional()),
  sizeSqft: z.preprocess(emptyToUndef, z.number().positive().optional()),
  bedrooms: z.preprocess(emptyToUndef, z.number().int().min(0).optional()),
  bathrooms: z.preprocess(emptyToUndef, z.number().min(0).optional()),
  floor: z.preprocess(emptyToUndef, z.number().int().optional()),
  parkingSpots: z.preprocess(emptyToUndef, z.number().int().min(0).optional()),
  minLeaseMonths: z.preprocess(emptyToUndef, z.number().int().min(1).optional()),
  availableFrom: z.string().optional(),
  furnished: z.boolean(),
  petsAllowed: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface EditableListing extends Omit<FormData, "deposit" | "depositMonths" | "sizeSqft" | "bedrooms" | "bathrooms" | "floor" | "parkingSpots" | "minLeaseMonths"> {
  id: string
  status: string
  deposit: number | null
  depositMonths: number | null
  sizeSqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  floor: number | null
  parkingSpots: number | null
  minLeaseMonths: number | null
}

export function EditListingForm({ listing }: { listing: EditableListing }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [status, setStatus] = useState(listing.status)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      title: listing.title,
      description: listing.description,
      address: listing.address,
      neighbourhood: listing.neighbourhood ?? "",
      city: listing.city,
      price: listing.price,
      pricePeriod: listing.pricePeriod,
      deposit: listing.deposit ?? undefined,
      depositMonths: listing.depositMonths ?? undefined,
      sizeSqft: listing.sizeSqft ?? undefined,
      bedrooms: listing.bedrooms ?? undefined,
      bathrooms: listing.bathrooms ?? undefined,
      floor: listing.floor ?? undefined,
      parkingSpots: listing.parkingSpots ?? undefined,
      minLeaseMonths: listing.minLeaseMonths ?? undefined,
      availableFrom: listing.availableFrom,
      furnished: listing.furnished,
      petsAllowed: listing.petsAllowed,
    },
  })

  const watchedCity = watch("city")

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          neighbourhood: data.neighbourhood || null,
          availableFrom: data.availableFrom || null,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Listing updated")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update listing")
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus() {
    const next = status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    setTogglingStatus(true)
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setStatus(next)
      toast.success(next === "PAUSED" ? "Listing paused — hidden from search" : "Listing is live again")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setTogglingStatus(false)
    }
  }

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basics */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Basics</h2>
        <Input {...register("title")} label="Listing title" error={errors.title?.message} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea {...register("description")} rows={5} className={inputCls} />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select {...register("city")} className={inputCls}>
              {KENYA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {watchedCity === "Nairobi" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighbourhood</label>
              <select {...register("neighbourhood")} className={inputCls}>
                <option value="">Select neighbourhood</option>
                {NAIROBI_NEIGHBOURHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
        <Input {...register("address")} label="Street address" error={errors.address?.message} />
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Input {...register("bedrooms")} type="number" label="Bedrooms" error={errors.bedrooms?.message} />
          <Input {...register("bathrooms")} type="number" step="0.5" label="Bathrooms" error={errors.bathrooms?.message} />
          <Input {...register("sizeSqft")} type="number" label="Size (sqft)" error={errors.sizeSqft?.message} />
          <Input {...register("parkingSpots")} type="number" label="Parking" error={errors.parkingSpots?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("floor")} type="number" label="Floor (optional)" error={errors.floor?.message} />
          <Input {...register("availableFrom")} type="date" label="Available from" error={errors.availableFrom?.message} />
        </div>
        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register("furnished")} className="w-4 h-4 rounded text-brand-600" />
            Furnished
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register("petsAllowed")} className="w-4 h-4 rounded text-brand-600" />
            Pets allowed
          </label>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("price")} type="number" label="Price (KES)" error={errors.price?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing period</label>
            <select {...register("pricePeriod")} className={inputCls}>
              <option value="NIGHTLY">Nightly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <Input {...register("deposit")} type="number" label="Deposit (KES, optional)" error={errors.deposit?.message} />
          <Input {...register("depositMonths")} type="number" label="Deposit (months)" error={errors.depositMonths?.message} />
          <Input {...register("minLeaseMonths")} type="number" label="Min lease (months)" error={errors.minLeaseMonths?.message} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {(status === "ACTIVE" || status === "PAUSED") ? (
          <Button
            type="button"
            variant="outline"
            loading={togglingStatus}
            onClick={toggleStatus}
            className="gap-1.5"
          >
            {status === "ACTIVE" ? (
              <><Pause className="w-4 h-4" /> Pause listing</>
            ) : (
              <><Play className="w-4 h-4" /> Resume listing</>
            )}
          </Button>
        ) : <span />}
        <Button type="submit" loading={saving}>Save changes</Button>
      </div>
    </form>
  )
}
