"use client"

import { useSession, signIn } from "next-auth/react"
import { Sparkles, Heart, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

const PERKS = [
  { icon: Heart, label: "Save listings" },
  { icon: Bell, label: "Get alerts" },
  { icon: Search, label: "Personalised results" },
]

export function SignInBanner() {
  const { data: session, status } = useSession()

  if (status === "loading" || session) return null

  return (
    <section className="bg-teal-600 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Get a personalised experience
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-teal-100">
                {PERKS.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => signIn("google")}
              className="bg-white text-teal-700 hover:bg-teal-50 font-semibold"
              size="lg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            <p className="text-sm text-teal-200 hidden sm:block">Free, takes 10 seconds</p>
          </div>
        </div>
      </div>
    </section>
  )
}
