export type UserRole = "TENANT" | "LANDLORD" | "AGENT" | "ADMIN" | "SUPER_ADMIN"
export type ListingType = "RESIDENTIAL" | "OFFICE" | "COMMERCIAL" | "SHORT_TERM"
export type ListingStatus = "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" | "REJECTED"
export type PricePeriod = "NIGHTLY" | "WEEKLY" | "MONTHLY" | "YEARLY"
export type MediaType = "PHOTO" | "VIDEO" | "TOUR_360" | "FLOOR_PLAN"
export type InquiryStatus = "PENDING" | "RESPONDED" | "CLOSED" | "ARCHIVED"

export interface ListingMedia {
  id: string
  type: MediaType
  url: string
  cdnUrl?: string | null
  thumbnailUrl?: string | null
  blurHash?: string | null
  width?: number | null
  height?: number | null
  order: number
  isPrimary: boolean
  caption?: string | null
}

export interface Amenity {
  id: string
  name: string
  icon: string
  category: string
}

export interface ListingOwner {
  id: string
  name: string | null
  image: string | null
  profile: {
    idVerificationStatus: string
    responseRate: number | null
    responseTimeHours: number | null
    company: string | null
  } | null
}

export interface ListingCard {
  id: string
  type: ListingType
  status: ListingStatus
  title: string
  price: number
  pricePeriod: PricePeriod
  currency: string
  address: string
  neighbourhood: string | null
  city: string
  lat: number | null
  lng: number | null
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number | null
  furnished: boolean
  petsAllowed: boolean
  primaryPhoto: string | null
  blurHash: string | null
  hasTour360: boolean
  hasVideo: boolean
  isFeatured: boolean
  viewCount: number
  createdAt: string
  owner: ListingOwner
}

export interface ListingDetail extends ListingCard {
  description: string
  deposit: number | null
  depositMonths: number | null
  floor: number | null
  totalFloors: number | null
  yearBuilt: number | null
  parkingSpots: number
  availableFrom: string | null
  minLeaseMonths: number | null
  maxLeaseMonths: number | null
  media: ListingMedia[]
  amenities: Amenity[]
  tourConfig: TourConfig | null
  averageRating: number | null
  reviewCount: number
}

export interface TourScene {
  id: string
  sceneKey: string
  label: string
  imageUrl: string
  cdnUrl: string | null
  order: number
  isDefault: boolean
}

export interface TourConfig {
  id: string
  config: Record<string, unknown>
  scenes: TourScene[]
}

export interface SearchFilters {
  query?: string
  type?: ListingType | ListingType[]
  city?: string
  neighbourhood?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  furnished?: boolean
  petsAllowed?: boolean
  hasVirtualTour?: boolean
  amenities?: string[]
  availableFrom?: string
  lat?: number
  lng?: number
  radiusKm?: number
  sortBy?: "price_asc" | "price_desc" | "newest" | "closest" | "popular"
  page?: number
  limit?: number
}

export interface SearchResult {
  listings: ListingCard[]
  total: number
  page: number
  totalPages: number
}

export interface MapPin {
  id: string
  lat: number
  lng: number
  price: number
  currency: string
  pricePeriod: PricePeriod
  type: ListingType
  primaryPhoto: string | null
  title: string
  bedrooms: number | null
}

export interface InquiryFormData {
  message: string
  moveInDate?: string
  name: string
  email: string
  phone: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  details?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export const KENYA_CITIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
  "Thika", "Malindi", "Kitale", "Garissa", "Kakamega",
] as const

export const NAIROBI_NEIGHBOURHOODS = [
  "Westlands", "Kilimani", "Karen", "Lavington", "Kileleshwa",
  "Parklands", "Upperhill", "CBD", "South B", "South C",
  "Langata", "Runda", "Muthaiga", "Spring Valley", "Gigiri",
  "Roysambu", "Kasarani", "Embakasi", "Umoja", "Donholm",
  "Buruburu", "Eastleigh", "Ngong Road", "Dagoretti",
] as const

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  RESIDENTIAL: "Residential",
  OFFICE: "Office Space",
  COMMERCIAL: "Commercial",
  SHORT_TERM: "Short-term",
}

export const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  NIGHTLY: "/ night",
  WEEKLY: "/ week",
  MONTHLY: "/ month",
  YEARLY: "/ year",
}
