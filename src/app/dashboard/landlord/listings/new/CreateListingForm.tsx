"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KENYA_CITIES, NAIROBI_NEIGHBOURHOODS, LISTING_TYPE_LABELS } from "@/types"
import type { ListingType } from "@/types"
import { cn } from "@/lib/utils"

interface Amenity {
  id: string
  name: string
  icon: string
  category: string
}

const STEPS = ["Type", "Location", "Details", "Pricing", "Amenities", "Review"]

const schema = z.object({
  type: z.enum(["RESIDENTIAL", "OFFICE", "COMMERCIAL", "SHORT_TERM"]),
  address: z.string().min(5, "Enter a valid address"),
  neighbourhood: z.string().optional(),
  city: z.string().min(2, "Select a city"),
  title: z.string().min(10, "Title must be at least 10 characters").max(120),
  description: z.string().min(30, "Description must be at least 30 characters").max(5000),
  sizeSqft: z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), z.number().positive().optional()),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  parkingSpots: z.coerce.number().int().min(0).default(0),
  floor: z.coerce.number().int().optional(),
  furnished: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  price: z.coerce.number().positive("Enter a valid price"),
  pricePeriod: z.enum(["NIGHTLY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  currency: z.string().default("KES"),
  deposit: z.coerce.number().optional(),
  depositMonths: z.coerce.number().int().min(0).max(12).default(1),
  minLeaseMonths: z.coerce.number().int().min(1).default(6),
  availableFrom: z.string().optional(),
  amenityIds: z.array(z.string()).default([]),
})

type FormData = z.infer<typeof schema>

export function CreateListingForm({ amenities }: { amenities: Amenity[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      type: "RESIDENTIAL",
      city: "Nairobi",
      pricePeriod: "MONTHLY",
      currency: "KES",
      depositMonths: 1,
      minLeaseMonths: 6,
      parkingSpots: 0,
      furnished: false,
      petsAllowed: false,
      amenityIds: [],
    },
  })

  const { register, watch, setValue, getValues, formState: { errors } } = form
  const watchedType = watch("type")
  const watchedAmenityIds = watch("amenityIds")
  const watchedCity = watch("city")

  const amenitiesByCategory = amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  function toggleAmenity(id: string) {
    const current = getValues("amenityIds")
    setValue(
      "amenityIds",
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sizeSqft: data.sizeSqft ?? undefined,
          bedrooms: data.bedrooms ?? undefined,
          bathrooms: data.bathrooms ?? undefined,
          floor: data.floor ?? undefined,
          deposit: data.deposit ?? undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success("Listing submitted! Now add some photos.")
      router.push(`/dashboard/landlord/listings/${json.data.id}/photos`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing")
    } finally {
      setSubmitting(false)
    }
  }

  const isResidential = watchedType === "RESIDENTIAL" || watchedType === "SHORT_TERM"

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                i === step ? "bg-brand-600 text-white" :
                i < step ? "bg-brand-100 text-brand-700 cursor-pointer hover:bg-brand-200" :
                "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 shrink-0" />}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors)
          toast.error("Some fields are invalid. Please go back and check all steps.")
        })}>
        {/* Step 0: Type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">What type of space are you listing?</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LISTING_TYPE_LABELS) as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue("type", type)}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-colors",
                    watchedType === type
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-semibold text-gray-900">{LISTING_TYPE_LABELS[type]}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {{
                      RESIDENTIAL: "Apartments, houses, rooms, studios",
                      OFFICE: "Private offices, co-working, serviced",
                      COMMERCIAL: "Retail, warehouse, restaurant space",
                      SHORT_TERM: "Nightly or weekly rentals",
                    }[type]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Where is the property?</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                {...register("city")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {KENYA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {watchedCity === "Nairobi" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighbourhood (optional)</label>
                <select
                  {...register("neighbourhood")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select neighbourhood</option>
                  {NAIROBI_NEIGHBOURHOODS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
            <Input
              {...register("address")}
              label="Street address"
              placeholder="e.g. Parklands Road, next to ABC Supermarket"
              error={errors.address?.message}
            />
          </div>
        )}

        {/* Step 2: Property details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Property details</h2>
            <Input
              {...register("title")}
              label="Listing title"
              placeholder="e.g. Spacious 2BR apartment in Westlands with pool"
              error={errors.title?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={5}
                placeholder="Describe the property in detail — layout, building, surroundings, nearby amenities..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isResidential && (
                <>
                  <Input
                    {...register("bedrooms", {})}
                    type="number" min={0}
                    label="Bedrooms (0 = studio)"
                    placeholder="2"
                    error={errors.bedrooms?.message}
                  />
                  <Input
                    {...register("bathrooms", {})}
                    type="number" min={0} step={0.5}
                    label="Bathrooms"
                    placeholder="1"
                    error={errors.bathrooms?.message}
                  />
                </>
              )}
              <Input
                {...register("sizeSqft", {})}
                type="number" min={0}
                label="Size (sq ft)"
                placeholder="850"
              />
              <Input
                {...register("parkingSpots", {})}
                type="number" min={0}
                label="Parking spots"
                placeholder="1"
              />
              <Input
                {...register("floor", {})}
                type="number" min={0}
                label="Floor number"
                placeholder="3"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("furnished")} className="w-4 h-4 rounded text-brand-600" />
                <span className="text-sm text-gray-700">Furnished</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("petsAllowed")} className="w-4 h-4 rounded text-brand-600" />
                <span className="text-sm text-gray-700">Pets allowed</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register("price", {})}
                type="number" min={0}
                label="Rent amount (KES)"
                placeholder="45000"
                error={errors.price?.message}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Per</label>
                <select
                  {...register("pricePeriod")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="MONTHLY">Month</option>
                  <option value="YEARLY">Year</option>
                  <option value="WEEKLY">Week</option>
                  <option value="NIGHTLY">Night</option>
                </select>
              </div>
              <Input
                {...register("deposit", {})}
                type="number" min={0}
                label="Security deposit (KES)"
                placeholder="45000"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit months</label>
                <select
                  {...register("depositMonths", {})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {[1, 2, 3, 6].map((n) => <option key={n} value={n}>{n} month{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum lease</label>
                <select
                  {...register("minLeaseMonths", {})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {[1, 3, 6, 12, 24].map((n) => <option key={n} value={n}>{n} month{n > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available from</label>
                <input
                  {...register("availableFrom")}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Amenities */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">Amenities & features</h2>
            <p className="text-sm text-gray-500">Select all that apply to your property.</p>
            {Object.entries(amenitiesByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-600 mb-2">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((amenity) => {
                    const selected = watchedAmenityIds.includes(amenity.id)
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-colors",
                          selected ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:border-gray-400"
                        )}
                      >
                        {amenity.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {amenities.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                No amenities available yet. An admin will add them.
              </p>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Review & submit</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
              {[
                ["Type", LISTING_TYPE_LABELS[getValues("type")]],
                ["Title", getValues("title")],
                ["City", getValues("city")],
                ["Neighbourhood", getValues("neighbourhood") || "—"],
                ["Address", getValues("address")],
                ["Price", `KES ${getValues("price")?.toLocaleString()} / ${getValues("pricePeriod").toLowerCase()}`],
                ["Amenities selected", watchedAmenityIds.length.toString()],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="text-gray-400 w-36 shrink-0">{label}</span>
                  <span className="text-gray-800 font-medium flex-1">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>What happens next:</strong> Your listing will be reviewed by our team within 24 hours.
              You&apos;ll receive an email once it&apos;s live. You can still add photos after submission.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              loading={submitting}
            >
              Submit Listing
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
