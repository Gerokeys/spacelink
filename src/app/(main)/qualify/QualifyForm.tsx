"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, ArrowLeft, CheckCircle, MapPin, Home, Building2, Store, Moon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listings/ListingCard"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { KENYA_CITIES } from "@/types"
import type { ListingCard as ListingCardType } from "@/types"
import Link from "next/link"

const CITIES = KENYA_CITIES

const PROPERTY_TYPES = [
  { value: "RESIDENTIAL", label: "Residential", desc: "Apartment, house, bedsitter", icon: Home },
  { value: "OFFICE", label: "Office Space", desc: "Private or co-working", icon: Building2 },
  { value: "COMMERCIAL", label: "Commercial", desc: "Shop, warehouse, land", icon: Store },
  { value: "SHORT_TERM", label: "Short-term", desc: "Furnished, nightly/weekly", icon: Moon },
]

const INCOME_RANGES = [
  { label: "Under KES 30k", max: 9000 },
  { label: "KES 30k – 60k", max: 18000 },
  { label: "KES 60k – 100k", max: 30000 },
  { label: "KES 100k – 200k", max: 60000 },
  { label: "KES 200k+", max: 150000 },
]

interface FormState {
  incomeRange: number | null
  customBudget: string
  useCustomBudget: boolean
  city: string
  propertyType: string
  furnished: boolean
  petsAllowed: boolean
  minBedrooms: number
}

type Step = 0 | 1 | 2 | 3

async function fetchQualifyResults(filters: {
  maxPrice: number
  city: string
  type: string
  furnished?: boolean
  petsAllowed?: boolean
  minBedrooms?: number
}): Promise<ListingCardType[]> {
  const params = new URLSearchParams({
    maxPrice: String(filters.maxPrice),
    city: filters.city,
    type: filters.type,
    ...(filters.furnished ? { furnished: "true" } : {}),
    ...(filters.petsAllowed ? { petsAllowed: "true" } : {}),
    ...(filters.minBedrooms ? { minBedrooms: String(filters.minBedrooms) } : {}),
    sortBy: "price_asc",
    limit: "12",
  })
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data?.listings ?? []
}

