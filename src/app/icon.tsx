import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import path from "path"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  const imageBuffer = readFileSync(
    path.join(process.cwd(), "public/images/logo.png")
  )
  const src = `data:image/png;base64,${imageBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderRadius: 12,
          padding: 4,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="SpaceLink" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    ),
    { ...size }
  )
}
