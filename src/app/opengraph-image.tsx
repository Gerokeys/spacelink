import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Locale — find your next space in Kenya"

const PIN =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#ffffff'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z'/></svg>"

const TYPES = ["Residential", "Office", "Commercial", "Short-term"]

export default function OpengraphImage() {
  const pin = `data:image/svg+xml;base64,${Buffer.from(PIN).toString("base64")}`
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 76px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "#006AFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pin} width={48} height={48} alt="" />
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#0A2540", letterSpacing: "-1px" }}>
            Locale
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: "#0A2540", lineHeight: 1.08, letterSpacing: "-2px" }}>
            Find your next space in Kenya
          </div>
          <div style={{ fontSize: 32, color: "#64748B", lineHeight: 1.3 }}>
            Homes, offices &amp; commercial spaces — direct from verified landlords. No agents.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {TYPES.map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: 24,
                  color: "#0056CE",
                  background: "#EAF2FF",
                  padding: "10px 20px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#006AFF" }}>
            locale.co.ke
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 14, background: "#006AFF" }} />
      </div>
    ),
    { ...size }
  )
}