export function QualifyForm() {
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormState>({
    incomeRange: null,
    customBudget: "",
    useCustomBudget: false,
    city: "Nairobi",
    propertyType: "RESIDENTIAL",
    furnished: false,
    petsAllowed: false,
    minBedrooms: 0,
  })

  // Calculate max rent (30% of income rule, or custom budget directly)
  const maxRent = form.useCustomBudget
    ? Number(form.customBudget) || 0
    : form.incomeRange ?? 0

  const canFetch = step === 3 && maxRent > 0

  const { data: results, isLoading } = useQuery({
    queryKey: ["qualify", form],
    queryFn: () => fetchQualifyResults({
      maxPrice: maxRent,
      city: form.city,
      type: form.propertyType,
      furnished: form.furnished || undefined,
      petsAllowed: form.petsAllowed || undefined,
      minBedrooms: form.minBedrooms || undefined,
    }),
    enabled: canFetch,
  })

  const STEPS = ["Budget", "Location", "Requirements", "Results"]

  function next() { setStep((s) => Math.min(3, s + 1) as Step) }
  function back() { setStep((s) => Math.max(0, s - 1) as Step) }

  const canProceed = [
    form.incomeRange !== null || (form.useCustomBudget && Number(form.customBudget) > 0),
    form.city !== "",
    form.propertyType !== "",
    true,
  ][step]

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-stone-100">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex-1 text-center py-3.5 text-xs font-medium transition-colors",
              i === step ? "bg-brand-600 text-white" :
              i < step ? "bg-brand-50 text-brand-700" :
              "text-stone-400"
            )}
          >
            {i < step ? <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> : null}
            {s}
          </div>
        ))}
      </div>

      <div className="p-6 md:p-8">
        {/* Step 0 — Budget */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">What's your budget?</h2>
            <p className="text-stone-500 text-sm mb-6">
              We recommend spending no more than 30% of your income on rent.
            </p>

            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setForm((f) => ({ ...f, useCustomBudget: false }))}
                className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                  !form.useCustomBudget ? "border-brand-500 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-600"
                )}
              >
                Enter my income
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, useCustomBudget: true }))}
                className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                  form.useCustomBudget ? "border-brand-500 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-600"
                )}
              >
                Enter my budget directly
              </button>
            </div>

            {!form.useCustomBudget ? (
              <div className="space-y-2">
                <p className="text-xs text-stone-500 mb-3">Select your gross monthly income:</p>
                {INCOME_RANGES.map(({ label, max }) => (
                  <button
                    key={label}
                    onClick={() => setForm((f) => ({ ...f, incomeRange: max }))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors",
                      form.incomeRange === max
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                        : "border-stone-200 text-stone-700 hover:border-stone-300"
                    )}
                  >
                    <span>{label}</span>
                    <span className="text-xs text-stone-400">
                      Max rent: {formatPrice(max, "KES")}/mo
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Monthly rent budget (KES)
                </label>
                <input
                  type="number"
                  value={form.customBudget}
                  onChange={(e) => setForm((f) => ({ ...f, customBudget: e.target.value }))}
                  placeholder="e.g. 35000"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Where are you looking?</h2>
            <p className="text-stone-500 text-sm mb-6">Select the city you want to move to.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setForm((f) => ({ ...f, city }))}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors",
                    form.city === city
                      ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                      : "border-stone-200 text-stone-700 hover:border-stone-300"
                  )}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Requirements */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 mb-1">What do you need?</h2>
            <p className="text-stone-500 text-sm mb-6">Tell us about the type of space you're looking for.</p>

            <div className="mb-5">
              <p className="text-sm font-medium text-stone-700 mb-2">Property type</p>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, propertyType: value }))}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border text-left transition-colors",
                      form.propertyType === value
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 hover:border-stone-300"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", form.propertyType === value ? "text-brand-600" : "text-stone-400")} />
                    <div>
                      <div className={cn("text-sm font-medium", form.propertyType === value ? "text-brand-700" : "text-stone-800")}>{label}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {form.propertyType === "RESIDENTIAL" && (
              <div className="mb-5">
                <p className="text-sm font-medium text-stone-700 mb-2">Minimum bedrooms</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, minBedrooms: n }))}
                      className={cn(
                        "w-12 h-12 rounded-xl border text-sm font-medium transition-colors",
                        form.minBedrooms === n
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      )}
                    >
                      {n === 0 ? "Any" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.furnished}
                  onChange={(e) => setForm((f) => ({ ...f, furnished: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-sm text-stone-700">Furnished</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.petsAllowed}
                  onChange={(e) => setForm((f) => ({ ...f, petsAllowed: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-sm text-stone-700">Pets allowed</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && (
          <div>
            {/* Budget summary card */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 mb-6">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-brand-600 text-xs font-medium uppercase tracking-wide mb-0.5">Max monthly rent</p>
                  <p className="text-2xl font-bold text-stone-900">{formatPrice(maxRent, "KES")}</p>
                </div>
                <div>
                  <p className="text-brand-600 text-xs font-medium uppercase tracking-wide mb-0.5">City</p>
                  <p className="text-lg font-semibold text-stone-900">{form.city}</p>
                </div>
                <div>
                  <p className="text-brand-600 text-xs font-medium uppercase tracking-wide mb-0.5">Type</p>
                  <p className="text-lg font-semibold text-stone-900">
                    {PROPERTY_TYPES.find((t) => t.value === form.propertyType)?.label}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-stone-900 mb-4">Listings you qualify for</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-stone-100">
                    <div className="h-44 bg-stone-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <>
                <p className="text-sm text-stone-500 mb-4">{results.length} listing{results.length !== 1 ? "s" : ""} match your criteria</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} compact />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href={`/search?maxPrice=${maxRent}&city=${form.city}&type=${form.propertyType}`}>
                    <Button size="lg" className="gap-2">
                      <Search className="w-4 h-4" /> See all matching listings
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl">
                <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="font-medium text-stone-700 mb-1">No listings in your range yet</p>
                <p className="text-sm text-stone-400 mb-5 max-w-xs mx-auto">
                  We're growing fast. Browse all listings or adjust your budget.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setStep(0)} className="text-sm text-brand-600 underline">Adjust budget</button>
                  <Link href="/search"><Button variant="outline" size="sm">Browse all listings</Button></Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-stone-100">
          <Button variant="outline" onClick={back} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={next} disabled={!canProceed}>
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Link href="/search">
              <Button variant="outline">View all listings</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
