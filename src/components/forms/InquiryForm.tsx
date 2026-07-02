"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  moveInDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface InquiryFormProps {
  listingId: string
  listingTitle: string
}

export function InquiryForm({ listingId, listingTitle }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: `Hi, I'm interested in "${listingTitle}". Could you please provide more information?`,
    },
  })

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, listingId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSubmitted(true)
      toast.success("Inquiry sent! The landlord will contact you soon.")
      reset()
    } catch {
      toast.error("Failed to send inquiry. Please try again.")
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✉️</div>
        <h3 className="font-semibold text-gray-900 mb-1">Inquiry sent!</h3>
        <p className="text-sm text-gray-500">The landlord will reach out to you soon.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-brand-600 hover:underline"
        >
          Send another inquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <h3 className="font-semibold text-gray-900">Contact landlord</h3>

      <Input
        {...register("name")}
        label="Your name"
        placeholder="John Kamau"
        error={errors.name?.message}
      />

      <Input
        {...register("email")}
        type="email"
        label="Email address"
        placeholder="john@example.com"
        error={errors.email?.message}
      />

      <Input
        {...register("phone")}
        type="tel"
        label="Phone number"
        placeholder="+254 700 000 000"
        error={errors.phone?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Move-in date (optional)</label>
        <input
          {...register("moveInDate")}
          type="date"
          min={new Date().toISOString().split("T")[0]}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          {...register("message")}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder="Tell the landlord about yourself and your requirements..."
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Send Inquiry
      </Button>

      <p className="text-xs text-gray-400 text-center">
        SpaceLink does not charge tenants. Contact is free.
      </p>
    </form>
  )
}
