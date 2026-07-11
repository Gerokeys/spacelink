import { QualifyForm } from "./QualifyForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find What You Qualify For — Locale",
  description: "Answer a few questions and discover which listings fit your budget and lifestyle.",
}

export default function QualifyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1.5 rounded-full border border-brand-100 mb-4">
            Affordability calculator
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-3">
            Find spaces you qualify for
          </h1>
          <p className="text-stone-500">
            Answer 4 quick questions. We'll show you listings that match your budget and lifestyle.
          </p>
        </div>
        <QualifyForm />
      </div>
    </div>
  )
}
