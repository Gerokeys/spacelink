import { cn } from "@/lib/utils"

interface LogoProps {
  /** Render for a dark background (white text + pin) instead of light */
  onDark?: boolean
  /** Controls overall size via font-size; the pin scales with it (em-based) */
  className?: string
}

/**
 * The Locale wordmark: a location pin + "Locale". Inline SVG + text so it
 * stays crisp at any size and adapts to light/dark backgrounds — matches
 * the favicon and OpenGraph mark.
 */
export function Logo({ onDark = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-extrabold tracking-tight leading-none", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={cn("w-[1.15em] h-[1.15em] shrink-0", onDark ? "text-white" : "text-brand-600")}
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      </svg>
      <span className={onDark ? "text-white" : "text-gray-900"}>Locale</span>
    </span>
  )
}
