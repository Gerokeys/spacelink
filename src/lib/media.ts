import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

// Cloudflare R2 uses the S3-compatible API
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!

export type MediaFolder = "listings" | "tours" | "profiles" | "documents"

export function generateMediaKey(folder: MediaFolder, ext: string): string {
  const id = crypto.randomBytes(16).toString("hex")
  return `${folder}/${id}.${ext}`
}

export function getCdnUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  maxSizeBytes: number = 20 * 1024 * 1024 // 20MB default
): Promise<{ uploadUrl: string; cdnUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 }) // 5 min
  return { uploadUrl, cdnUrl: getCdnUrl(key) }
}

export async function deleteMedia(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  )
}

export function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
  }
  return map[mimeType] ?? "bin"
}

export function validateImageMime(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType)
}

export function validate360ImageMime(mimeType: string): boolean {
  return ["image/jpeg", "image/png"].includes(mimeType)
}

export function validateVideoMime(mimeType: string): boolean {
  return ["video/mp4", "video/webm", "video/quicktime"].includes(mimeType)
}

// Max sizes
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024     // 10 MB
export const MAX_TOUR_SIZE = 50 * 1024 * 1024      // 50 MB (360° images are large)
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024    // 500 MB
export const MAX_PHOTOS_PER_LISTING = 30
export const MIN_PHOTOS_PER_LISTING = 3
