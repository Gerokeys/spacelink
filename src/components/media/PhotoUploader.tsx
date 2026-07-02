"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { toast } from "sonner"
import { X, Star, Loader2, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_PHOTO_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_PHOTOS = 30
const ACCEPTED_TYPES = { "image/jpeg": [], "image/png": [], "image/webp": [] }

interface Photo {
  id: string
  cdnUrl: string
  isPrimary: boolean
  order: number
}

interface PhotoUploaderProps {
  listingId: string
  initialPhotos?: Photo[]
}

export function PhotoUploader({ listingId, initialPhotos = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File, order: number) => {
    // Step 1: Get presigned URL
    const presignRes = await fetch(`/api/listings/${listingId}/media/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, size: file.size }),
    })
    const presignJson = await presignRes.json()
    if (!presignJson.success) throw new Error(presignJson.error)

    const { uploadUrl, cdnUrl } = presignJson.data

    // Step 2: Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    })
    if (!uploadRes.ok) throw new Error("Upload to storage failed")

    // Step 3: Save media record to DB
    const saveRes = await fetch(`/api/listings/${listingId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cdnUrl, order }),
    })
    const saveJson = await saveRes.json()
    if (!saveJson.success) throw new Error(saveJson.error)

    return saveJson.data as Photo
  }, [listingId])

  const onDrop = useCallback(async (accepted: File[]) => {
    const remaining = MAX_PHOTOS - photos.length
    const files = accepted.slice(0, remaining)

    if (files.length === 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    setUploading(true)
    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      try {
        const photo = await uploadFile(files[i], photos.length + i)
        setPhotos((prev) => [...prev, photo])
        successCount++
      } catch (err) {
        toast.error(`Failed to upload ${files[i].name}`)
        console.error(err)
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo${successCount > 1 ? "s" : ""} uploaded`)
    }
    setUploading(false)
  }, [photos, uploadFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_PHOTO_SIZE,
    disabled: uploading || photos.length >= MAX_PHOTOS,
  })

  async function handleDelete(photo: Photo) {
    setDeletingId(photo.id)
    try {
      const res = await fetch(`/api/listings/${listingId}/media/${photo.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      toast.success("Photo removed")
    } catch {
      toast.error("Failed to remove photo")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetPrimary(photo: Photo) {
    try {
      const res = await fetch(`/api/listings/${listingId}/media/${photo.id}`, { method: "PATCH" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === photo.id })))
      toast.success("Cover photo updated")
    } catch {
      toast.error("Failed to update cover photo")
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-brand-500 bg-brand-50" : "border-stone-300 hover:border-brand-400 hover:bg-stone-50",
          (uploading || photos.length >= MAX_PHOTOS) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          ) : (
            <ImagePlus className="w-10 h-10 text-stone-400" />
          )}
          <div>
            <p className="font-medium text-stone-700">
              {uploading ? "Uploading..." : isDragActive ? "Drop photos here" : "Drag & drop photos here"}
            </p>
            <p className="text-sm text-stone-400 mt-1">
              or <span className="text-brand-600 font-medium">browse files</span> · JPG, PNG, WebP · Max 10MB each
            </p>
          </div>
          <p className="text-xs text-stone-400">
            {photos.length}/{MAX_PHOTOS} photos uploaded
          </p>
        </div>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-stone-100">
              <Image
                src={photo.cdnUrl}
                alt="Listing photo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />

              {/* Primary badge */}
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <Star className="w-3 h-3" /> Cover
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!photo.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(photo)}
                    className="bg-white text-stone-800 text-xs px-2 py-1 rounded-lg font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    Set cover
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                  className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
